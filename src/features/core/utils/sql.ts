export function escapeLike(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).replace(/%/g, "\\%").replace(/_/g, "\\_");
}
