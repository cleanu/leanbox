"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { deleteMealAction, saveMealAction, type MealFormState } from "@/actions/admin/meals";
import { FieldRow } from "@/components/admin/ui";
import { FormAlert, SubmitButton, submitWithoutReset } from "@/components/ui/form";
import { mealImageUrl } from "@/lib/catalog/images";
import type { Tables } from "@/lib/supabase/database.types";
import { MEAL_TAGS } from "@/lib/tags";

type Meal = Tables<"meals">;

const cents = (v: number | undefined) => (v === undefined ? "" : (v / 100).toFixed(v % 100 ? 2 : 0));

export function MealForm({ meal, saved }: { meal?: Meal; saved?: boolean }) {
  const [state, action, pending] = useActionState<MealFormState, FormData>(saveMealAction, {});
  const [, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const f = state.fields ?? {};
  const [price, setPrice] = useState(cents(meal?.price_cents));
  const [cost, setCost] = useState(cents(meal?.cost_cents));
  const p = Number(price) || 0;
  const c = Number(cost) || 0;
  const marginPct = p > 0 ? Math.round(((p - c) / p) * 100) : 0;

  return (
    <form onSubmit={submitWithoutReset(action, startTransition)} className="grid gap-6 xl:grid-cols-3">
      <input type="hidden" name="id" value={meal?.id ?? ""} />
      <div className="space-y-6 rounded-2xl border border-line bg-[#FBF8F2] p-6 xl:col-span-2">
        {state.error ? <FormAlert>{state.error}</FormAlert> : null}
        {state.ok || saved ? <FormAlert tone="success">已儲存</FormAlert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="中文名稱" error={f.name_zh} htmlFor="name_zh">
            <input id="name_zh" name="name_zh" defaultValue={meal?.name_zh} required className="field h-10 py-0 text-sm" />
          </FieldRow>
          <FieldRow label="英文名稱" error={f.name_en} htmlFor="name_en">
            <input id="name_en" name="name_en" defaultValue={meal?.name_en} required className="field h-10 py-0 text-sm" />
          </FieldRow>
          <FieldRow label="Slug（網址）" error={f.slug} hint="小楷英文、數字及連字號" htmlFor="slug">
            <input id="slug" name="slug" defaultValue={meal?.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="field h-10 py-0 font-mono text-sm" />
          </FieldRow>
          <FieldRow label="排序" error={f.sort_order} hint="數字越小越前" htmlFor="sort_order">
            <input id="sort_order" name="sort_order" type="number" defaultValue={meal?.sort_order ?? 100} className="field h-10 py-0 text-sm" />
          </FieldRow>
          <FieldRow label="中文描述" htmlFor="description_zh">
            <textarea id="description_zh" name="description_zh" rows={3} defaultValue={meal?.description_zh} className="field text-sm" />
          </FieldRow>
          <FieldRow label="英文描述" htmlFor="description_en">
            <textarea id="description_en" name="description_en" rows={3} defaultValue={meal?.description_en} className="field text-sm" />
          </FieldRow>
          <FieldRow label="材料（中文）" hint="每行一項，格式：名稱 — 份量" htmlFor="ingredients_zh">
            <textarea id="ingredients_zh" name="ingredients_zh" rows={5} defaultValue={meal?.ingredients_zh} className="field text-sm" />
          </FieldRow>
          <FieldRow label="材料（英文）" hint="One per line, format: Name — Amount" htmlFor="ingredients_en">
            <textarea id="ingredients_en" name="ingredients_en" rows={5} defaultValue={meal?.ingredients_en} className="field text-sm" />
          </FieldRow>
          <FieldRow label="致敏原" hint="以逗號分隔，例如：大豆, 芝麻, 麩質" htmlFor="allergens">
            <input id="allergens" name="allergens" defaultValue={meal?.allergens.join(", ")} className="field h-10 py-0 text-sm" />
          </FieldRow>
          <fieldset>
            <legend className="mb-1.5 block text-xs font-medium text-walnut">標籤</legend>
            <div className="flex flex-wrap gap-2">
              {MEAL_TAGS.map((t) => (
                <label key={t.value} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-xs has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-parchment">
                  <input type="checkbox" name="tags" value={t.value} defaultChecked={meal?.tags.includes(t.value)} className="sr-only" />
                  {t.value}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-4">
          {(["kcal", "protein_g", "carbs_g", "fat_g"] as const).map((k) => (
            <FieldRow key={k} label={{ kcal: "熱量 kcal", protein_g: "蛋白質 g", carbs_g: "碳水 g", fat_g: "脂肪 g" }[k]} error={f[k]} htmlFor={k}>
              <input id={k} name={k} type="number" min={0} defaultValue={meal?.[k] ?? 0} className="field h-10 py-0 text-sm" />
            </FieldRow>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-line bg-[#FBF8F2] p-6">
          <FieldRow label="售價 (HKD)" error={f.price} htmlFor="price">
            <input id="price" name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required className="field h-10 py-0 text-sm" />
          </FieldRow>
          <FieldRow label="成本 COGS (HKD)" error={f.cost} hint="只在後台顯示，不會傳送到客戶端" htmlFor="cost">
            <input id="cost" name="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} required className="field h-10 py-0 text-sm" />
          </FieldRow>
          <p className="rounded-xl bg-parchment-2 px-4 py-3 text-xs">
            每份毛利 <span className="numeral text-sm">HK${(p - c).toFixed(2)}</span> · 毛利率 <span className="numeral text-sm">{marginPct}%</span>
          </p>
          <FieldRow label="本週庫存（份）" error={f.weekly_stock} hint="0 = 顯示「本週已滿」" htmlFor="weekly_stock">
            <input id="weekly_stock" name="weekly_stock" type="number" min={0} defaultValue={meal?.weekly_stock ?? 50} className="field h-10 py-0 text-sm" />
          </FieldRow>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={meal?.is_active ?? true} className="size-4 accent-olive" />
            上架（於餐單顯示）
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-line bg-[#FBF8F2] p-6">
          <p className="text-xs font-medium text-walnut">相片</p>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-parchment-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={preview} alt="" className="size-full object-cover" />
            ) : meal?.image_path ? (
              <Image src={mealImageUrl(meal.image_path)} alt="" fill sizes="320px" className="object-cover" unoptimized={mealImageUrl(meal.image_path).startsWith("http")} />
            ) : null}
          </div>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-parchment"
          />
          {f.image ? <p className="text-xs text-danger">{f.image}</p> : null}
          <FieldRow label="或圖片路徑" hint="/food/xxx.jpg（public 資料夾）或 Storage 路徑" htmlFor="image_path">
            <input id="image_path" name="image_path" defaultValue={meal?.image_path ?? ""} className="field h-10 py-0 font-mono text-xs" />
          </FieldRow>
        </div>

        <SubmitButton className="w-full" size="md" pendingLabel="儲存中…" pending={pending}>
          {meal ? "儲存變更" : "新增餐點"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function DeleteMealForm({ id }: { id: string }) {
  const [state, action] = useActionState<MealFormState, FormData>(deleteMealAction, {});
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-danger/30 bg-danger-soft/40 p-6">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm font-medium text-danger">刪除餐點</p>
      <p className="text-xs text-mute">建議先「下架」。刪除後過往訂單仍保留名稱及價錢快照。</p>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="confirm" className="size-4 accent-danger" /> 我確認要永久刪除
      </label>
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <SubmitButton size="sm" variant="danger">
        刪除
      </SubmitButton>
    </form>
  );
}
