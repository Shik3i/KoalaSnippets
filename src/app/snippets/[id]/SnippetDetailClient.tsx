"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DetailView } from "@/features/core/components/detail-view";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useKeyboardShortcuts } from "@/features/snippets/utils/keyboard-shortcuts";
import { revalidateDashboard, revalidateSnippet } from "@/features/core/actions/revalidate";

interface SnippetDetailClientProps {
  id: string;
  title: string;
  description?: string;
  files: { id?: string; filename: string; code: string; language: string; highlightedCode: string }[];
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  isOwner: boolean;
  isPinned?: boolean;
  isFavorited?: boolean;
  forkedFromId?: string;
  forkedFromTitle?: string;
  backUrl?: string;
  showLineNumbers?: boolean;
  collectionId?: string | null;
}

export function SnippetDetailClient(props: SnippetDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleToggleFavorite = async () => {
    try {
      const method = props.isFavorited ? "DELETE" : "POST";
      const res = await fetch(`/api/snippets/${props.id}/favorite`, { method });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      addToast("Failed to update favorite", "error");
    }
  };

  const handleTogglePin = async () => {
    try {
      const res = await fetch(`/api/snippets/${props.id}/pin`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      addToast("Failed to update pin", "error");
    }
  };

  const handleEdit = () => {
    const editData = {
      id: props.id,
      title: props.title,
      description: props.description ?? "",
      files: props.files.map(f => ({ filename: f.filename, code: f.code, language: f.language })),
      tags: props.tags ?? [],
      visibility: props.visibility,
      collectionId: props.collectionId,
    };
    sessionStorage.setItem("edit_snippet", JSON.stringify(editData));
    router.push("/dashboard/new");
  };

  const handleDuplicate = () => {
    const duplicateData = {
      title: props.title,
      description: props.description ?? "",
      files: props.files.map(f => ({ filename: f.filename, code: f.code, language: f.language })),
      tags: props.tags ?? [],
      visibility: props.visibility,
      collectionId: props.collectionId,
    };
    sessionStorage.setItem("duplicate_snippet", JSON.stringify(duplicateData));
    router.push("/dashboard/new");
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/snippets/${props.id}`, { method: "DELETE" });
      if (res.ok) {
        addToast(props.deletedAt ? "Snippet permanently deleted" : "Snippet moved to trash", "success");
        await revalidateDashboard();
        router.push("/dashboard");
      } else {
        addToast("Failed to delete snippet", "error");
      }
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/snippets/${props.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRestore: true }),
      });
      if (res.ok) {
        addToast("Snippet restored from trash", "success");
        await revalidateDashboard();
        await revalidateSnippet(props.id);
        router.push("/dashboard");
      } else {
        addToast("Failed to restore snippet", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async () => {
    const next: "PRIVATE" | "SHARED" | "PUBLIC" =
      props.visibility === "PRIVATE" ? "SHARED" : props.visibility === "SHARED" ? "PUBLIC" : "PRIVATE";

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/snippets/${props.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });

      if (res.ok) {
        addToast(`Visibility changed to ${next}`, "success");
        await revalidateDashboard();
        await revalidateSnippet(props.id);
        router.refresh();
      } else {
        addToast("Failed to change visibility", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFork = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/snippets/${props.id}/fork`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.id) {
        addToast("Snippet forked successfully!", "success");
        await revalidateDashboard();
        router.push(`/snippets/${data.id}`);
      } else {
        addToast(data.error || "Failed to fork snippet", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useKeyboardShortcuts({
    onDelete: props.deletedAt ? undefined : handleDelete,
    onToggleFavorite: handleToggleFavorite,
    onTogglePin: handleTogglePin,
  });

  return (
    <>
      <DetailView
        {...props}
        isSubmitting={isSubmitting}
        showLineNumbers={props.showLineNumbers}
        isPinned={props.isPinned}
        isFavorited={props.isFavorited}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onDuplicate={handleDuplicate}
        onToggleVisibility={handleToggleVisibility}
        onFork={handleFork}
      />
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={props.deletedAt ? "Permanently Delete Snippet" : "Move to Trash"}
        description={props.deletedAt ? "Are you sure you want to permanently delete this snippet? This action cannot be undone." : "Are you sure you want to move this snippet to the trash?"}
        confirmLabel={props.deletedAt ? "Permanently Delete" : "Move to Trash"}
        variant="destructive"
        loading={isSubmitting}
      />
    </>
  );
}
