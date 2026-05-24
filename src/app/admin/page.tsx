import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { AdminMetrics } from "@/features/admin/components/admin-metrics";
import { AdminPublicSnippets } from "@/features/admin/components/admin-public-snippets";
import { AdminSettings } from "@/features/admin/components/admin-settings";
import { AdminUserList } from "@/features/admin/components/admin-user-list";
import { AdminBackupList } from "@/features/admin/components/admin-backup-list";
import { AdminAuditLog } from "@/features/admin/components/admin-audit-log";

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
            <p className="text-muted-foreground mt-1">System metrics, global settings, moderation, user management, and backups</p>
          </div>

          <AdminMetrics />
          <AdminAuditLog />
          <AdminSettings />
          <AdminPublicSnippets />
          <AdminUserList />
          <AdminBackupList />
        </div>
      </div>
    </div>
  );
}
