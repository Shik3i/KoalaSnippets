"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/features/core/utils/utils";
import { LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/features/core/i18n";

interface ViewToggleProps {
  current: "grid" | "table";
}

export function ViewToggle({ current }: ViewToggleProps) {
  const router = useRouter();
  const { t } = useI18n();

  const setView = (view: "grid" | "table") => {
    document.cookie = `snippet_view=${view}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-none",
          current === "grid" && "bg-accent text-accent-foreground"
        )}
        onClick={() => setView("grid")}
        aria-label={t.gridView}
      >
        <LayoutGrid size={16} suppressHydrationWarning />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-none",
          current === "table" && "bg-accent text-accent-foreground"
        )}
        onClick={() => setView("table")}
        aria-label={t.tableView}
      >
        <List size={16} suppressHydrationWarning />
      </Button>
    </div>
  );
}
