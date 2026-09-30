import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { resetWeeklyStockAction, toggleMealActiveAction } from "@/actions/admin/meals";
import { AdminPageHeader, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { mealImageUrl } from "@/lib/catalog/images";
import { formatHKD } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "餐點" };

export default async function AdminMealsPage({ searchParams }: PageProps<"/admin/meals">) {
  await requireAdmin();
  const sp = await searchParams;
  const { data: meals } = await createAdminClient().from("meals").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <AdminPageHeader
        title="餐點"
        description="價錢、成本、庫存與上架狀態。成本只在後台可見。"
        actions={
          <Link href="/admin/meals/new" className={buttonClass({ size: "sm" })}>
            <Plus className="size-3.5" aria-hidden /> 新增餐點
          </Link>
        }
      />
      {sp.deleted ? <p className="mb-4 rounded-xl bg-olive-soft px-4 py-3 text-sm text-olive-2">已刪除餐點。</p> : null}

      <form action={resetWeeklyStockAction} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-[#FBF8F2] p-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-mute">新一週：將所有上架餐點的庫存重設為</span>
          <input name="stock" type="number" min={0} defaultValue={50} className="field h-10 w-32 py-0 text-sm" />
        </label>
        <button type="submit" className={buttonClass({ variant: "outline", size: "sm", className: "h-10" })}>
          重設庫存
        </button>
      </form>

      <Table>
        <thead>
          <tr>
            <Th>餐點</Th>
            <Th>標籤</Th>
            <Th className="text-right">售價</Th>
            <Th className="text-right">成本</Th>
            <Th className="text-right">毛利率</Th>
            <Th className="text-right">本週庫存</Th>
            <Th>狀態</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {(meals ?? []).map((m) => {
            const margin = m.price_cents ? Math.round(((m.price_cents - m.cost_cents) / m.price_cents) * 100) : 0;
            const src = mealImageUrl(m.image_path);
            return (
              <tr key={m.id} className={cn("hover:bg-white", !m.is_active && "opacity-60")}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-parchment-3">
                      <Image src={src} alt="" fill sizes="44px" className="object-cover" unoptimized={src.startsWith("http")} />
                    </div>
                    <div>
                      <Link href={`/admin/meals/${m.id}`} className="link-underline font-medium">
                        {m.name_zh}
                      </Link>
                      <p className="text-[0.7rem] text-mute">{m.name_en}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {m.tags.map((t) => (
                      <Badge key={t} tone="muted">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="numeral text-right">{formatHKD(m.price_cents)}</Td>
                <Td className="numeral text-right text-mute">{formatHKD(m.cost_cents)}</Td>
                <Td className={cn("numeral text-right", margin < 50 && "text-danger")}>{margin}%</Td>
                <Td className={cn("numeral text-right", m.weekly_stock === 0 && "text-danger")}>{m.weekly_stock === 0 ? "已滿 0" : m.weekly_stock}</Td>
                <Td>
                  <form action={toggleMealActiveAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="active" value={String(!m.is_active)} />
                    <button type="submit" className="text-xs" aria-label={m.is_active ? "下架" : "上架"}>
                      <Badge tone={m.is_active ? "olive" : "muted"}>{m.is_active ? "上架中" : "已下架"}</Badge>
                    </button>
                  </form>
                </Td>
                <Td className="text-right">
                  <Link href={`/admin/meals/${m.id}`} className="text-xs text-mute hover:text-ink">
                    編輯
                  </Link>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
