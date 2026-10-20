import { redirect } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { applyAsArtist } from "../actions";

export const metadata = { title: "Apply" };

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { t } = await getMessages();
  const { supabase, user, role } = await requireUser("/studio/apply");
  if (role !== "listener") redirect("/studio");
  const { data: pending } = await supabase.from("artist_applications").select("id").eq("user_id", user.id).eq("status", "pending").limit(1);
  if (pending?.length) redirect("/studio");
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl font-bold">{t.studio.applyTitle}</h1>
      <p className="text-muted">{t.studio.applyIntro}</p>
      <form action={applyAsArtist} className="card flex flex-col gap-4 p-6">
        <label className="flex flex-col gap-1 text-sm">{t.studio.artistName}<input className="input" name="artistName" required minLength={2} maxLength={80} /></label>
        <label className="flex flex-col gap-1 text-sm">{t.studio.bio}<textarea className="input" name="bio" rows={4} maxLength={2000} /></label>
        <label className="flex flex-col gap-1 text-sm">{t.studio.links}<textarea className="input" name="links" rows={3} placeholder="https://" /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="accept" required className="mt-1 accent-violet" />{t.studio.accept}</label>
        {error && <p role="alert" className="alert alert-danger text-sm">{t.studio.errorGeneric}</p>}
        <button className="btn btn-primary" type="submit">{t.studio.submitApplication}</button>
      </form>
    </div>
  );
}
