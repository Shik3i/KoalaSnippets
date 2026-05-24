"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/features/core/utils/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: ReactNode;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
}

function AbstractArt() {
  return (
    <div className="relative w-48 h-48 mb-6 opacity-60">
      <div className="absolute top-4 left-8 w-20 h-20 rounded-2xl bg-primary/20 rotate-12 animate-pulse" />
      <div className="absolute top-10 right-4 w-16 h-16 rounded-full bg-primary/15 -rotate-6" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-6 left-12 w-24 h-24 rounded-lg bg-primary/10 rotate-45" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-10 right-8 w-12 h-12 rounded-full bg-primary/25" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 192">
        <line x1="30" y1="80" x2="160" y2="70" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="25" y1="120" x2="165" y2="130" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 8" />
      </svg>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon ? (
        <div className="mb-4 text-muted-foreground opacity-40">{icon}</div>
      ) : (
        <AbstractArt />
      )}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant ?? "default"}
              onClick={action.onClick}
              className="gap-1.5"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
