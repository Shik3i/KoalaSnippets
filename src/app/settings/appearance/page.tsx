import { cookies } from "next/headers";
import { getSession } from "@/features/auth/utils/session";
import { Sidebar } from "@/features/core/components/sidebar";
import { AppearanceSettingsForm } from "@/features/core/components/appearance-settings-form";

export const dynamic = "force-dynamic";

export default async function AppearanceSettingsPage() {
  const session = await getSession();
  
  let initialPreferences = {
    appTheme: "theme-midnight",
    snippetDensity: "preview" as "compact" | "preview" | "full",
    syntaxTheme: "github-dark",
    bgPattern: "matrix",
  };

  if (session?.user?.preferences) {
    const prefs = session.user.preferences;
    initialPreferences = {
      appTheme: prefs.appTheme ?? "theme-midnight",
      snippetDensity: (prefs.snippetDensity ?? "preview") as "compact" | "preview" | "full",
      syntaxTheme: prefs.syntaxTheme ?? "github-dark",
      bgPattern: prefs.bgPattern ?? "matrix",
    };
  } else {
    const cookieStore = await cookies();
    const appearanceCookie = cookieStore.get("koala_appearance");
    if (appearanceCookie?.value) {
      try {
        const prefs = JSON.parse(decodeURIComponent(appearanceCookie.value));
        if (prefs.appTheme) initialPreferences.appTheme = prefs.appTheme;
        if (prefs.snippetDensity) initialPreferences.snippetDensity = prefs.snippetDensity;
        if (prefs.syntaxTheme) initialPreferences.syntaxTheme = prefs.syntaxTheme;
        if (prefs.bgPattern) initialPreferences.bgPattern = prefs.bgPattern;
      } catch {
        // ignore parse error
      }
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar isAuthenticated={!!session} isAdmin={session?.user?.role === "ADMIN"} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Appearance Settings</h1>
            <p className="text-muted-foreground mt-1">Customize the visual presentation of KoalaSnippets</p>
          </div>
          
          <AppearanceSettingsForm initialPreferences={initialPreferences} isAuthenticated={!!session} />
        </div>
      </div>
    </div>
  );
}
