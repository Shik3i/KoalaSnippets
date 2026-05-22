"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { revalidateDashboard } from "@/features/core/actions/revalidate";
import { Trash2, Lock, Globe, X } from "lucide-react";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, onClear }: BulkActionBarProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const performBulk = async (action: string, visibility?: "PRIVATE" | "PUBLIC") => {
    setLoading(true);
    try {
      const res = await fetch("/api/snippets/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, visibility }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message ?? "Action completed", "success");
        await revalidateDashboard();
        onClear();
      } else {
        addToast(data.error ?? "Action failed", "error");
      }
    } catch {
      addToast("An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClear}
          aria-label="Clear selection"
          disabled={loading}
        >
          <X size={14} suppressHydrationWarning />
        </Button>
        <span className="text-sm font-medium">
          {selectedIds.length} snippet{selectedIds.length !== 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => performBulk("set-visibility", "PRIVATE")}
          disabled={loading}
        >
          <Lock size={14} suppressHydrationWarning />
          Make Private
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => performBulk("set-visibility", "PUBLIC")}
          disabled={loading}
        >
          <Globe size={14} suppressHydrationWarning />
          Make Public
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            if (confirm(`Delete ${selectedIds.length} snippet${selectedIds.length !== 1 ? "s" : ""}? This cannot be undone.`)) {
              performBulk("delete");
            }
          }}
          disabled={loading}
        >
          <Trash2 size={14} suppressHydrationWarning />
          Delete
        </Button>
      </div>
    </div>
  );
}
