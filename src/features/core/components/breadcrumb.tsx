"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/features/core/utils/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function useBreadcrumbItems(): BreadcrumbItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collection = searchParams.get("collection");
  const collectionName = searchParams.get("collectionName");

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];

  if (segments.length === 0) {
    items.push({ label: "Home", href: "/" });
    return items;
  }

  items.push({ label: "Home", href: "/" });

  if (segments[0] === "dashboard") {
    items.push({ label: "My Snippets", href: "/dashboard" });
    if (collection) {
      items.push({ label: collectionName || "Collection", href: `/dashboard?collection=${collection}` });
    }
    if (segments[1] === "new") {
      items.push({ label: "New Snippet" });
    }
    if (segments[1] === "trash") {
      items.push({ label: "Trash" });
    }
  } else if (segments[0] === "snippets" && segments[1]) {
    items.push({ label: "My Snippets", href: "/dashboard" });
    if (collection) {
      items.push({ label: collectionName || "Collection", href: `/dashboard?collection=${collection}` });
    }
    items.push({ label: "Snippet" });
  } else if (segments[0] === "admin") {
    items.push({ label: "Admin", href: "/admin" });
  } else if (segments[0] === "settings") {
    items.push({ label: "Settings", href: "/settings" });
    if (segments[1] === "appearance") {
      items.push({ label: "Appearance" });
    }
  } else if (segments[0] === "tools") {
    items.push({ label: "Dev Tools", href: "/tools" });
    if (segments[1] && segments[1] !== "tools") {
      const toolLabels: Record<string, string> = {
        uuid: "UUID Generator",
        password: "Password Generator",
        diff: "Diff Checker",
        hash: "Hash Generator",
        json: "JSON Formatter",
        jwt: "JWT Decoder",
        base64: "Base64 Encoder",
        regex: "Regex Tester",
        timestamp: "Timestamp Converter",
        url: "URL Encoder",
        color: "Color Converter",
      };
      items.push({ label: toolLabels[segments[1]] || segments[1] });
    }
  } else if (segments[0] === "public") {
    items.push({ label: "Public Explorer", href: "/public" });
    if (collection) {
      items.push({ label: collectionName || "Collection" });
    }
  } else if (segments[0] === "stats") {
    items.push({ label: "Statistics" });
  }

  return items;
}

export function Breadcrumb() {
  const items = useBreadcrumbItems();

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm text-xs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.href || item.label} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
            )}
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {index === 0 ? <Home size={12} className="inline shrink-0" aria-hidden="true" /> : item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground truncate max-w-[200px]">
                {index === 0 ? <Home size={12} className="inline shrink-0" aria-hidden="true" /> : item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function BreadcrumbWithCollection({
  snippetTitle,
}: {
  snippetTitle?: string;
}) {
  const items = useBreadcrumbItems();

  if (snippetTitle) {
    const baseItems = items.filter((i) => i.label !== "Snippet");
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm text-xs">
        {baseItems.map((item, index) => {
          const isLast = index === baseItems.length - 1 && !snippetTitle;
          return (
            <div key={item.href || item.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
                >
                  {index === 0 ? <Home size={12} className="inline shrink-0" aria-hidden="true" /> : item.label}
                </Link>
              ) : (
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {index === 0 ? <Home size={12} className="inline shrink-0" aria-hidden="true" /> : item.label}
                </span>
              )}
            </div>
          );
        })}
        <ChevronRight size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {snippetTitle}
        </span>
      </nav>
    );
  }

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm text-xs")}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.href || item.label} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight size={12} className="text-muted-foreground shrink-0" aria-hidden="true" />
            )}
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {index === 0 ? <Home size={12} className="inline shrink-0" aria-hidden="true" /> : item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground truncate max-w-[200px]">
                {index === 0 ? <Home size={12} className="inline shrink-0" aria-hidden="true" /> : item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
