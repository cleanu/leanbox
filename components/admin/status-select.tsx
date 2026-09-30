"use client";

import { useActionState, useRef } from "react";
import { updateOrderStatusAction, type AdminActionState } from "@/actions/admin/orders";
import { STATUS_LABEL_ZH } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { ORDER_STATUSES } from "@/lib/validation";
import { cn } from "@/lib/utils";

/** Inline status dropdown; submits on change. */
export function StatusSelect({ orderId, status, compact }: { orderId: string; status: OrderStatus; compact?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateOrderStatusAction, {});
  return (
    <form ref={formRef} action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        key={status}
        name="status"
        defaultValue={status}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="訂單狀態"
        className={cn("field w-auto py-1.5 pl-3 text-xs", compact ? "h-8" : "h-10 text-sm")}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL_ZH[s]}
          </option>
        ))}
      </select>
      {state.error ? <span className="max-w-56 text-[0.7rem] leading-snug text-danger">{state.error}</span> : null}
    </form>
  );
}
