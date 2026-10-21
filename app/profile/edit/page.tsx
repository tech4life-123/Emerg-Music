import { EditProfileForm } from "@/components/edit-profile-form";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/lib/i18n";
import { mediaUrl } from "@/lib/storage";

export const metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const { t, locale } = await getMessages();
  const { supabase, user } = await requireUser("/profile/edit");
  const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single();
  const P = t.profile;
  return (
    <EditProfileForm
      name={profile?.display_name ?? ""} locale={locale} avatarUrl={mediaUrl(profile?.avatar_url)} hasAvatar={Boolean(profile?.avatar_url)}
      labels={{ title: P.edit, cancel: P.cancel, save: P.save, name: P.name, language: P.language, photoHint: P.photoHint, privacy: P.privacy, error: P.saveFailed }}
      uploadLabels={{ ...t.studio.upload, choose: P.changePhoto, replace: P.changePhoto, errors: { ...t.studio.upload.errors, type: t.studio.upload.imageTypeError } }}
    />
  );
}
