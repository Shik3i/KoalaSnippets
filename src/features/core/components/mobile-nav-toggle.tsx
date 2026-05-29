"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/features/core/utils/utils";

interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileNavToggle({ isOpen, onClick }: MobileNavToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute left-full top-1/2 -translate-y-1/2 md:hidden z-40",
        "flex h-16 w-6 items-center justify-center rounded-r-xl",
        "bg-card/90 border-y border-r border-border shadow-md backdrop-blur-md",
        "text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/25"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <ChevronLeft size={16} className="animate-in fade-in duration-200" />
      ) : (
        <ChevronRight size={16} className="animate-in fade-in duration-200 animate-pulse" />
      )}
    </button>
  );
}
