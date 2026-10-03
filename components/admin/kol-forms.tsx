"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { createKolCodeAction, updateKolCodeAction, type KolFormState } from "@/actions/admin/kol";
import { FieldRow } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { FormAlert, SubmitButton, submitWithoutReset } from "@/components/ui/form";
import type { Tables } from "@/lib/supabase/database.types";

export function KolCreateForm() {
  const [state, action, pending] = useActionState<KolFormState, FormData>(createKolCodeAction, {});
  const [, startTransition] = useTransition();
  const [type, setType] = useState<"percent" | "amount">("percent");
  const f = state.fields ?? {};
  return (
    // Re-keyed after each successful create so the fields clear.
    <form key={state.nonce ?? 0} onSubmit={submitWithoutReset(action, startTransition)} className="space-y-4">
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.ok ? <FormAlert tone="success">已建立折扣碼</FormAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FieldRow label="Instagram 帳號" error={f.instagram_handle} htmlFor="kol-new-ig">
          <input id="kol-new-ig" name="instagram_handle" placeholder="amy.eats" autoComplete="off" className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="折扣碼" error={f.code} hint="3–20 個英文字母或數字" htmlFor="kol-new-code">
          <input id="kol-new-code" name="code" placeholder="AMY10" autoComplete="off" className="field h-10 py-0 font-mono text-sm uppercase" />
        </FieldRow>
        <FieldRow label="折扣類型" htmlFor="kol-new-type">
          <select id="kol-new-type" name="discount_type" value={type} onChange={(e) => setType(e.target.value as "percent" | "amount")} className="field h-10 py-0 text-sm">
            <option value="percent">百分比（%）</option>
            <option value="amount">金額（HK$）</option>
          </select>
        </FieldRow>
        <FieldRow
          label={type === "percent" ? "減幾多 %" : "減幾多 HK$"}
          error={f.discount_value}
          hint={type === "percent" ? "連運費一併計算" : "每張訂單／每週計劃各減一次"}
          htmlFor="kol-new-value"
        >
          <input id="kol-new-value" name="discount_value" inputMode="decimal" placeholder={type === "percent" ? "10" : "50"} className="field h-10 py-0 text-sm" />
        </FieldRow>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-xs text-mute">折扣建立後不能修改金額（Stripe 限制）；如要更改，請停用舊碼並建立新碼。</p>
        <SubmitButton size="sm" pendingLabel="建立中…" pending={pending}>
          建立
        </SubmitButton>
      </div>
    </form>
  );
}

export function KolEditForm({ kol, link }: { kol: Tables<"kol_codes">; link: string }) {
  const [state, action, pending] = useActionState<KolFormState, FormData>(updateKolCodeAction, {});
  const [, startTransition] = useTransition();
  const f = state.fields ?? {};
  return (
    <form onSubmit={submitWithoutReset(action, startTransition)} className="space-y-4">
      <input type="hidden" name="id" value={kol.id} />
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.ok ? <FormAlert tone="success">已儲存</FormAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow label="Instagram 帳號" error={f.instagram_handle} htmlFor="kol-ig">
          <input id="kol-ig" name="instagram_handle" defaultValue={kol.instagram_handle} className="field h-10 py-0 text-sm" />
        </FieldRow>
        <FieldRow label="專屬連結" hint="放在 KOL 的 bio；30 日內經此連結結帳會自動填入折扣碼" htmlFor="kol-link">
          <CopyField id="kol-link" value={link} />
        </FieldRow>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={kol.is_active} className="size-4 accent-olive" /> 啟用
          </label>
          <p className="mt-1 text-xs text-mute">停用後不能再使用；已用此碼訂閱計劃的顧客會繼續享有折扣。</p>
        </div>
        <SubmitButton size="sm" pendingLabel="儲存中…" pending={pending}>
          儲存
        </SubmitButton>
      </div>
    </form>
  );
}

function CopyField({ id, value }: { id: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex gap-2">
      <input id={id} readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="field h-10 py-0 font-mono text-xs" />
      <button type="button" onClick={copy} aria-label="複製連結" className={buttonClass({ variant: "outline", size: "sm", className: "h-10 shrink-0 px-3" })}>
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
