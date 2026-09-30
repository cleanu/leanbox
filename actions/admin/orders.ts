"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/env.server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, TablesUpdate } from "@/lib/supabase/database.types";
import { getStripe } from "@/lib/stripe/server";
import { orderStatusSchema } from "@/lib/validation";

export type AdminActionState = { ok?: boolean; message?: string; error?: string };

const idSchema = z.uuid();

function timestampsFor(status: OrderStatus): TablesUpdate<"orders"> {
  const now = new Date().toISOString();
  switch (status) {
    case "delivered":
      return { delivered_at: now };
    case "cancelled":
      return { cancelled_at: now };
    case "refunded":
      return { refunded_at: now };
    case "paid":
      return {};
    default:
      return {};
  }
}

export async function updateOrderStatusAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user } = await requireAdmin();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  const status = orderStatusSchema.safeParse(formData.get("status"));
  if (!orderId.success || !status.success) return { error: "資料不正確" };

  const admin = createAdminClient();
  const { data: before } = await admin.from("orders").select("status, paid_at").eq("id", orderId.data).maybeSingle();
  if (!before) return { error: "找不到訂單" };
  if (before.status === status.data) return { ok: true };
  if (status.data !== "cancelled" && status.data !== "pending_payment" && !before.paid_at && status.data !== "refunded") {
    return { error: "未付款的訂單不能標記為已付款／準備中／送遞中／已送達（付款由 Stripe webhook 確認）" };
  }

  const { error } = await admin
    .from("orders")
    .update({ status: status.data, ...timestampsFor(status.data) })
    .eq("id", orderId.data);
  if (error) return { error: error.message };

  await audit(user.id, "order.status", "orders", orderId.data, { from: before.status, to: status.data });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId.data}`);
  revalidatePath("/admin");
  return { ok: true, message: "狀態已更新" };
}

export async function addOrderNoteAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user } = await requireAdmin();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  const body = z.string().trim().min(1).max(2000).safeParse(formData.get("body"));
  if (!orderId.success || !body.success) return { error: "請輸入備註內容" };

  const { error } = await createAdminClient().from("order_notes").insert({ order_id: orderId.data, author_id: user.id, body: body.data });
  if (error) return { error: error.message };
  await audit(user.id, "order.note", "orders", orderId.data, { length: body.data.length });
  revalidatePath(`/admin/orders/${orderId.data}`);
  return { ok: true, message: "已加入備註" };
}

/**
 * Full refund. With a PaymentIntent + Stripe configured we call
 * stripe.refunds.create (charge.refunded then reconciles via webhook);
 * otherwise we record the intent and the admin refunds in the Dashboard.
 */
export async function refundOrderAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { user } = await requireAdmin();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { error: "資料不正確" };
  if (formData.get("confirm") !== "on") return { error: "請先勾選確認退款" };
  const reason = String(formData.get("reason") ?? "").slice(0, 500);

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, paid_at, total_cents, refunded_cents, stripe_payment_intent_id")
    .eq("id", orderId.data)
    .maybeSingle();
  if (!order) return { error: "找不到訂單" };
  if (!order.paid_at) return { error: "訂單未付款，無需退款" };
  if (order.status === "refunded" || order.refunded_cents >= order.total_cents) return { error: "此訂單已全額退款" };

  if (order.stripe_payment_intent_id && isStripeConfigured()) {
    try {
      const refund = await getStripe().refunds.create(
        {
          payment_intent: order.stripe_payment_intent_id,
          reason: "requested_by_customer",
          metadata: { order_id: order.id, admin_id: user.id },
        },
        { idempotencyKey: `refund-${order.id}` },
      );
      await admin
        .from("orders")
        .update({ status: "refunded", refunded_cents: refund.amount, refunded_at: new Date().toISOString() })
        .eq("id", order.id);
      await audit(user.id, "order.refund", "orders", order.id, { refund_id: refund.id, amount: refund.amount, reason, via: "stripe_api" });
      revalidatePath(`/admin/orders/${order.id}`);
      return { ok: true, message: `已透過 Stripe 退款（${refund.id}）` };
    } catch (err) {
      return { error: `Stripe 退款失敗：${(err as Error).message}` };
    }
  }

  await admin.from("order_notes").insert({
    order_id: order.id,
    author_id: user.id,
    body: `【退款意向】${reason || "（未填原因）"}——請於 Stripe Dashboard → Payments 手動退款；charge.refunded webhook 會自動更新狀態。`,
  });
  await audit(user.id, "order.refund_intent", "orders", order.id, { reason });
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true, message: "已記錄退款意向，請於 Stripe Dashboard 完成退款。" };
}
