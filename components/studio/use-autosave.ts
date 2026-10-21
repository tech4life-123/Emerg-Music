"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export type SaveResult = { ok: true } | { ok: false; error: string };

// Debounced autosave. `flush()` saves right away (used before navigating to the next step).
export function useAutosave<T>(value: T, save: (v: T) => Promise<SaveResult>, delay = 700) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);
  const latest = useRef({ value, save });
  latest.current = { value, save };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = JSON.stringify(value);

  const run = useCallback(async (): Promise<boolean> => {
    setStatus("saving");
    const r = await latest.current.save(latest.current.value);
    if (r.ok) { setStatus("saved"); setError(null); return true; }
    setStatus("error"); setError(r.error); return false;
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("saving");
    timer.current = setTimeout(run, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [key, delay, run]);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    return run();
  }, [run]);

  return { status, error, flush };
}
