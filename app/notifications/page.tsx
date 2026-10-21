import Link from "next/link";
import { MarkRead } from "@/components/mark-read";
import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { t } = await getMessages();
  const locale = await getLocale();
  const { supabase, user } = await requireUser("/notifications");
  const { data } = await supabase.from("notifications").select("id, kind, data, link, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  const N = t.notifications;
  const text = (kind: string, d: Record<string, string | null>) =>
    (N.kinds[kind as keyof typeof N.kinds] ?? kind).replace("{title}", d.title ?? "").replace("{name}", d.name ?? "").replace("{reason}", d.reason ?? "");
  const items = data ?? [];
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl font-bold">{N.title}</h1>
      <MarkRead when={items.some((n) => !n.read_at)} />
      {items.length ? (
        <ul className="card divide-y divide-border">
          {items.map((n) => {
            const body = (
              <>
                <p className={n.read_at ? "text-muted" : "font-semibold"}>{text(n.kind, n.data as Record<string, string | null>)}</p>
                <p className="mt-1 text-xs text-muted">{new Date(n.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </>
            );
            return (
              <li key={n.id} className="flex gap-3 p-4">
                <span aria-hidden className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-lilac"}`} />
                {n.link ? <Link href={n.link} className="min-w-0 flex-1 hover:underline">{body}</Link> : <div className="min-w-0 flex-1">{body}</div>}
              </li>
            );
          })}
        </ul>
      ) : <p className="text-muted">{N.none}</p>}
    </div>
  );
}
