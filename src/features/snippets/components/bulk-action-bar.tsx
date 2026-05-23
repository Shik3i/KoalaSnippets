"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { revalidateDashboard } from "@/features/core/actions/revalidate";
import { Trash2, Lock, Globe, X } from "lucide-react";

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, onClear }: BulkActionBarProps) {
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
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

  const handleDeleteConfirm = () => {
    setDeleteModalOpen(false);
    performBulk("delete");
  };

  return (
    <div className="sticky bottom-0 z-50 bg-card border-t border-border px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
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
          aria-label="Make selected snippets private"
        >
          <Lock size={14} suppressHydrationWarning />
          <span className="hidden sm:inline">Make Private</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => performBulk("set-visibility", "PUBLIC")}
          disabled={loading}
          aria-label="Make selected snippets public"
        >
          <Globe size={14} suppressHydrationWarning />
          <span className="hidden sm:inline">Make Public</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          onClick={() => setDeleteModalOpen(true)}
          disabled={loading}
          aria-label="Delete selected snippets"
        >
          <Trash2 size={14} suppressHydrationWarning />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Snippets"
        description={`Delete ${selectedIds.length} snippet${selectedIds.length !== 1 ? "s" : ""}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={loading}
      />
    </div>
  );
}
