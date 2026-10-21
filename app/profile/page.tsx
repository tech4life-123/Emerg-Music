import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/lib/i18n";
import { mediaUrl } from "@/lib/storage";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { t, locale } = await getMessages();
  const { supabase, user, role } = await requireUser("/profile");
  const [{ data: profile }, liked, lists, follows, { data: artist }] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single(),
    supabase.from("favorites").select("track_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("playlists").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("artist_follows").select("artist_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("artists").select("id").eq("owner_id", user.id).maybeSingle(),
  ]);
  const name = profile?.display_name || user.email?.split("@")[0] || "";
  const L = t.library, P = t.profile;
  // Listener until an artist application is approved; then Artist. Admin is added for admins.
  const isArtist = Boolean(artist) || role === "artist";
  const roleLabel = [isArtist ? P.roles.artist : P.roles.listener, role === "admin" ? P.roles.admin : null].filter(Boolean).join(" · ");
  const row = (label: string, value: React.ReactNode, href?: string) => {
    const inner = <><span className="flex-1">{label}</span><span className="text-muted">{value}</span></>;
    return href
      ? <Link href={href} className="flex min-h-14 items-center gap-3 border-b border-border text-base hover:bg-surface">{inner}</Link>
      : <div className="flex min-h-14 items-center gap-3 border-b border-border text-base">{inner}</div>;
  };
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <section className="flex items-center gap-5 rounded-2xl p-5" style={{ background: "linear-gradient(180deg,#38213F 0%,#130F18 100%)" }}>
        <Avatar url={mediaUrl(profile?.avatar_url)} name={name} className="h-24 w-24 text-4xl sm:h-28 sm:w-28" />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">{name}</h1>
          <p className="text-sm text-muted">{roleLabel}</p>
          <p className="text-sm text-muted">{follows.count ?? 0} {L.following.toLowerCase()}</p>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/profile/edit" className="btn btn-secondary inline-flex h-11 items-center rounded-full px-6">{P.edit}</Link>
        {(artist || role === "artist") && <Link href="/studio" className="btn btn-primary inline-flex h-11 items-center rounded-full px-6">{P.studio}</Link>}
        {role === "admin" && <Link href="/admin" className="btn btn-secondary inline-flex h-11 items-center rounded-full px-6">{P.admin}</Link>}
      </div>
      <div>
        {row(t.notifications.title, "›", "/notifications")}
        {row(L.liked, liked.count ?? 0, "/library?tab=liked")}
        {row(L.playlists, lists.count ?? 0, "/library?tab=playlists")}
        {row(L.following, follows.count ?? 0, "/library?tab=following")}
        {row(P.language, locale === "fr" ? "Français" : "English")}
        {row(P.plan, P.free)}
        {role === "listener" && !artist && row(t.studio.applyCta, "›", "/studio/apply")}
        <form action="/auth/signout" method="post"><button className="flex min-h-14 w-full items-center text-left text-base" type="submit">{t.nav.signOut}</button></form>
      </div>
      <p className="text-xs text-muted">{user.email}</p>
    </div>
  );
}
