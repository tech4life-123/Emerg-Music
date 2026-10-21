"use client";
import { useEffect, useRef } from "react";

// Bottom sheet on phones, centered dialog on larger screens. Esc and backdrop tap close it.
export function Sheet({ open, onClose, title, closeLabel, children }: { open: boolean; onClose: () => void; title: React.ReactNode; closeLabel: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-night/75" onClick={onClose} tabIndex={-1} />
      <div ref={panel} tabIndex={-1} className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8 outline-none sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted sm:hidden" aria-hidden />
        <div className="mb-2 border-b border-border pb-3 text-lg font-bold">{title}</div>
        {children}
      </div>
    </div>
  );
}

export const sheetItem = "flex min-h-13 w-full items-center gap-4 rounded-md px-1 py-2 text-left text-base hover:bg-plum";
