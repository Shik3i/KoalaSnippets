"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/features/snippets/components/code-editor";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/features/core/components/sidebar";
import { useToast } from "@/components/ui/toast";
import { useKeyboardShortcuts } from "@/features/snippets/utils/keyboard-shortcuts";
import { SUPPORTED_LANGUAGES } from "@/features/snippets/utils/shiki";
import { X, Plus, ChevronDown } from "lucide-react";

export default function NewSnippetPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [languageSearch, setLanguageSearch] = useState("");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagOpen, setTagOpen] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"PRIVATE" | "SHARED" | "PUBLIC">("PRIVATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setExistingTags(data.tags ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, code, language, tags: tags.map((t) => t.toLowerCase()), visibility }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create snippet");
        return;
      }

      addToast("Snippet saved!", "success");
      if (visibility === "SHARED" && data.shareToken) {
        router.push(`/snippets/${data.id}?token=${data.shareToken}`);
      } else {
        router.push(`/snippets/${data.id}`);
      }
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useKeyboardShortcuts({ onSave: () => { if (!loading) handleSubmit(); } });

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
      <Sidebar isAuthenticated={true} />
      <div className="flex-1 overflow-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>New Snippet</CardTitle>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <CodeEditor
                  id="code"
                  value={code}
                  onChange={setCode}
                  placeholder="Paste your code here..."
                  rows={12}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <div className="relative">
                    <Input
                      id="language"
                      value={languageOpen ? languageSearch : language}
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
                              setLanguage(lang);
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
                  {loading ? "Creating..." : "Create Snippet"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
