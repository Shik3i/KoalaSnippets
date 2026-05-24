"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Globe, Loader2, FileText } from "lucide-react";

interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
}

export function ImportWizard({ open, onClose }: ImportWizardProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "SHARED" | "PUBLIC">("PRIVATE");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; files: { filename: string; code: string; language: string }[] } | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  if (!open) return null;

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.files) {
        setPreview(data);
        setTitle(data.title || "");
        addToast("Content fetched successfully!", "success");
      } else {
        addToast(data.error || "Failed to fetch URL", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || preview.title,
          visibility,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        addToast("Snippet imported!", "success");
        onClose();
        router.push(`/snippets/${data.id}`);
      } else {
        addToast(data.error || "Import failed", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Import Snippet from URL</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Paste a GitHub Gist raw URL, Pastebin link, or any raw code URL.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://gist.githubusercontent.com/raw/..."
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              />
              <Button onClick={handleFetch} disabled={loading || !url.trim()}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              </Button>
            </div>
          </div>

          {preview && (
            <>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="PRIVATE">Private</option>
                  <option value="SHARED">Shared (with link)</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <FileText size={12} />
                  Preview ({preview.files.length} {preview.files.length === 1 ? "file" : "files"})
                </div>
                {preview.files.map((f, i) => (
                  <div key={i} className="px-3 py-2 border-b border-border/50 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-medium">{f.filename}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{f.language}</span>
                    </div>
                    <pre className="text-xs text-muted-foreground line-clamp-3 font-mono whitespace-pre-wrap">{f.code.slice(0, 200)}{f.code.length > 200 ? "..." : ""}</pre>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleImport} disabled={loading} className="flex-1">
                  Import Snippet
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>

        {!preview && (
          <Button variant="ghost" className="w-full mt-4" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
