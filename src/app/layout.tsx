import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "@/features/core/components/command-palette";
import { getSession } from "@/features/auth/utils/session";
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

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
          <CommandPalette isAdmin={isAdmin} />
        </ToastProvider>
      </body>
    </html>
  );
}
