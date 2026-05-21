"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/features/core/utils/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FileCode,
  Globe,
  Plus,
  ChevronRight,
  Menu,
  X,
  Settings,
  LogOut,
  BarChart3,
  Shield,
  Palette,
  Search,
} from "lucide-react";

interface SidebarProps {
  tags?: string[];
  languages?: string[];
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  onTagClick?: (tag: string) => void;
  onLanguageClick?: (language: string) => void;
}

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "My Snippets", icon: FileCode },
  { href: "/public", label: "Public Explorer", icon: Globe },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
];

export function Sidebar({ tags = [], languages = [], isAuthenticated = false, isAdmin = false, onTagClick, onLanguageClick }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} suppressHydrationWarning /> : <Menu size={20} suppressHydrationWarning />}
      </button>

      <button
        className="fixed top-4 right-4 z-50 p-2 rounded-md bg-card border border-border lg:hidden flex items-center justify-center cursor-pointer"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }}
        aria-label="Open Command Palette Search"
      >
        <Search size={20} suppressHydrationWarning />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-lg">KoalaSnippets</span>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            if (item.href === "/dashboard" && !isAuthenticated) {
              return null;
            }
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} suppressHydrationWarning />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated && (
          <div className="px-3 py-2">
            <Button className="w-full gap-2" size="sm" asChild>
              <Link href="/dashboard/new" onClick={() => setMobileOpen(false)}>
                <Plus size={14} suppressHydrationWarning />
                New Snippet
              </Link>
            </Button>
          </div>
        )}

        {languages.length > 0 && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Languages
            </h3>
            <div className="space-y-0.5">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onLanguageClick?.(lang);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <ChevronRight size={12} suppressHydrationWarning />
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onTagClick?.(tag);
                    setMobileOpen(false);
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Badge variant="outline" className="cursor-pointer text-xs" aria-label={`Filter by tag: ${tag}`}>
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-border">
          <div className="p-3 space-y-1">
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === "/admin"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Shield size={16} suppressHydrationWarning />
                Admin Dashboard
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    pathname === "/settings"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings size={16} suppressHydrationWarning />
                  Security Settings
                </Link>
                <Link
                  href="/settings/appearance"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    pathname === "/settings/appearance"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Palette size={16} suppressHydrationWarning />
                  Appearance Settings
                </Link>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut size={16} suppressHydrationWarning />
                  Sign Out
                </button>
              </>
            ) : (
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
              </Button>
            )}
          </div>
          <div className="px-3 pb-3">
            <div className="flex gap-3 text-xs text-muted-foreground px-2 mb-1">
              <Link href="/impressum" className="hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Datenschutz
              </Link>
            </div>
            <div className="text-xs text-muted-foreground px-2 flex items-center justify-between">
              <span>Self-hosted &middot; Zero CDN &middot; Private</span>
              <a
                href="https://github.com/Shik3i/KoalaSnippets"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                aria-label="GitHub Repository"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
