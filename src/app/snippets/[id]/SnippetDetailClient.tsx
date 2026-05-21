"use client";

import { useRouter } from "next/navigation";
import { DetailView } from "@/features/core/components/detail-view";
import { useToast } from "@/components/ui/toast";

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

  const handleEdit = () => {
    router.push("/dashboard/new");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this snippet? This action cannot be undone.")) return;

    const res = await fetch(`/api/snippets/${props.id}`, { method: "DELETE" });
    if (res.ok) {
      addToast("Snippet deleted", "success");
      router.push("/dashboard");
      router.refresh();
    } else {
      addToast("Failed to delete snippet", "error");
    }
  };

  const handleToggleVisibility = async () => {
    const next: "PRIVATE" | "SHARED" | "PUBLIC" =
      props.visibility === "PRIVATE" ? "SHARED" : props.visibility === "SHARED" ? "PUBLIC" : "PRIVATE";

    const res = await fetch(`/api/snippets/${props.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: next }),
    });

    if (res.ok) {
      addToast(`Visibility changed to ${next}`, "success");
      router.refresh();
    } else {
      addToast("Failed to change visibility", "error");
    }
  };

  return (
    <DetailView
      {...props}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleVisibility={handleToggleVisibility}
    />
  );
}
