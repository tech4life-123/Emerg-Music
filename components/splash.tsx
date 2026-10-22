"use client";
import { useEffect, useState } from "react";

// Short branded splash shown once per browser session. It never blocks the page: it is an overlay that fades itself out.
export function Splash({ tagline }: { tagline: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("emerg_splash")) { setGone(true); return; }
      sessionStorage.setItem("emerg_splash", "1");
    } catch { /* private mode: just show it */ }
    const timer = setTimeout(() => setGone(true), 2200);
    return () => clearTimeout(timer);
  }, []);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-horizontal.svg" alt="" width={260} height={44} className="splash-logo" />
      <p className="splash-tag">{tagline}</p>
    </div>
  );
}
