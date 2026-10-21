import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { getMessages } from "@/lib/i18n";

export async function SiteHeader() {
  const { t } = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data?.role : null;
  const unread = user ? (await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null)).count ?? 0 : 0;
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" aria-label="Emerg Music" className="shrink-0">
          <Image src="/brand/logo-horizontal.svg" alt="Emerg Music" width={190} height={32} priority className="h-8 w-auto max-w-none" />
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn btn-secondary hidden items-center md:inline-flex" href="/search">{t.nav.search}</Link>
          {user ? (
            <>
              <Link href="/notifications" aria-label={`${t.notifications.title}${unread ? ` (${unread})` : ""}`} className="relative grid h-11 w-11 place-items-center rounded-full text-ivory hover:bg-plum">
                <Bell size={22} aria-hidden />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-lilac px-1 text-[10px] font-bold text-night">{unread > 9 ? "9+" : unread}</span>}
              </Link>
              {role === "admin" && <Link className="btn btn-secondary inline-flex items-center" href="/admin">{t.admin.title}</Link>}
              {(role === "artist" || role === "admin") && <Link className="btn btn-secondary inline-flex items-center" href="/studio">{t.studio.title}</Link>}
              <Link className="btn btn-secondary hidden items-center md:inline-flex" href="/profile">{t.nav.profile}</Link>
              <form action="/auth/signout" method="post" className="hidden md:block"><button className="btn btn-secondary" type="submit">{t.nav.signOut}</button></form>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary inline-flex items-center" href="/login">{t.nav.signIn}</Link>
              <Link className="btn btn-primary inline-flex items-center" href="/signup">{t.nav.signUp}</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
