"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { useI18n } from "@/features/core/i18n";

interface SortSelectProps {
  current: "newest" | "oldest" | "alphabetical" | "size-asc" | "size-desc";
}

export function SortSelect({ current }: SortSelectProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const SORT_OPTIONS = [
    { value: "newest", label: t.sortNewest },
    { value: "oldest", label: t.sortOldest },
    { value: "alphabetical", label: t.sortAlphabetical },
    { value: "size-desc", label: t.sortSizeLargest },
    { value: "size-asc", label: t.sortSizeSmallest },
  ] as const;

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
      <ArrowUpDown size={14} className="text-muted-foreground shrink-0" suppressHydrationWarning aria-hidden="true" />
      <select
        id="sort-select"
        name="sort"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-muted/40 backdrop-blur-sm px-2 py-0 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        aria-label={t.sortSnippets}
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
