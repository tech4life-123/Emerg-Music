import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getMessages } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { t, locale } = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user.id).single();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{t.profile.title}</h1>
      <p className="text-sm text-muted">{user.email} · {t.profile.role}: {t.profile.roles[(profile?.role ?? "listener") as "listener" | "artist" | "admin"]}</p>
      <ProfileForm
        displayName={profile?.display_name ?? ""}
        locale={locale}
        labels={{ ...t.profile, displayName: t.auth.displayName, error: t.auth.error }}
      />
    </div>
  );
}
