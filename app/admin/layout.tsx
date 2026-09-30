import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "管理後台", template: "%s｜LeanBox 管理後台" }, robots: { index: false, follow: false } };

/** Server-side gate: anyone who isn't an admin (including signed-out visitors) gets a 404. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();
  return (
    <div lang="zh-HK" className="min-h-dvh bg-parchment lg:grid lg:grid-cols-[15rem_1fr]">
      <AdminSidebar email={user.email ?? null} />
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
