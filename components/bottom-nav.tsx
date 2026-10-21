"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search, User } from "lucide-react";

export function BottomNav({ signedIn, labels }: { signedIn: boolean; labels: { home: string; search: string; library: string; profile: string; signIn: string } }) {
  const path = usePathname();
  const items = [
    { href: "/", label: labels.home, icon: Home, on: path === "/" },
    { href: "/search", label: labels.search, icon: Search, on: path.startsWith("/search") || path.startsWith("/genre") },
    { href: signedIn ? "/library" : "/login?next=/library", label: labels.library, icon: Library, on: path.startsWith("/library") || path.startsWith("/playlist") },
    { href: signedIn ? "/profile" : "/login", label: signedIn ? labels.profile : labels.signIn, icon: User, on: path.startsWith("/profile") || path.startsWith("/login") },
  ];
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-border bg-night/95 backdrop-blur md:hidden">
      {items.map(({ href, label, icon: Icon, on }) => (
        <Link key={href} href={href} aria-current={on ? "page" : undefined}
          className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs ${on ? "text-ivory" : "text-muted"}`}>
          <Icon size={22} aria-hidden />{label}
        </Link>
      ))}
    </nav>
  );
}
