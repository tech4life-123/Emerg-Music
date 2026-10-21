"use client";
import { useEffect } from "react";
import { markAllRead } from "@/app/notifications/actions";

// Opening the notifications page marks everything as read (after a short moment, so the unread dots are seen first).
export function MarkRead({ when }: { when: boolean }) {
  useEffect(() => { if (!when) return; const id = setTimeout(() => { markAllRead(); }, 1500); return () => clearTimeout(id); }, [when]);
  return null;
}
