import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMealForm, MealForm } from "@/components/admin/meal-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "編輯餐點" };

export default async function EditMealPage({ params, searchParams }: PageProps<"/admin/meals/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: meal } = await createAdminClient().from("meals").select("*").eq("id", id).maybeSingle();
  if (!meal) notFound();
  return (
    <div>
      <Link href="/admin/meals" className="mb-4 inline-flex items-center gap-2 text-sm text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> 返回餐點
      </Link>
      <AdminPageHeader title={meal.name_zh} description={meal.name_en} />
      <MealForm meal={meal} saved={sp.created === "1"} />
      <div className="mt-8 max-w-md">
        <DeleteMealForm id={meal.id} />
      </div>
    </div>
  );
}
