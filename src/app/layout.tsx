import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "@/features/core/components/command-palette";
import { GlobalDropzone } from "@/features/core/components/global-dropzone";
import { ShortcutHelpOverlay } from "@/features/core/components/shortcut-help-overlay";
import { getSession } from "@/features/auth/utils/session";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KoalaSnippets",
  description: "Self-hosted snippet management application",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  let theme = "theme-midnight";
  let bgPattern = "matrix";

  if (session?.user?.preferences) {
    theme = session.user.preferences.appTheme ?? "theme-midnight";
    bgPattern = session.user.preferences.bgPattern ?? "matrix";
  } else {
    const cookieStore = await cookies();
    const appearanceCookie = cookieStore.get("koala_appearance");
    if (appearanceCookie?.value) {
      try {
        const prefs = JSON.parse(decodeURIComponent(appearanceCookie.value));
        if (prefs.appTheme) theme = prefs.appTheme;
        if (prefs.bgPattern) bgPattern = prefs.bgPattern;
      } catch {
        // ignore parse error
      }
    }
  }

  const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).get();
  const globalAnnouncement = settings?.globalAnnouncement;

  return (
    <html lang="en" className={`${theme} bg-pattern-${bgPattern}`} suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ToastProvider>
          {globalAnnouncement && (
            <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-medium relative z-50 shadow-sm border-b border-primary/20">
              {globalAnnouncement}
            </div>
          )}
          {children}
          <CommandPalette />
          <ShortcutHelpOverlay />
          <GlobalDropzone />
        </ToastProvider>
      </body>
    </html>
  );
}
