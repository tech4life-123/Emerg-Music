"use client";
// Uses the phone's share sheet when available, otherwise copies the link.
export async function shareLink(url: string, title: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) { await navigator.share({ url, title }); return "shared"; }
    await navigator.clipboard.writeText(url); return "copied";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "shared";
    try { await navigator.clipboard.writeText(url); return "copied"; } catch { return "failed"; }
  }
}
