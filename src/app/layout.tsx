import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "@/features/core/components/command-palette";
import { GlobalDropzone } from "@/features/core/components/global-dropzone";
import { ShortcutHelpOverlay } from "@/features/core/components/shortcut-help-overlay";
import { ReferrerTracker } from "@/features/core/components/breadcrumb";
import { I18nProvider } from "@/features/core/i18n";
import { ThemeShortcutHandler } from "@/features/core/components/theme-shortcut-handler";
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
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "KoalaSnippets",
    template: "%s | KoalaSnippets",
  },
  description: "The cure for Notepad++ tab hell — a self-hosted snippet manager for all those unnamed code files. Store, organize, and share code snippets with syntax highlighting, tags, and full-text search.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://snippets.koalastuff.net"),
  openGraph: {
    title: "KoalaSnippets",
    description: "Self-hosted snippet manager with syntax highlighting, tags, search, and collections. Finally get rid of those thousands of unnamed files.",
    type: "website",
    siteName: "KoalaSnippets",
    images: [
      {
        url: "/MainLogo.png",
        width: 120,
        height: 120,
        alt: "KoalaSnippets Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "KoalaSnippets",
    description: "Self-hosted snippet manager for code. Organize, tag, search, and share your code snippets.",
    images: ["/MainLogo.png"],
  },
  icons: {
    icon: "/favicon-v3.png",
    apple: "/apple-icon-v3.png",
    shortcut: "/favicon-v3.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

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
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ToastProvider>
          {globalAnnouncement && (
            <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-medium relative z-50 shadow-sm border-b border-primary/20">
              {globalAnnouncement}
            </div>
          )}
          <I18nProvider>
            {children}
            <ReferrerTracker />
            <CommandPalette />
            <ShortcutHelpOverlay />
            <GlobalDropzone />
            <ThemeShortcutHandler />
          </I18nProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
