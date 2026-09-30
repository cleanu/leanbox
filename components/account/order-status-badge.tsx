import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/supabase/database.types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("orders.status");
  return <Badge tone={statusTone(status)}>{t(status)}</Badge>;
}
