import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { requireAdmin } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { languageLabel } from "@/lib/languages";
import { mediaUrl } from "@/lib/storage";
import { publishRelease, removeRelease, sendBackRelease } from "../../actions";

export const metadata = { title: "Review release" };

type Track = { id: string; title: string; track_number: number; explicit: boolean; audio_path: string | null; processing_status: string; track_credits: { name: string; role: string }[] };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { t } = await getMessages();
  const locale = await getLocale();
  const { supabase } = await requireAdmin();
  const { data: r } = await supabase.from("releases")
    .select("id, title, type, status, cover_path, language, artists(name, slug, bio), genre:genres(name)").eq("id", id).maybeSingle();
  if (!r) notFound();
  const [{ data: tracks }, { data: rights }] = await Promise.all([
    supabase.from("tracks").select("id, title, track_number, explicit, audio_path, processing_status, track_credits(name, role)").eq("release_id", id).order("track_number"),
    supabase.from("rights_declarations").select("statement_version, accepted_at").eq("release_id", id).order("accepted_at", { ascending: false }).limit(1),
  ]);
  const A = t.admin;
  const artist = r.artists as unknown as { name: string; slug: string; bio: string | null } | null;
  const genre = (r.genre as unknown as { name: string } | null)?.name ?? "";
  const decl = rights?.[0];
  const procLabel = (s: string) => (s === "ready" ? A.processingReady : s === "failed" ? A.processingFailed : A.processingPending);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/admin" className="inline-flex min-h-11 items-center text-sm text-lilac underline">← {A.back}</Link>
      <h1 className="text-3xl font-bold">{A.reviewTitle}</h1>
      {r.status !== "in_review" && <p role="status" className="alert alert-warning text-sm">{A.notInReview} ({t.studio.statuses[r.status as "draft"]})</p>}

      <div className="card flex items-center gap-4 p-3">
        <Cover url={mediaUrl(r.cover_path)} seed={r.title} className="h-28 w-28" />
        <div className="min-w-0">
          <p className="truncate text-xl font-bold">{r.title}</p>
          <p className="text-sm text-muted">{A.artist}: {artist ? <Link className="underline" href={`/artist/${artist.slug}`}>{artist.name}</Link> : ""}</p>
          <p className="text-sm text-muted">{t.studio.types[r.type as "single"]} · {genre} · {languageLabel(r.language, locale)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-1 text-xl font-bold">{t.studio.tracks}</h2>
        <p className="mb-2 text-sm text-muted">{A.checkAudio}</p>
        <ol className="flex flex-col gap-3">
          {((tracks ?? []) as unknown as Track[]).map((tr) => {
            const src = mediaUrl(tr.audio_path);
            return (
              <li key={tr.id} className="card flex flex-col gap-2 p-3">
                <p className="font-semibold"><span className="mr-2 tabular-nums text-muted">{tr.track_number}.</span>{tr.title}{tr.explicit && <span className="ml-2 rounded bg-plum px-1.5 text-xs">{A.explicitTag}</span>}</p>
                {src ? <audio controls preload="none" src={src} className="w-full" /> : <p className="text-sm text-danger">{A.noAudio}</p>}
                <p className="text-xs text-muted">{A.processing}: {procLabel(tr.processing_status)}</p>
                {tr.track_credits.length > 0 && <p className="text-sm text-muted">{A.creditsLabel}: {tr.track_credits.map((c) => `${c.name} (${t.library.roles[c.role as "writer"] ?? c.role})`).join(", ")}</p>}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card p-3 text-sm">
        <h2 className="mb-1 text-lg font-bold">{A.rightsDeclared}</h2>
        {decl ? <p>{A.rightsLine.replace("{when}", new Date(decl.accepted_at).toISOString().slice(0, 16).replace("T", " ") + " UTC").replace("{v}", decl.statement_version)}</p> : <p className="text-danger">{A.rightsNone}</p>}
      </section>

      {r.status === "in_review" && (
        <section className="flex flex-col gap-5">
          <form action={publishRelease}><input type="hidden" name="id" value={r.id} />
            <button className="btn btn-primary h-12 w-full" type="submit" disabled={!decl}>{A.approvePublish}</button></form>
          <form action={sendBackRelease} className="card flex flex-col gap-2 p-3"><input type="hidden" name="id" value={r.id} />
            <p className="font-semibold">{A.sendBack}</p><p className="text-xs text-muted">{A.sendBackHint}</p>
            <label className="flex flex-col gap-1 text-sm">{A.feedbackLabel}<textarea className="input" name="reason" rows={3} required maxLength={500} /></label>
            <button className="btn btn-secondary h-11" type="submit">{A.sendBack}</button></form>
          <form action={removeRelease} className="card flex flex-col gap-2 p-3"><input type="hidden" name="id" value={r.id} />
            <p className="font-semibold">{A.remove}</p><p className="text-xs text-muted">{A.removeHint}</p>
            <label className="flex flex-col gap-1 text-sm">{A.reasonLabel}<input className="input" name="reason" required maxLength={500} /></label>
            <button className="btn btn-secondary h-11" type="submit">{A.remove}</button></form>
        </section>
      )}
    </div>
  );
}
