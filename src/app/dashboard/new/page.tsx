"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/features/snippets/components/code-editor";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/features/core/components/sidebar";
import { Breadcrumb } from "@/features/core/components/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { useKeyboardShortcuts } from "@/features/snippets/utils/keyboard-shortcuts";
import { SUPPORTED_LANGUAGES } from "@/features/snippets/utils/shiki";
import { detectLanguage } from "@/features/snippets/utils/language-detection";
import { revalidateDashboard } from "@/features/core/actions/revalidate";
import { X, Plus, ChevronDown, Wand2, History, Map as MapIcon } from "lucide-react";
import { HistoryModal } from "@/features/snippets/components/history-modal";
import { GlobalDropzone } from "@/features/core/components/global-dropzone";
import { useLocalStorageDraft } from "@/features/snippets/utils/use-draft";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SafeZone } from "@/components/ui/safe-zone";
import { snippetSchema } from "@/features/core/utils/validations";

interface DuplicateData {
  title: string;
  description: string;
  files: { filename: string; code: string; language: string }[];
  tags: string[];
  visibility: "PRIVATE" | "SHARED" | "PUBLIC";
}

function readDuplicateData(): DuplicateData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("duplicate_snippet");
    if (!raw) return null;
    sessionStorage.removeItem("duplicate_snippet");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface EditData extends DuplicateData {
  id: string;
}

