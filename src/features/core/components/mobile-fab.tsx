"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, FileDown, ClipboardPaste, X, Wrench, Menu, Search } from "lucide-react";
import { cn } from "@/features/core/utils/utils";

interface MobileFABProps {
  onToggleMenu?: () => void;
  mobileOpen?: boolean;
}

export function MobileFAB({ onToggleMenu, mobileOpen }: MobileFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handlePaste = async () => {
    setIsOpen(false);
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sessionStorage.setItem("koalasnippets_import", JSON.stringify({
          title: "Pasted Snippet",
          files: [{ filename: "pasted.txt", code: text, language: "plaintext" }]
        }));
        window.location.href = "/dashboard/new?import=1";
      }
    } catch (err) {
      console.error("Failed to read clipboard", err);
    }
  };

  const handleSearch = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const handleMenu = () => {
    setIsOpen(false);
    onToggleMenu?.();
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 md:hidden flex flex-col items-end gap-3 pointer-events-none">
      <div
        className={cn(
          "flex flex-col items-end gap-3 transition-all duration-200 pointer-events-auto",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <button
          onClick={handleMenu}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-md border border-border/50 text-sm font-medium hover:bg-accent/80 active:scale-95 transition-all touch-target"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? "Close Menu" : "Menu"}
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-md border border-border/50 text-sm font-medium hover:bg-accent/80 active:scale-95 transition-all touch-target"
          aria-label="Search"
        >
          Search
          <Search size={16} />
        </button>
        <button
          onClick={handlePaste}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-md border border-border/50 text-sm font-medium hover:bg-accent/80 active:scale-95 transition-all touch-target"
        >
          Paste from Clipboard
          <ClipboardPaste size={16} />
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.multiple = true;
            fileInput.onchange = async (e: Event) => {
              const files = (e.target as HTMLInputElement).files;
              if (files && files.length > 0) {
                const fileObjects = [];
                for (let i = 0; i < files.length; i++) {
                  const text = await files[i].text();
                  fileObjects.push({ filename: files[i].name, code: text, language: "plaintext" });
                }
                sessionStorage.setItem("koalasnippets_import", JSON.stringify({
                  title: fileObjects.length === 1 ? fileObjects[0].filename : "Imported Snippet",
                  files: fileObjects
                }));
                window.location.href = "/dashboard/new?import=1";
              }
            };
            fileInput.click();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-md border border-border/50 text-sm font-medium hover:bg-accent/80 active:scale-95 transition-all touch-target"
        >
          Import File(s)
          <FileDown size={16} />
        </button>
        <Link
          href="/dashboard/new"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-md border border-border/50 text-sm font-medium hover:bg-accent/80 active:scale-95 transition-all touch-target"
        >
          New Snippet
          <Plus size={16} />
        </Link>
        <Link
          href="/tools"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-md border border-border/50 text-sm font-medium hover:bg-accent/80 active:scale-95 transition-all touch-target"
        >
          Dev Tools
          <Wrench size={16} />
        </Link>
      </div>

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all pointer-events-auto border border-primary/20 touch-target"
        aria-label="Quick Actions"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
