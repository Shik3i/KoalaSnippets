"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

interface SidebarProps {
  tags?: string[];
  languages?: string[];
  isAuthenticated?: boolean;
  onTagClick?: (tag: string) => void;
  onLanguageClick?: (language: string) => void;
}

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "My Snippets", icon: FileCode },
  { href: "/public", label: "Public Explorer", icon: Globe },
];

export function Sidebar({ tags = [], languages = [], isAuthenticated = false, onTagClick, onLanguageClick }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated && (
          <div className="px-3 py-2">
            <Button className="w-full gap-2" size="sm" asChild>
              <Link href="/dashboard/new" onClick={() => setMobileOpen(false)}>
                <Plus size={14} />
                New Snippet
              </Link>
            </Button>
          </div>
        )}

        {languages.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
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
                  <ChevronRight size={12} />
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="px-3 py-2 border-t border-border">
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
                  <Badge variant="outline" className="cursor-pointer text-xs">
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-border">
          <div className="p-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut size={16} />
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
            <div className="text-xs text-muted-foreground px-2">
              Self-hosted &middot; Zero CDN &middot; Private
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
