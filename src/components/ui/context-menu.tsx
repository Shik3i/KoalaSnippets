"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/features/core/utils/utils";

interface ContextMenuOption {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface ContextMenuProps {
  children: React.ReactNode;
  options: ContextMenuOption[];
}

export function ContextMenu({ children, options }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
    setPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      if (newX + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 10;
      }
      if (newY + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 10;
      }

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    }
  }, [isOpen, position.x, position.y]);

  return (
    <>
      <div onContextMenu={handleContextMenu} className="contents">
        {children}
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[200px] bg-popover/80 backdrop-blur-xl border border-border shadow-2xl rounded-xl p-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: position.y, left: position.x }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  option.onClick();
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent/50 transition-colors text-left",
                  option.variant === "destructive" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-foreground"
                )}
              >
                <Icon size={16} className={option.variant === "destructive" ? "text-destructive" : "text-muted-foreground"} />
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
