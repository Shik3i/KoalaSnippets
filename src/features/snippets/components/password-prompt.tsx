"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { SnippetDetailClient } from "@/app/snippets/[id]/SnippetDetailClient";

interface PasswordPromptProps {
  snippet: {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    visibility: "PRIVATE" | "SHARED" | "PUBLIC";
    shareToken?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  syntaxTheme: string;
}

export function PasswordPrompt({ snippet, syntaxTheme }: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlockedFiles, setUnlockedFiles] = useState<{ id?: string; filename: string; code: string; language: string; highlightedCode: string }[] | null>(null);
  const { addToast } = useToast();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/snippets/${snippet.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, syntaxTheme })
      });
      const data = await res.json();
      if (res.ok) {
        setUnlockedFiles(data.files);
        addToast("Snippet unlocked!", "success");
      } else {
        addToast(data.error || "Incorrect password", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (unlockedFiles) {
    return (
      <SnippetDetailClient
        id={snippet.id}
        title={snippet.title}
        description={snippet.description}
        files={unlockedFiles}
        tags={snippet.tags}
        visibility={snippet.visibility}
        shareToken={snippet.shareToken}
        createdAt={snippet.createdAt}
        updatedAt={snippet.updatedAt}
        isOwner={false}
      />
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <form onSubmit={handleUnlock} className="max-w-md w-full p-6 border border-border rounded-lg bg-card shadow-sm space-y-4 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
        <h2 className="text-xl font-semibold">Password Protected</h2>
        <p className="text-sm text-muted-foreground">This snippet requires a password to view.</p>
        <div className="flex gap-2 pt-2">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            autoFocus
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Unlocking..." : "Unlock"}
          </Button>
        </div>
      </form>
    </div>
  );
}
