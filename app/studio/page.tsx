import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { startRelease } from "./release-actions";
import { Cover } from "@/components/cover";
import { MediaUpload } from "@/components/media-upload";
import { mediaUrl } from "@/lib/storage";

export const metadata = { title: "Artist Studio" };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ applied?: string; error?: string }> }) {
  const { t } = await getMessages();
  const { supabase, user } = await requireUser("/studio");
  const sp = await searchParams;
  const { data: artist } = await supabase.from("artists").select("id, name, slug, image_url").eq("owner_id", user.id).maybeSingle();

  if (!artist) {
    const { data: apps } = await supabase.from("artist_applications").select("status, decision_reason, artist_name, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
    const app = apps?.[0];
    const label = app ? { pending: t.studio.statusPending, approved: t.studio.statusApproved, rejected: t.studio.statusRejected }[app.status as "pending" | "approved" | "rejected"] : null;
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="text-3xl font-bold">{t.studio.title}</h1>
        {sp.applied && <p role="status" className="alert alert-success text-sm">{t.studio.applied}</p>}
        {app ? (
          <div className="card p-6">
            <p className="text-sm text-muted">{t.studio.status}</p>
            <p className="mt-1 text-lg font-semibold">{app.artist_name} · {label}</p>
            {app.decision_reason && <p className="mt-2 text-sm text-muted">{t.studio.reason}: {app.decision_reason}</p>}
          </div>
        ) : <p className="text-muted">{t.studio.noApplication}</p>}
        {(!app || app.status === "rejected") && <Link className="btn btn-primary inline-flex w-fit items-center" href="/studio/apply">{t.studio.applyCta}</Link>}
      </div>
    );
  }

  const [{ data: releases }, { count: plays }] = await Promise.all([
    supabase.from("releases").select("id, title, type, status, removal_reason").eq("artist_id", artist.id).order("created_at", { ascending: false }),
    supabase.from("play_events").select("id, tracks!inner(artist_id)", { count: "exact", head: true }).eq("tracks.artist_id", artist.id),
  ]);
  return (
    <div className="flex flex-col gap-8">
      <div><h1 className="text-3xl font-bold">{t.studio.title}</h1><p className="mt-1 text-muted">{artist.name}</p></div>
      <p className="alert alert-warning max-w-3xl text-sm">{t.studio.monetization}</p>
      <section className="card flex max-w-xl flex-wrap items-center gap-4 p-4">
        <Cover url={mediaUrl(artist.image_url)} seed={artist.name} round className="h-20 w-20" />
        <div className="min-w-0 flex-1"><h2 className="text-lg font-bold">{t.studio.photoTitle}</h2><p className="text-sm text-muted">{t.studio.photoHint}</p>
          <MediaUpload kind="artist" targetId={artist.id} hasFile={Boolean(artist.image_url)} labels={{ ...t.studio.upload, errors: { ...t.studio.upload.errors, type: t.studio.upload.imageTypeError } }} /></div>
      </section>
      <section className="card max-w-sm p-5">
        <p className="text-sm text-muted">{t.studio.plays}</p>
        <p className="text-3xl font-bold tabular-nums">{plays ?? 0}</p>
        <p className="mt-1 text-xs text-muted">{t.studio.playsNote}</p>
      </section>
      <section>
        <form action={startRelease}><button className="btn btn-primary h-12" type="submit">+ {t.studio.wizard.newRelease}</button></form>
        {sp.error && <p role="alert" className="alert alert-danger mt-3 max-w-xl text-sm">{t.studio.errorGeneric}</p>}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">{t.studio.yourReleases}</h2>
        {releases?.length ? (
          <ul className="card divide-y divide-border">
            {releases.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                <Link className="min-w-0 truncate font-semibold hover:underline" href={`/studio/releases/${r.id}`}>{r.title}</Link>
                <span className="text-sm text-muted">{t.studio.types[r.type as "single"]} · {t.studio.statuses[r.status as "draft"]}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted">{t.studio.noReleases}</p>}
      </section>
    </div>
  );
}
