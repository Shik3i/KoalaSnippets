import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { PasswordChangeForm } from "@/features/auth/components/password-change-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={true} isAdmin={session.user.role === "ADMIN"} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings</p>
          </div>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
}
