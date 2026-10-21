import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { requireAdmin } from "@/lib/auth";
import { approveApplication, rejectApplication, resolveReport } from "./actions";

export const metadata = { title: "Admin" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ done?: string; error?: string }> }) {
  const { t } = await getMessages();
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const [apps, releases, reports, audit] = await Promise.all([
    supabase.from("artist_applications").select("id, artist_name, bio, links, created_at").eq("status", "pending").order("created_at"),
    supabase.from("releases").select("id, title, artists(name)").eq("status", "in_review").order("created_at"),
    supabase.from("copyright_reports").select("id, reporter_name, reporter_email, description, status, created_at").in("status", ["received", "under_review"]).order("created_at"),
    supabase.from("audit_log").select("id, action, target_type, target_id, detail, created_at, profiles(display_name)").order("id", { ascending: false }).limit(30),
  ]);
  const Empty = () => <p className="text-muted">{t.admin.none}</p>;
  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold">{t.admin.title}</h1>
      {sp.done && <p role="status" className="alert alert-success text-sm">{t.admin.done}</p>}
      {sp.error && <p role="alert" className="alert alert-danger text-sm">{t.studio.errorGeneric}</p>}

      <section><h2 className="mb-3 text-xl font-bold">{t.admin.applications}</h2>
        {apps.data?.length ? <ul className="flex flex-col gap-3">{apps.data.map((a) => (
          <li key={a.id} className="card flex flex-col gap-3 p-4">
            <div><p className="font-semibold">{a.artist_name}</p>{a.bio && <p className="text-sm text-muted">{a.bio}</p>}
              {a.links?.length > 0 && <p className="mt-1 break-all text-sm text-muted">{t.admin.links}: {a.links.join(" · ")}</p>}</div>
            <div className="flex flex-wrap items-end gap-3">
              <form action={approveApplication}><input type="hidden" name="id" value={a.id} /><button className="btn btn-primary" type="submit">{t.admin.approve}</button></form>
              <form action={rejectApplication} className="flex flex-wrap items-end gap-2"><input type="hidden" name="id" value={a.id} />
                <label className="flex flex-col gap-1 text-xs">{t.admin.reasonLabel}<input className="input" name="reason" required maxLength={500} /></label>
                <button className="btn btn-secondary" type="submit">{t.admin.reject}</button></form>
            </div>
          </li>))}</ul> : <Empty />}
      </section>

      <section><h2 className="mb-3 text-xl font-bold">{t.admin.releases}</h2>
        {releases.data?.length ? <ul className="card divide-y divide-border">{releases.data.map((r) => (
          <li key={r.id}><Link href={`/admin/releases/${r.id}`} className="flex min-h-16 items-center justify-between gap-3 p-3 hover:bg-plum">
            <span className="min-w-0 truncate font-semibold">{r.title} <span className="font-normal text-muted">{t.admin.by} {(r.artists as unknown as { name: string } | null)?.name}</span></span>
            <span className="shrink-0 text-sm text-lilac">{t.admin.review} ›</span></Link></li>))}</ul> : <Empty />}
      </section>

      <section><h2 className="mb-3 text-xl font-bold">{t.admin.reports}</h2>
        {reports.data?.length ? <ul className="flex flex-col gap-3">{reports.data.map((r) => (
          <li key={r.id} className="card flex flex-col gap-3 p-4">
            <div><p className="font-semibold">{r.reporter_name} · <span className="font-normal text-muted">{r.reporter_email}</span></p><p className="mt-1 whitespace-pre-wrap text-sm">{r.description}</p></div>
            <form action={resolveReport} className="flex flex-wrap items-end gap-2"><input type="hidden" name="id" value={r.id} />
              <label className="flex flex-1 flex-col gap-1 text-xs">{t.admin.noteLabel}<input className="input" name="note" maxLength={500} /></label>
              <button className="btn btn-secondary" name="status" value="under_review" type="submit">{t.admin.underReview}</button>
              <button className="btn btn-primary" name="status" value="upheld" type="submit">{t.admin.upheld}</button>
              <button className="btn btn-secondary" name="status" value="dismissed" type="submit">{t.admin.dismiss}</button>
            </form>
          </li>))}</ul> : <Empty />}
      </section>

      <section><h2 className="mb-3 text-xl font-bold">{t.admin.audit}</h2>
        {audit.data?.length ? <ul className="card divide-y divide-border text-sm">{audit.data.map((e) => (
          <li key={e.id} className="flex flex-wrap justify-between gap-2 p-3"><span>{e.action} · {e.target_type}</span>
            <span className="text-muted">{(e.profiles as unknown as { display_name: string } | null)?.display_name} · {new Date(e.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC</span></li>))}</ul> : <Empty />}
      </section>
    </div>
  );
}
