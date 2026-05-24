"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { detectLanguageFromFilename } from "@/features/snippets/utils/language-detection";
import { SUPPORTED_LANGUAGES } from "@/features/snippets/utils/shiki";

export function GlobalDropzone() {
  const [isDragging, setIsDragging] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Ensure we only hide if we're leaving the window, not just child elements
      if (e.clientX === 0 || e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        
        try {
          const text = await file.text();
          let lang = detectLanguageFromFilename(file.name) ?? "typescript";
          if (!SUPPORTED_LANGUAGES.includes(lang)) {
            lang = "plaintext";
          }

          const importData = {
            title: file.name,
            files: [{
              filename: file.name,
              code: text,
              language: lang
            }],
            visibility: "PRIVATE"
          };

          sessionStorage.setItem("koalasnippets_import", JSON.stringify(importData));
          router.push("/dashboard/new?import=1");
        } catch (error) {
          console.error("Failed to read dropped file:", error);
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [router]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary m-4 rounded-xl pointer-events-none transition-all duration-200">
      <div className="flex flex-col items-center gap-4 text-primary bg-card p-12 rounded-2xl shadow-2xl scale-110 animate-in zoom-in-95 duration-200">
        <UploadCloud size={64} className="animate-bounce" />
        <h2 className="text-3xl font-bold tracking-tight">Drop file to create snippet</h2>
        <p className="text-muted-foreground font-medium">Filename and language will be auto-detected.</p>
      </div>
    </div>
  );
}
