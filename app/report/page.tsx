import { getMessages } from "@/lib/i18n";
import { fileReport } from "./actions";

export const metadata = { title: "Report a copyright issue" };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { t } = await getMessages();
  const sp = await searchParams;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl font-bold">{t.report.title}</h1>
      <p className="text-muted">{t.report.intro}</p>
      {sp.sent ? <p role="status" className="alert alert-success text-sm">{t.report.sent}</p> : (
        <form action={fileReport} className="card flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1 text-sm">{t.report.trackUrl}<input className="input" name="url" maxLength={300} /></label>
          <label className="flex flex-col gap-1 text-sm">{t.report.name}<input className="input" name="name" required maxLength={120} /></label>
          <label className="flex flex-col gap-1 text-sm">{t.report.email}<input className="input" type="email" name="email" required maxLength={200} /></label>
          <label className="flex flex-col gap-1 text-sm">{t.report.description}<textarea className="input" name="description" rows={5} required minLength={10} maxLength={3600} /></label>
          {sp.error && <p role="alert" className="alert alert-danger text-sm">{t.studio.errorGeneric}</p>}
          <button className="btn btn-primary" type="submit">{t.report.send}</button>
        </form>
      )}
    </div>
  );
}
