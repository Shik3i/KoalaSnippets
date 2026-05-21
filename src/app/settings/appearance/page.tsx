import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { AppearanceSettingsForm } from "@/features/core/components/appearance-settings-form";

export const dynamic = "force-dynamic";

export default async function AppearanceSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const prefs = session.user.preferences;
  const initialPreferences = {
    appTheme: prefs?.appTheme ?? "theme-dark",
    snippetDensity: (prefs?.snippetDensity ?? "compact") as "compact" | "preview" | "full",
    syntaxTheme: prefs?.syntaxTheme ?? "github-dark",
    bgPattern: prefs?.bgPattern ?? "flat",
  };

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={true} isAdmin={session.user.role === "ADMIN"} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Appearance Settings</h1>
            <p className="text-muted-foreground mt-1">Customize the visual presentation of KoalaSnippets</p>
          </div>
          
          <AppearanceSettingsForm initialPreferences={initialPreferences} />
        </div>
      </div>
    </div>
  );
}
