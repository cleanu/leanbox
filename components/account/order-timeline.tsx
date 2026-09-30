import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { FULFILMENT_FLOW } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export function OrderTimeline({ status, stamps }: { status: OrderStatus; stamps: Partial<Record<OrderStatus, string | null>> }) {
  const t = useTranslations("orders.status");
  const current = FULFILMENT_FLOW.indexOf(status);
  const steps: OrderStatus[] = ["pending_payment", ...FULFILMENT_FLOW];
  const reached = (i: number) => (status === "pending_payment" ? i === 0 : i <= current + 1);

  return (
    <ol className="relative space-y-6">
      {steps.map((s, i) => {
        const done = reached(i);
        const active = (status === "pending_payment" && i === 0) || i === current + 1;
        return (
          <li key={s} className="relative flex items-start gap-4">
            {i < steps.length - 1 ? (
              <span aria-hidden className={cn("absolute left-[0.8rem] top-7 h-[calc(100%+0.5rem)] w-px", done && reached(i + 1) ? "bg-olive" : "bg-line")} />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid size-[1.65rem] shrink-0 place-items-center rounded-full border text-[0.7rem]",
                done ? "border-olive bg-olive text-parchment" : "border-line-strong bg-parchment text-mute",
                active && "ring-4 ring-olive/15",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm", done ? "text-ink" : "text-mute")}>{t(s === "pending_payment" ? "pending_payment" : s)}</p>
              {stamps[s] ? <p className="text-xs text-mute">{stamps[s]}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
