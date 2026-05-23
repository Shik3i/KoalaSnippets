"use client";

import { useState, useEffect } from "react";
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
  Folder,
  PlusCircle,
  Github,
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
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [width, setWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("koalasnippets_sidebar_width");
    if (saved) {
      setTimeout(() => setWidth(parseInt(saved, 10)), 0);
    }
  }, []);

  useEffect(() => {
    if (!isResizing) {
      if (width !== 240) {
        localStorage.setItem("koalasnippets_sidebar_width", width.toString());
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 400) newWidth = 400;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, width]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/collections")
        .then((res) => res.json())
        .then((data) => {
          if (data.collections) setCollections(data.collections);
        });
    }
  }, [isAuthenticated]);

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
          "fixed inset-y-0 left-0 z-40 bg-card border-r border-border flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto relative shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: mobileOpen ? 240 : `${width}px` }}
      >
        {!mobileOpen && (
          <div 
            className="absolute right-[-2px] top-0 bottom-0 w-4 cursor-col-resize z-50 flex justify-center group"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          >
            <div className="w-[2px] h-full bg-transparent group-hover:bg-primary/50 transition-colors" />
          </div>
        )}
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

        {isAuthenticated && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Collections
              </h3>
              <button 
                onClick={async () => {
                  const name = prompt("Enter collection name:");
                  if (!name) return;
                  const res = await fetch("/api/collections", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setCollections(prev => [...prev, data.collection]);
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <PlusCircle size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {collections.length === 0 ? (
                <div className="text-xs text-muted-foreground px-1 py-2">No collections yet</div>
              ) : (
                collections.map((col) => (
                  <button
                    key={col.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('bg-accent/80', 'ring-1', 'ring-primary');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-accent/80', 'ring-1', 'ring-primary');
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-accent/80', 'ring-1', 'ring-primary');
                      try {
                        const raw = e.dataTransfer.getData("application/json");
                        if (!raw) return;
                        const data = JSON.parse(raw);
                        if (data.type === "snippet" && data.id) {
                          const res = await fetch(`/api/snippets/${data.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ collectionId: col.id })
                          });
                          if (res.ok) {
                            window.location.reload();
                          }
                        }
                      } catch { }
                    }}
                    onClick={() => {
                      if (onTagClick) {
                        onTagClick(`collection:${col.id}`);
                      } else {
                        window.location.href = `/dashboard?collection=${col.id}`;
                      }
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                  >
                    <Folder size={12} suppressHydrationWarning />
                    <span className="truncate">{col.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Languages
            </h3>
            <div className="space-y-0.5">
              {languages.map((lang) => {
                const isActive = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get("language") === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      if (onLanguageClick) {
                        onLanguageClick(lang);
                      } else {
                        const params = new URLSearchParams(window.location.search);
                        if (isActive) params.delete("language");
                        else params.set("language", lang);
                        const targetPath = ["/", "/dashboard", "/public"].includes(pathname) ? pathname : "/dashboard";
                        window.location.href = `${targetPath}?${params.toString()}`;
                      }
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      isActive ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <ChevronRight size={12} suppressHydrationWarning />
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map((tag) => {
                const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
                const activeTags = searchParams.get("tags")?.split(",") || [];
                const isActive = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (onTagClick) {
                        onTagClick(tag);
                      } else {
                        const params = new URLSearchParams(window.location.search);
                        let currentTags = params.get("tags")?.split(",") || [];
                        if (isActive) {
                          currentTags = currentTags.filter(t => t !== tag);
                        } else {
                          currentTags.push(tag);
                        }
                        if (currentTags.length > 0) {
                          params.set("tags", currentTags.join(","));
                        } else {
                          params.delete("tags");
                        }
                        const targetPath = ["/", "/dashboard", "/public"].includes(pathname) ? pathname : "/dashboard";
                        window.location.href = `${targetPath}?${params.toString()}`;
                      }
                      setMobileOpen(false);
                    }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Badge variant={isActive ? "default" : "outline"} className="cursor-pointer text-xs" aria-label={`Filter by tag: ${tag}`}>
                      {tag}
                    </Badge>
                  </button>
                );
              })}
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
              <Button variant="outline" className="w-full gap-2 mt-2" asChild>
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
              <a
                href="https://github.com/Shik3i/KoalaSnippets"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pr-2"
              >
                <Github size={12} suppressHydrationWarning />
                {process.env.NEXT_PUBLIC_APP_VERSION}
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
