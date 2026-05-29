import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRelativeTime(
  dateInput: string | Date | number,
  t: {
    justNow: string;
    editedYesterday: string;
    editedXDaysAgo: string;
  }
): string {
  const now = Date.now();
  const then = new Date(dateInput).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 5) return t.justNow;
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return t.editedYesterday;
  if (diffDays < 7) return t.editedXDaysAgo.replace("{days}", String(diffDays));
  return new Date(dateInput).toLocaleDateString();
}
