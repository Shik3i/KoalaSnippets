"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import MainLogo from "../../../../public/MainLogo.png";
import KoalaFile from "../../../../public/KoalaFile.png";
import KoalaFolder from "../../../../public/KoalaFolder.png";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/features/core/utils/utils";
import { useRecentSnippets } from "@/features/core/hooks/use-recent-snippets";
import { MobileFAB } from "@/features/core/components/mobile-fab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FileCode,
  Globe,
  ChevronRight,
  Menu,
  X,
  Settings,
  LogOut,
  BarChart3,
  Shield,
  Palette,
  Search,
  PlusCircle,
  Github,
  Trash2,
  Clock,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
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
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/dashboard/trash", label: "Trash", icon: Trash2 },
  { href: "/public", label: "Public Explorer", icon: Globe },
  { href: "/tools", label: "Dev Tools", icon: Wrench },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
];

export function Sidebar({ tags = [], languages = [], isAuthenticated = false, isAdmin = false, onTagClick, onLanguageClick }: SidebarProps) {
  const pathname = usePathname();
  const searchParamsObj = useSearchParams();
  const { recentSnippets, clearRecentSnippets } = useRecentSnippets();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [addingCollection, setAddingCollection] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [width, setWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("koalasnippets_sidebar_collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    const saved = localStorage.getItem("koalasnippets_sidebar_width");
    if (saved) {
      setTimeout(() => setWidth(parseInt(saved, 10)), 0);
    }
  }, []);

  const widthRef = useRef(width);

  useEffect(() => {
    widthRef.current = width;
  });

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
      if (newWidth !== widthRef.current) {
        setWidth(newWidth);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/collections")
        .then((res) => res.json())
        .then((data) => {
          if (data.collections) setCollections(data.collections);
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2.5 rounded-md bg-card border border-border md:hidden touch-target"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} suppressHydrationWarning /> : <Menu size={20} suppressHydrationWarning />}
      </button>

      <button
        className="fixed top-4 right-4 z-50 p-2.5 rounded-md bg-card border border-border md:hidden flex items-center justify-center cursor-pointer touch-target"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("open-command-palette"));
        }}
        aria-label="Open Command Palette Search"
      >
        <Search size={20} suppressHydrationWarning />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-card border-r border-border flex flex-col transform md:translate-x-0 md:relative md:z-auto md:shrink-0",
          !isResizing && "transition-[width,transform] duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: collapsed ? 52 : (mobileOpen ? 280 : `${width}px`) }}
        role="navigation"
        aria-label="Main navigation"
      >
        {!mobileOpen && !collapsed && (
          <div className="absolute right-[-2px] top-0 bottom-0 w-4 cursor-col-resize z-50 hidden md:flex justify-center group"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          >
            <div className="w-[2px] h-full bg-transparent group-hover:bg-primary/50 transition-colors" />
          </div>
        )}

        <div className={cn("flex items-center border-b border-border h-[65px] group relative", collapsed ? "justify-center" : "px-4 justify-between")}>
          <Link 
            href="/" 
            className={cn("flex items-center gap-3 transition-opacity duration-200", collapsed && "group-hover:opacity-0")}
          >
            <div className="w-11 h-11 rounded-md flex items-center justify-center shrink-0">
              <Image src={MainLogo} alt="KoalaSnippets Logo" width={44} height={44} className="object-contain" />
            </div>
            {!collapsed && <span className="font-semibold text-lg truncate">KoalaSnippets</span>}
          </Link>

          {!mobileOpen && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 hidden md:flex shrink-0 text-muted-foreground hover:text-foreground transition-all duration-200",
                collapsed ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 z-10" : ""
              )}
              onClick={() => {
                const next = !collapsed;
                setCollapsed(next);
                localStorage.setItem("koalasnippets_sidebar_collapsed", String(next));
              }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={16} suppressHydrationWarning /> : <PanelLeftClose size={16} suppressHydrationWarning />}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
        <nav className={cn("space-y-1", collapsed ? "p-1.5" : "p-3")}>
          {navItems.map((item) => {
            if ((item.href === "/dashboard" || item.href === "/dashboard/trash") && !isAuthenticated) {
              return null;
            }
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} suppressHydrationWarning />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated && (
          <div className={cn(collapsed ? "px-1.5 py-1" : "px-3 py-2")}>
            {collapsed ? (
              <Link
                href="/dashboard/new"
                onClick={() => setMobileOpen(false)}
                title="New Snippet"
                className="flex items-center justify-center w-full py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Image src={KoalaFile} alt="New Snippet" width={16} height={16} />
              </Link>
            ) : (
              <Button className="w-full gap-2" size="sm" asChild>
                <Link href="/dashboard/new" onClick={() => setMobileOpen(false)}>
                  <Image src={KoalaFile} alt="New Snippet" width={16} height={16} />
                  New Snippet
                </Link>
              </Button>
            )}
          </div>
        )}

        {isAuthenticated && !collapsed && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <Image src={KoalaFolder} alt="Collections" width={24} height={24} />
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Collections
                </h3>
              </div>
              <button 
                onClick={() => { setAddingCollection(true); setNewCollectionName(""); }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Add collection"
              >
                <PlusCircle size={14} />
              </button>
            </div>
            {addingCollection && (
              <div className="flex items-center gap-1 px-1 mb-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Escape") { setAddingCollection(false); return; }
                    if (e.key !== "Enter" || !newCollectionName.trim() || creatingCollection) return;
                    setCreatingCollection(true);
                    try {
                      const res = await fetch("/api/collections", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newCollectionName.trim() })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setCollections(prev => [...prev, data.collection]);
                      }
                    } finally {
                      setCreatingCollection(false);
                      setAddingCollection(false);
                      setNewCollectionName("");
                    }
                  }}
                  placeholder="Collection name"
                  className="flex-1 h-7 px-2 text-[11px] bg-muted/50 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  disabled={creatingCollection}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { if (!creatingCollection) setAddingCollection(false); }}
                  className="text-muted-foreground hover:text-foreground p-1 disabled:opacity-50"
                  disabled={creatingCollection}
                  aria-label="Cancel"
                >
                  {creatingCollection ? (
                    <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X size={12} />
                  )}
                </button>
              </div>
            )}
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
                    <Image src={KoalaFolder} alt="Folder" width={16} height={16} />
                    <span className="truncate">{col.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {languages.length > 0 && !collapsed && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Languages
            </h3>
            <div className="space-y-0.5">
              {languages.map((lang) => {
                const isActive = searchParamsObj.get("language") === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      if (onLanguageClick) {
                        onLanguageClick(lang);
                      } else {
                        const params = new URLSearchParams(searchParamsObj.toString());
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

        {tags.length > 0 && !collapsed && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map((tag) => {
                const activeTags = searchParamsObj.get("tags")?.split(",") || [];
                const isActive = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (onTagClick) {
                        onTagClick(tag);
                      } else {
                        const params = new URLSearchParams(searchParamsObj.toString());
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

        {recentSnippets.length > 0 && !collapsed && (
          <div className="px-3 py-2 border-t border-border overflow-y-auto max-h-48">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                Recently Accessed
              </span>
              <button
                onClick={clearRecentSnippets}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                aria-label="Clear recently accessed snippets"
              >
                <X size={10} />
              </button>
            </h3>
            <div className="space-y-0.5">
              {recentSnippets.map((snippet) => (
                <Link
                  key={snippet.id}
                  href={`/snippets/${snippet.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex flex-col px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors group"
                >
                  <span className="truncate group-hover:text-primary transition-colors">{snippet.title}</span>
                  <span className="text-[10px] opacity-70">
                    {new Date(snippet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>

        <div className="mt-auto border-t border-border">
          <div className={cn("space-y-1", collapsed ? "p-1.5" : "p-3")}>
            {isAdmin && (
              <Link
                href="/admin"
                title={collapsed ? "Admin Dashboard" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                  pathname === "/admin"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Shield size={16} suppressHydrationWarning />
                {!collapsed && "Admin Dashboard"}
              </Link>
            )}
            <Link
              href="/settings/appearance"
              title={collapsed ? "Appearance Settings" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md text-sm transition-colors",
                collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                pathname === "/settings/appearance"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <Palette size={16} suppressHydrationWarning />
              {!collapsed && "Appearance Settings"}
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/settings"
                  title={collapsed ? "Security Settings" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sm transition-colors",
                    collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                    pathname === "/settings"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings size={16} suppressHydrationWarning />
                  {!collapsed && "Security Settings"}
                </Link>
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                    } catch (error) {
                      console.error("Logout failed", error);
                    } finally {
                      window.location.href = "/login";
                    }
                  }}
                  title="Sign Out"
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                    collapsed ? "justify-center w-full px-2 py-2" : "w-full px-3 py-2"
                  )}
                >
                  <LogOut size={16} suppressHydrationWarning />
                  {!collapsed && "Sign Out"}
                </button>
              </>
            ) : (
              collapsed ? (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  title="Sign In"
                  className="flex items-center justify-center w-full py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <LogOut size={16} suppressHydrationWarning />
                </Link>
              ) : (
                <Button variant="outline" className="w-full gap-2 mt-2" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              )
            )}
          </div>
          {!collapsed && (
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
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <MobileFAB />
    </>
  );
}
