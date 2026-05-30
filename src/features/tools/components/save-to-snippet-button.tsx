"use client";

import { useRouter } from "next/navigation";
import { FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/core/i18n";
import { useToast } from "@/components/ui/toast";

interface SaveToSnippetButtonProps {
  code: string;
  language: string;
  defaultTitle: string;
  disabled?: boolean;
}

export function SaveToSnippetButton({
  code,
  language,
  defaultTitle,
  disabled = false,
}: SaveToSnippetButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { addToast } = useToast();

  const handleSave = () => {
    if (!code.trim()) return;

    try {
      const importData = {
        title: defaultTitle,
        files: [
          {
            filename: `${defaultTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") || "generated"}.${getFileExtension(language)}`,
            code: code,
            language: language,
          },
        ],
      };

      sessionStorage.setItem("koalasnippets_import", JSON.stringify(importData));
      addToast(t.saveAsSnippetSuccess, "success");
      router.push("/dashboard/new?import=1");
    } catch (err) {
      console.error("Failed to save tool output to snippet draft", err);
      addToast("Failed to initiate snippet draft creation", "error");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={disabled || !code.trim()}
      className="gap-2 border-primary/20 hover:border-primary/50 transition-colors"
      type="button"
    >
      <FileCode size={14} className="text-primary" />
      <span>{t.saveAsSnippet}</span>
    </Button>
  );
}

function getFileExtension(lang: string): string {
  switch (lang.toLowerCase()) {
    case "typescript":
    case "ts":
      return "ts";
    case "javascript":
    case "js":
      return "js";
    case "json":
      return "json";
    case "yaml":
    case "yml":
      return "yaml";
    case "sql":
      return "sql";
    case "html":
      return "html";
    case "css":
      return "css";
    case "markdown":
    case "md":
      return "md";
    case "python":
    case "py":
      return "py";
    default:
      return "txt";
  }
}
