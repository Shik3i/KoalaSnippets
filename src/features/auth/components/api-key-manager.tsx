"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Plus, Trash2, Copy, Check, Key, Eye, EyeOff } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newTokenId, setNewTokenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch {
      addToast("Failed to load API keys", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewToken(data.token);
        setNewTokenId(data.id);
        setNewName("");
        addToast("API key created!", "success");
        fetchKeys();
      } else {
        addToast(data.error || "Failed to create key", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteKeyId(null);
    try {
      const res = await fetch(`/api/settings/api-keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        addToast("API key deleted", "success");
        fetchKeys();
      } else {
        addToast("Failed to delete key", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  const copyToken = async (token: string, id: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Key size={18} /> API Keys
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create personal API keys for CLI access or CI/CD pipelines. Keys are shown only once after creation.
        </p>
      </div>

      {newToken && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Your new API key</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Copy this key now. It will not be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono break-all">
              {newToken}
            </code>
            <Button variant="outline" size="icon" onClick={() => copyToken(newToken, newTokenId!)}>
              {copiedId === newTokenId ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setNewToken(null); setNewTokenId(null); }}>
            <EyeOff size={14} className="mr-1" /> Dismiss
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Key name (e.g. 'CLI', 'CI/CD')"
          className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="gap-1.5">
          <Plus size={14} /> Create
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No API keys yet. Create one to use the CLI or API.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : " · Never used"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteKeyId(key.id)} className="text-destructive shrink-0">
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={deleteKeyId !== null}
        onClose={() => setDeleteKeyId(null)}
        onConfirm={() => { if (deleteKeyId) handleDelete(deleteKeyId); }}
        title="Delete API Key"
        description="This API key will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
