import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MealForm } from "@/components/admin/meal-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "新增餐點" };

export default async function NewMealPage() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/meals" className="mb-4 inline-flex items-center gap-2 text-sm text-mute hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> 返回餐點
      </Link>
      <AdminPageHeader title="新增餐點" />
      <MealForm />
    </div>
  );
}
