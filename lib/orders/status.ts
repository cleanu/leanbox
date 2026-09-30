import type { OrderStatus } from "@/lib/supabase/database.types";

export const FULFILMENT_FLOW: OrderStatus[] = ["paid", "preparing", "out_for_delivery", "delivered"];

export const PAID_STATUSES: OrderStatus[] = ["paid", "preparing", "out_for_delivery", "delivered"];

export function statusTone(status: OrderStatus): "olive" | "saffron" | "ink" | "danger" | "muted" | "default" {
  switch (status) {
    case "pending_payment":
      return "saffron";
    case "paid":
    case "preparing":
      return "default";
    case "out_for_delivery":
      return "ink";
    case "delivered":
      return "olive";
    case "cancelled":
      return "muted";
    case "refunded":
      return "danger";
  }
}

export const STATUS_LABEL_ZH: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款",
  preparing: "準備中",
  out_for_delivery: "送遞中",
  delivered: "已送達",
  cancelled: "已取消",
  refunded: "已退款",
};
