"use client";
import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/profile/actions";
import { Avatar } from "./avatar";
import { MediaUpload } from "./media-upload";

export function EditProfileForm({ name, locale, avatarUrl, hasAvatar, labels, uploadLabels }: {
  name: string; locale: "en" | "fr"; avatarUrl: string | null; hasAvatar: boolean;
  labels: { title: string; cancel: string; save: string; name: string; language: string; photoHint: string; privacy: string; error: string };
  uploadLabels: { choose: string; replace: string; uploading: string; done: string; errors: Record<string, string> };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProfile, undefined);
  useEffect(() => { if (state?.saved) router.push("/profile"); }, [state, router]);
  return (
    <div className="mx-auto flex max-w-md flex-col">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <Link href="/profile" className="inline-flex min-h-11 items-center text-base">{labels.cancel}</Link>
        <h1 className="text-lg font-bold">{labels.title}</h1>
        <button form="edit-profile" type="submit" disabled={pending} className="min-h-11 text-base font-semibold text-lilac disabled:opacity-60">{labels.save}</button>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Avatar url={avatarUrl} name={name} className="h-32 w-32 text-6xl" />
        <p className="text-xs text-muted">{labels.photoHint}</p>
        <MediaUpload kind="avatar" targetId="me" hasFile={hasAvatar} labels={uploadLabels} variant="link" />
      </div>
      <form id="edit-profile" action={action} className="mt-4 flex flex-col gap-1">
        <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">{labels.name}
          <input className="input h-12 text-base font-normal" name="displayName" defaultValue={name} required maxLength={80} autoComplete="name" />
        </label>
        <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">{labels.language}
          <select className="input h-12 text-base font-normal" name="locale" defaultValue={locale}><option value="en">English</option><option value="fr">Français</option></select>
        </label>
        {state?.error && <p role="alert" className="alert alert-danger mt-4 text-sm">{labels.error}</p>}
        <p className="mt-4 text-xs leading-relaxed text-muted">{labels.privacy}</p>
      </form>
    </div>
  );
}
