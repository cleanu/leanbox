"use client";

import { useActionState, useEffect, useRef } from "react";
import { addOrderNoteAction, refundOrderAction, updateOrderStatusAction, type AdminActionState } from "@/actions/admin/orders";
import { Button } from "@/components/ui/button";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import type { OrderStatus } from "@/lib/supabase/database.types";

function Result({ state }: { state: AdminActionState }) {
  if (state.error) return <FormAlert>{state.error}</FormAlert>;
  if (state.message) return <FormAlert tone="success">{state.message}</FormAlert>;
  return null;
}

export function QuickStatus({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateOrderStatusAction, {});
  const btn = (to: OrderStatus, label: string, variant: "olive" | "outline" | "danger" = "outline") => (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={to} />
      <Button type="submit" size="sm" variant={variant} disabled={pending || status === to}>
        {label}
      </Button>
    </form>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {btn("preparing", "準備中")}
        {btn("out_for_delivery", "送遞中")}
        {btn("delivered", "標記已送達", "olive")}
        {btn("cancelled", "取消訂單", "outline")}
      </div>
      <Result state={state} />
    </div>
  );
}

export function NoteForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<AdminActionState, FormData>(addOrderNoteAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <textarea name="body" rows={3} maxLength={2000} required placeholder="內部備註（客戶看不到）" className="field text-sm" />
      <div className="flex items-center justify-between gap-3">
        <Result state={state} />
        <SubmitButton size="sm" variant="outline">
          加入備註
        </SubmitButton>
      </div>
    </form>
  );
}

export function RefundForm({ orderId, canCallStripe, amount }: { orderId: string; canCallStripe: boolean; amount: string }) {
  const [state, action] = useActionState<AdminActionState, FormData>(refundOrderAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-xs leading-relaxed text-mute">
        {canCallStripe
          ? `將透過 Stripe API 全額退款 ${amount}。完成後 charge.refunded webhook 會同步狀態。`
          : "此訂單沒有 Stripe PaymentIntent（或 Stripe 未設定）。系統會記錄退款意向，請於 Stripe Dashboard → Payments 手動退款。"}
      </p>
      <input name="reason" maxLength={500} placeholder="退款原因（內部）" className="field h-10 py-0 text-sm" />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="confirm" className="size-4 accent-danger" />
        我確認要全額退款此訂單
      </label>
      <SubmitButton size="sm" variant="danger">
        {canCallStripe ? "於 Stripe 全額退款" : "記錄退款意向"}
      </SubmitButton>
      <Result state={state} />
    </form>
  );
}