function readEditData(): EditData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("edit_snippet");
    if (!raw) return null;
    sessionStorage.removeItem("edit_snippet");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function NewSnippetPage({
  initialData: propInitialData,
  isEdit = false,
}: {
  initialData?: DuplicateData;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const isImport = searchParams.get("import") === "1";

  const initialData = propInitialData;
  const [isEditing, setIsEditing] = useState(isEdit);
  const [editId, setEditId] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  
  const defaultFiles = initialData?.files?.length 
    ? initialData.files 
    : [{ filename: "File1.ts", code: "", language: "typescript" }];
    
  const [files, setFiles] = useState<{ filename: string; code: string; language: string }[]>(defaultFiles);
  const [activeTab, setActiveTab] = useState(0);

  const [languageSearch, setLanguageSearch] = useState("");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagOpen, setTagOpen] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"PRIVATE" | "SHARED" | "PUBLIC">(initialData?.visibility ?? "PRIVATE");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);

  const activeCode = files[activeTab]?.code ?? "";
  const isLongFile = activeCode.split('\n').length > 50;

  const draftKey = isEditing && editId ? `draft_edit_${editId}` : "draft_new_snippet";
  const currentData = useMemo(() => ({ title, description, files, tags, visibility }), [title, description, files, tags, visibility]);
  const { hasDraft, loadDraft, clearDraft } = useLocalStorageDraft(draftKey, currentData, 3000);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      if (draft.title !== undefined) setTitle(draft.title);
      if (draft.description !== undefined) setDescription(draft.description);
      if (draft.files) setFiles(draft.files);
      if (draft.tags) setTags(draft.tags);
      if (draft.visibility) setVisibility(draft.visibility);
      addToast("Draft restored", "success");
    }
    clearDraft();
  };

  useEffect(() => {
    const dupData = readDuplicateData();
    const eData = readEditData();
    
    if (eData || dupData) {
      const data = eData || dupData!;
      setTimeout(() => {
        if (eData) {
          setIsEditing(true);
          setEditId(eData.id);
          addToast("Editing snippet", "info");
        } else if (dupData) {
          addToast("Pre-filled with duplicated snippet", "info");
        }
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.files?.length) setFiles(data.files);
        if (data.tags) setTags(data.tags);
        if (data.visibility) setVisibility(data.visibility);
      }, 0);
    }

    if (isImport) {
      try {
        const importData = sessionStorage.getItem("koalasnippets_import");
        if (importData) {
          const parsed = JSON.parse(importData);
          if (parsed.title) setTimeout(() => setTitle(parsed.title), 0);
          if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
            setTimeout(() => setFiles(parsed.files as { filename: string; code: string; language: string }[]), 0);
          }
          sessionStorage.removeItem("koalasnippets_import");
          
          const url = new URL(window.location.href);
          url.searchParams.delete("import");
          window.history.replaceState({}, '', url);
        }
      } catch (err) {
        console.error("Failed to parse import data", err);
      }
    }
  }, [isImport, addToast]);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setExistingTags(data.tags ?? []))
      .catch(() => {});
  }, []);

  // Removed duplicate toast useEffect

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, ignoreDuplicate = false) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEditing && editId ? `/api/snippets/${editId}` : "/api/snippets";
      const method = isEditing && editId ? "PUT" : "POST";

      const payload: Record<string, unknown> = { title, description, files, tags: tags.map((t) => t.toLowerCase()), visibility };
      if (password) payload.password = password;
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
      if (ignoreDuplicate) payload.ignoreDuplicate = true;

      const parsed = snippetSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.errors[0].message);
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.isDuplicate) {
          setShowDuplicateWarning(true);
          return;
        }
        setError(data.error ?? (isEditing ? "Failed to update snippet" : "Failed to create snippet"));
        return;
      }

      addToast(isEditing ? "Snippet updated!" : "Snippet saved!", "success");
      clearDraft();
      await revalidateDashboard();
      
      const snippetId = (isEditing && editId) ? editId : data.id;
      if (visibility === "SHARED" && data.shareToken) {
        router.push(`/snippets/${snippetId}?token=${data.shareToken}`);
      } else {
        router.push(`/snippets/${snippetId}`);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useKeyboardShortcuts({ onSave: () => { if (!loading) handleSubmit(); } });

  const handleFormat = async () => {
    const activeFile = files[activeTab];
    if (!activeFile?.code) return;
    try {
      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activeFile.code, language: activeFile.language })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newFiles = [...files];
      newFiles[activeTab].code = data.code;
      setFiles(newFiles);
      addToast("Code formatted!", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Formatting failed", "error");
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
      setTagOpen(false);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const filteredTags = existingTags.filter(
    (t) => t.includes(tagInput.toLowerCase()) && !tags.includes(t)
  );

  return (
    <div className="flex h-screen">
      <GlobalDropzone />
      <Sidebar isAuthenticated={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Breadcrumb />
        <div className="flex-1 overflow-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Snippet" : "New Snippet"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My awesome snippet"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this snippet do?"
                  rows={2}
                  maxLength={2000}
                />
              </div>

              <div className="space-y-2 border border-border rounded-md overflow-hidden bg-card">
                <div className="flex border-b border-border bg-muted/50 overflow-x-auto">
                  {files.map((file, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`px-4 py-2 text-sm font-medium border-r border-border transition-colors whitespace-nowrap flex items-center gap-2 ${
                        activeTab === idx ? "bg-card text-foreground border-b-2 border-b-primary" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <input 
                        value={file.filename}
                        onChange={(e) => {
                          const newFiles = [...files];
                          newFiles[idx].filename = e.target.value;
                          setFiles(newFiles);
                        }}
                        className="bg-transparent border-none focus:outline-none w-24 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {files.length > 1 && (
                        <X 
                          size={14} 
                          className="hover:text-destructive cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFiles = files.filter((_, i) => i !== idx);
                            setFiles(newFiles);
                            if (activeTab >= newFiles.length) setActiveTab(newFiles.length - 1);
                          }} 
                        />
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([...files, { filename: `File${files.length + 1}.ts`, code: "", language: "typescript" }]);
                      setActiveTab(files.length);
                    }}
                    className="px-3 py-2 text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"
                    aria-label="Add file"
                  >
                    <Plus size={16} />
                  </button>
                  <div className="flex-1" />
                  {isLongFile && (
                    <button
                      type="button"
                      onClick={() => setShowMinimap(!showMinimap)}
                      className={`px-3 py-2 transition-colors flex items-center justify-center gap-1.5 border-l border-border text-sm ${showMinimap ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                      title="Toggle Minimap"
                    >
                      <MapIcon size={14} />
                      <span className="hidden sm:inline">Map</span>
                    </button>
                  )}
                  {isEditing && editId && (
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(true)}
                      className="px-3 py-2 text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 border-l border-border text-sm"
                      title="View History"
                    >
                      <History size={14} />
                      <span className="hidden sm:inline">History</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleFormat}
                    className="px-3 py-2 text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 border-l border-border text-sm"
                    title="Format Code"
                  >
                    <Wand2 size={14} />
                    <span className="hidden sm:inline">Format</span>
                  </button>
                </div>

                <div className="p-2 relative">
                  <SafeZone name="CodeEditor">
                    <CodeEditor
                      id="code"
                      value={activeCode}
                      onChange={(newCode) => {
                        const newFiles = [...files];
                        const oldCode = newFiles[activeTab].code;
                        newFiles[activeTab].code = newCode;
                        
                        // Paste heuristic: auto-detect language if pasting into empty editor
                        if (oldCode.length < 5 && newCode.length > 20 && newFiles[activeTab].language === "typescript") {
                          const guessed = detectLanguage(newCode);
                          if (guessed && guessed !== "typescript" && SUPPORTED_LANGUAGES.includes(guessed)) {
                            newFiles[activeTab].language = guessed;
                            addToast(`Auto-detected language: ${guessed}`, "info");
                          }
                        }
                        
                        setFiles(newFiles);
                      }}
                      placeholder="Paste your code here..."
                      rows={12}
                      className="font-mono text-sm border-0 focus-visible:ring-0 rounded-none shadow-none resize-y min-h-[300px]"
                      required
                      showMinimap={showMinimap && isLongFile}
                    />
                  </SafeZone>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language for active file</Label>
                  <div className="relative">
                    <Input
                      id="language"
                      value={languageOpen ? languageSearch : (files[activeTab]?.language ?? "")}
                      onChange={(e) => {
                        setLanguageSearch(e.target.value);
                        setLanguageOpen(true);
                      }}
                      onFocus={() => setLanguageOpen(true)}
                      onBlur={() => setTimeout(() => setLanguageOpen(false), 150)}
                      placeholder="Search language..."
                      required
                      autoComplete="off"
                    />
                    <ChevronDown
                      size={16}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    {languageOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {SUPPORTED_LANGUAGES.filter((lang) =>
                          lang.toLowerCase().includes(languageSearch.toLowerCase())
                        ).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const newFiles = [...files];
                              newFiles[activeTab].language = lang;
                              setFiles(newFiles);
                              setLanguageSearch("");
                              setLanguageOpen(false);
                            }}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label="Snippet visibility"
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="SHARED">Shared (link only)</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank for no password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setTagOpen(true);
                      }}
                      onFocus={() => setTagOpen(true)}
                      onBlur={() => setTimeout(() => setTagOpen(false), 150)}
                      placeholder="Search or add a tag..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      aria-label="Tag input"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Add tag">
                      <Plus size={16} />
                    </Button>
                  </div>
                  {tagOpen && filteredTags.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (!tags.includes(tag) && tags.length < 10) {
                              setTags([...tags, tag]);
                            }
                            setTagInput("");
                            setTagOpen(false);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                          aria-label={`Remove tag: ${tag}`}
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Snippet" : "Create Snippet")}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      {isEditing && editId && (
        <HistoryModal 
          open={historyOpen} 
          onClose={() => setHistoryOpen(false)} 
          snippetId={editId}
          onRestore={(restoredFiles) => {
            setFiles(restoredFiles);
            setActiveTab(0);
            addToast("Restored from history!", "success");
          }} 
        />
      )}
      <ConfirmModal
        open={hasDraft && !isImport}
        onClose={clearDraft}
        onConfirm={handleRestoreDraft}
        title="Unsaved Draft Found"
        description="We found an unsaved draft of this snippet. Would you like to restore it?"
        confirmLabel="Restore Draft"
      />
      <ConfirmModal
        open={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        onConfirm={() => {
          setShowDuplicateWarning(false);
          handleSubmit(undefined, true);
        }}
        title="Duplicate Snippet Detected"
        description="You already have a snippet with this exact code. Are you sure you want to save another copy?"
        confirmLabel="Save Anyway"
        variant="destructive"
      />
      </div>
    </div>
  );
}
