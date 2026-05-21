"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DetailView } from "@/features/core/components/detail-view";
import { useToast } from "@/components/ui/toast";
import { revalidateDashboard, revalidateSnippet } from "@/features/core/actions/revalidate";

interface SnippetDetailClientProps {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  tags?: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
  highlightedCode: string;
  isOwner: boolean;
}

export function SnippetDetailClient(props: SnippetDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = () => {
    router.push("/dashboard/new");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this snippet? This action cannot be undone.")) return;

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
    <DetailView
      {...props}
      isSubmitting={isSubmitting}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleVisibility={handleToggleVisibility}
    />
  );
}
