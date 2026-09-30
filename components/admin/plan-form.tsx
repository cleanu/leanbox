"use client";

import { useActionState, useTransition } from "react";
import { savePlanAction, type PlanFormState } from "@/actions/admin/plans";
import { FieldRow } from "@/components/admin/ui";
import { FormAlert, SubmitButton, submitWithoutReset } from "@/components/ui/form";
import type { Tables } from "@/lib/supabase/database.types";

const hkd = (c: number) => (c / 100).toFixed(c % 100 ? 2 : 0);

export function PlanForm({ plan }: { plan: Tables<"plans"> }) {
  const [state, action, pending] = useActionState<PlanFormState, FormData>(savePlanAction, {});
  const [, startTransition] = useTransition();
  const f = state.fields ?? {};
  const perMeal = plan.meals_per_week ? plan.price_cents / plan.meals_per_week : 0;
  return (
    <form onSubmit={submitWithoutReset(action, startTransition)} className="space-y-5 rounded-2xl border border-line bg-[#FBF8F2] p-6">
      <input type="hidden" name="id" value={plan.id} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-2xl">{plan.name_zh}</p>
        <p className="font-mono text-xs text-mute">{plan.slug}</p>
      </div>
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.ok ? <FormAlert tone="success">已儲存</FormAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow label="中文名稱" htmlFor={`nzh-${plan.id}`}>
          <input id={`nzh-${plan.id}`} name="name_zh" defaultValue={plan.name_zh} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="英文名稱" htmlFor={`nen-${plan.id}`}>
          <input id={`nen-${plan.id}`} name="name_en" defaultValue={plan.name_en} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="中文描述" htmlFor={`dzh-${plan.id}`}>
          <input id={`dzh-${plan.id}`} name="description_zh" defaultValue={plan.description_zh} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="英文描述" htmlFor={`den-${plan.id}`}>
          <input id={`den-${plan.id}`} name="description_en" defaultValue={plan.description_en} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="每週餐數" error={f.meals_per_week} htmlFor={`mpw-${plan.id}`}>
          <input id={`mpw-${plan.id}`} name="meals_per_week" type="number" min={1} defaultValue={plan.meals_per_week} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="排序" htmlFor={`so-${plan.id}`}>
          <input id={`so-${plan.id}`} name="sort_order" type="number" defaultValue={plan.sort_order} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="每週價錢 (HKD)" error={f.price} hint={`約 HK$${(perMeal / 100).toFixed(1)}／餐`} htmlFor={`pr-${plan.id}`}>
          <input id={`pr-${plan.id}`} name="price" defaultValue={hkd(plan.price_cents)} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="每週估算成本 COGS (HKD)" error={f.cost} htmlFor={`co-${plan.id}`}>
          <input id={`co-${plan.id}`} name="cost" defaultValue={hkd(plan.cost_cents)} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <div className="sm:col-span-2">
          <FieldRow
            label="Stripe Price ID（每週循環）"
            error={f.stripe_price_id}
            hint="Stripe → Products → 價錢 → price_…。留空時結帳會以 price_data 建立臨時價錢（只建議用於測試）。"
            htmlFor={`sp-${plan.id}`}
          >
            <input id={`sp-${plan.id}`} name="stripe_price_id" defaultValue={plan.stripe_price_id ?? ""} placeholder="price_…" className="field h-10 py-0 font-mono text-sm" />
          </FieldRow>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_featured" defaultChecked={plan.is_featured} className="size-4 accent-olive" /> 主打
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked={plan.is_active} className="size-4 accent-olive" /> 上架
          </label>
        </div>
        <SubmitButton size="sm" pendingLabel="儲存中…" pending={pending}>
          儲存
        </SubmitButton>
      </div>
    </form>
  );
}
