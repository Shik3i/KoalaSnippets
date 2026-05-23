"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface SortSelectProps {
  current: "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "size-desc", label: "Size (Largest)" },
  { value: "size-asc", label: "Size (Smallest)" },
] as const;

export function SortSelect({ current }: SortSelectProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1.5">
      <ArrowUpDown size={14} className="text-muted-foreground shrink-0" suppressHydrationWarning />
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-muted/40 backdrop-blur-sm px-2 py-0 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        aria-label="Sort snippets"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
