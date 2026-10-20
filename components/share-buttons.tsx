"use client";
import { useState } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";

export function ShareButtons({ url, text, labels }: { url: string; text: string; labels: { whatsapp: string; facebook: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a className="btn btn-secondary inline-flex items-center gap-2" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden />{labels.whatsapp}</a>
      <a className="btn btn-secondary inline-flex items-center gap-2" href={fb} target="_blank" rel="noopener noreferrer"><Share2 size={16} aria-hidden />{labels.facebook}</a>
      <button className="btn btn-secondary inline-flex items-center gap-2" type="button"
        onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}>
        <Link2 size={16} aria-hidden />{copied ? labels.copied : labels.copy}
      </button>
      <span className="sr-only" role="status">{copied ? labels.copied : ""}</span>
    </div>
  );
}
