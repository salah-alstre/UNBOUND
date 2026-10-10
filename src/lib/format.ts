/** UTC so server and client always render the same string. */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}
