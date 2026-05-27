"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Plus, Settings, Shield, Home, FileCode, Command, ArrowRight, Moon, Copy, Pencil, Wrench, Upload, LayoutGrid } from "lucide-react";
import { cn } from "@/features/core/utils/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface SnippetResult {
  id: string;
  title: string;
  description: string | null;
  language: string;
  tags: string[] | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

const commands = [
  { label: "Create New Snippet", value: "/new", href: "/dashboard/new", description: "Create a new snippet", icon: Plus },
  { label: "Toggle Dark Mode", value: "/theme", action: "toggleTheme", description: "Switch between light and dark mode", icon: Moon },
  { label: "Open Developer Tools", value: "/tools", href: "/tools", description: "Regex, Timestamp, URL, Color tools", icon: Wrench },
  { label: "Import Snippets", value: "/import", action: "openImport", description: "Import snippets from file or URL", icon: Upload },
  { label: "Set Density: Compact", value: "/density compact", action: "density-compact", description: "Minimal metadata-only view", icon: LayoutGrid },
  { label: "Set Density: Preview", value: "/density preview", action: "density-preview", description: "5-line code preview view", icon: LayoutGrid },
  { label: "Set Density: Full", value: "/density full", action: "density-full", description: "Full code card view", icon: LayoutGrid },
  { label: "Account Settings", value: "/settings", href: "/settings", description: "Manage your account settings", icon: Settings },
  { label: "Admin Dashboard", value: "/admin", href: "/admin", description: "Admin tools and database backups", icon: Shield },
  { label: "Go to Home", value: "/home", href: "/", description: "Back to home page", icon: Home },
  { label: "My Snippets Dashboard", value: "/dashboard", href: "/dashboard", description: "View your personal snippets", icon: FileCode },
];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<SnippetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setQuery("");
        setActiveIndex(0);
        setSnippets([]);
        setLoading(false);
      }
      return next;
    });
  };

  // Toggle command palette on Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleOpen();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for custom event to open command palette (e.g., from mobile search button)
  useEffect(() => {
    const handleOpenPalette = () => {
      setIsOpen(true);
      setQuery("");
      setActiveIndex(0);
      setSnippets([]);
      setLoading(false);
    };

    window.addEventListener("open-command-palette", handleOpenPalette);
    return () => window.removeEventListener("open-command-palette", handleOpenPalette);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Debounced search for snippets
  useEffect(() => {
    if (!isOpen) return;
    if (query.startsWith("/") || query.trim().length === 0) {
      setTimeout(() => {
        setLoading(false);
        setSnippets([]);
      }, 0);
      return;
    }

    const abortController = new AbortController();

    const delayDebounce = setTimeout(() => {
      fetch(`/api/snippets?q=${encodeURIComponent(query)}`, { signal: abortController.signal })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setSnippets(data.snippets || []);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setSnippets([]);
            setLoading(false);
          }
        });
    }, 200);

    return () => {
      clearTimeout(delayDebounce);
      abortController.abort();
      setLoading(false);
    };
  }, [query, isOpen]);

  // Filter commands by query
  let currentCommands = [...commands];
  
  if (pathname.startsWith("/snippets/")) {
    const snippetId = pathname.split("/")[2];
    currentCommands = [
      { label: "Copy Snippet Link", value: "/copy", action: "copyShareLink", description: "Copy URL to clipboard", icon: Copy },
      { label: "Edit Snippet", value: "/edit", href: `/dashboard/new?edit=${snippetId}`, description: "Edit current snippet", icon: Pencil },
      ...currentCommands
    ];
  }

  const filteredCommands = currentCommands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return cmd.value.startsWith(q) || cmd.label.toLowerCase().includes(q);
  }).sort((a, b) => {
    const q = query.toLowerCase().trim();
    if (!q) return 0;
    const aStarts = a.value.startsWith(q) ? 1 : 0;
    const bStarts = b.value.startsWith(q) ? 1 : 0;
    return bStarts - aStarts;
  });

  const totalItems = [...filteredCommands, ...snippets];

  const selectItem = (index: number) => {
    const item = totalItems[index];
    if (!item) return;

    setIsOpen(false);
    
    if ("action" in item) {
      if (item.action === "toggleTheme") {
        const html = document.documentElement;
        const isLight = Array.from(html.classList).some((c) => c === "light" || c.startsWith("theme-light"));
        const newTheme = isLight ? "theme-midnight" : "light";

        html.classList.forEach((c) => {
          if (c.startsWith("theme-") || c === "light") html.classList.remove(c);
        });
        html.classList.add(newTheme);
        
        fetch("/api/settings/appearance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appTheme: newTheme }),
        }).catch(console.error);
        return;
      } else if (item.action === "copyShareLink") {
        navigator.clipboard.writeText(window.location.href).catch(console.error);
        return;
      } else if (item.action?.startsWith("density-")) {
        const density = item.action.replace("density-", "");
        setTimeout(() => {
          document.cookie = `snippet_density=${density}; path=/; max-age=31536000; SameSite=Lax`;
        }, 0);
        fetch("/api/settings/appearance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snippetDensity: density }),
        }).catch(console.error);
        addToast(`Density set to ${density}`, "success");
        return;
      } else if (item.action === "openImport") {
        router.push("/dashboard/new?import=1");
        return;
      }
    }

    if ("href" in item && typeof item.href === "string") {
      // It is a command
      router.push(item.href);
    } else if ("id" in item) {
      // It is a snippet
      router.push(`/snippets/${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (totalItems.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalItems.length) % totalItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectItem(activeIndex);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(0);
    if (val.startsWith("/") || val.trim().length === 0) {
      setSnippets([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] sm:pt-[10vh] md:pt-[15vh] bg-black/60 backdrop-blur-md transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 border-b border-white/10">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            id="command-palette-search"
            name="command-search"
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search snippets or type commands (e.g. /new, /settings)..."
            className="w-full h-12 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
          />
          <div className="flex items-center gap-1 text-[10px] bg-muted/30 border border-white/10 rounded-md px-1.5 py-0.5 text-muted-foreground select-none">
            <span className="text-xs">ESC</span>
          </div>
        </div>

        {/* Suggestion List Area */}
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-1" role="listbox" aria-live="polite" aria-label="Search results">
          {loading && (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              <span className="animate-pulse">Searching snippets...</span>
            </div>
          )}

          {!loading && totalItems.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!loading && totalItems.length > 0 && (
            <div>
              {/* Commands Section */}
              {filteredCommands.length > 0 && (
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Commands
                </div>
              )}
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === activeIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.value}
                    onClick={() => selectItem(idx)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all border border-transparent",
                      isSelected
                        ? "bg-white/10 border-white/5 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <div className="text-sm font-medium">{cmd.label}</div>
                        <div className="text-xs opacity-75">{cmd.description}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {cmd.value}
                    </Badge>
                  </button>
                );
              })}

              {/* Snippets Section */}
              {snippets.length > 0 && (
                <div className="px-2 py-1.5 mt-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Snippets
                </div>
              )}
              {snippets.map((snip, idx) => {
                const absoluteIdx = filteredCommands.length + idx;
                const isSelected = absoluteIdx === activeIndex;
                return (
                  <button
                    key={snip.id}
                    onClick={() => selectItem(absoluteIdx)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all border border-transparent",
                      isSelected
                        ? "bg-white/10 border-white/5 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileCode className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium truncate">{snip.title}</div>
                        {snip.description && (
                          <div className="text-xs opacity-75 truncate">{snip.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {snip.language}
                      </Badge>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-t border-white/5 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5"><Command className="w-3 h-3" /> + K</span> to launch
          </div>
          <div className="flex gap-2">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
