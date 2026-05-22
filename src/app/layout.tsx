import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "@/features/core/components/command-palette";
import { getSession } from "@/features/auth/utils/session";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const theme = session?.user?.preferences?.appTheme ?? "theme-dark";
  const bgPattern = session?.user?.preferences?.bgPattern ?? "flat";

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
          <CommandPalette isAdmin={isAdmin} />
        </ToastProvider>
      </body>
    </html>
  );
}
