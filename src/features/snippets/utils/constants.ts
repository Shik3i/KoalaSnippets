import { Lock, Globe, Link2, type LucideIcon } from "lucide-react";

export const VISIBILITY_CONFIG: Record<"PRIVATE" | "SHARED" | "PUBLIC", { icon: LucideIcon; label: string; color: string }> = {
  PRIVATE: { icon: Lock, label: "Private", color: "text-muted-foreground" },
  SHARED: { icon: Link2, label: "Shared", color: "text-info" },
  PUBLIC: { icon: Globe, label: "Public", color: "text-success" },
} as const;
