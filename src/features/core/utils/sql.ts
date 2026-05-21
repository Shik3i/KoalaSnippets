export function escapeLike(value: string): string {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
