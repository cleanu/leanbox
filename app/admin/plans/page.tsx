import { PlanForm } from "@/components/admin/plan-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "計劃" };

export default async function AdminPlansPage() {
  await requireAdmin();
  const { data: plans } = await createAdminClient().from("plans").select("*").order("sort_order", { ascending: true });
  return (
    <div>
      <AdminPageHeader title="每週計劃" description="修改價錢後，記得在 Stripe 建立新的循環價錢並更新 Price ID（Stripe 價錢不可修改金額）。" />
      <div className="grid gap-6 xl:grid-cols-2">
        {(plans ?? []).map((p) => (
          <PlanForm key={p.id} plan={p} />
        ))}
      </div>
    </div>
  );
}
