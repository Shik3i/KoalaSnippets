"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DetailView } from "@/features/core/components/detail-view";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  isOwner: boolean;
}

export function SnippetDetailClient(props: SnippetDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleEdit = () => {
    const editData = {
      id: props.id,
      title: props.title,
      description: props.description ?? "",
      files: props.files.map(f => ({ filename: f.filename, code: f.code, language: f.language })),
      tags: props.tags ?? [],
      visibility: props.visibility,
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
        addToast("Snippet deleted", "success");
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
        router.refresh(); // Still refresh locally to update current view
      } else {
        addToast("Failed to change visibility", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DetailView
        {...props}
        isSubmitting={isSubmitting}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleVisibility={handleToggleVisibility}
      />
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Snippet"
        description="Are you sure you want to delete this snippet? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isSubmitting}
      />
    </>
  );
}
