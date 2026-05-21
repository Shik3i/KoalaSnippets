import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminMetrics } from "@/components/admin/admin-metrics";
import { AdminUserList } from "@/components/admin/admin-user-list";
import { AdminBackupList } from "@/components/admin/admin-backup-list";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={true} isAdmin={true} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System metrics, user management, and backups</p>
          </div>

          <AdminMetrics />
          <AdminUserList />
          <AdminBackupList />
        </div>
      </div>
    </div>
  );
}
