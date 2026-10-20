"use client";
import { useActionState } from "react";
import { saveProfile } from "@/app/profile/actions";

export function ProfileForm({ displayName, locale, labels }: {
  displayName: string; locale: "en" | "fr";
  labels: { displayName: string; language: string; save: string; saved: string; error: string };
}) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  return (
    <form action={action} className="card flex max-w-md flex-col gap-4 p-6">
      <label className="flex flex-col gap-1 text-sm">{labels.displayName}
        <input className="input" name="displayName" defaultValue={displayName} required maxLength={80} />
      </label>
      <label className="flex flex-col gap-1 text-sm">{labels.language}
        <select className="input" name="locale" defaultValue={locale}>
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </label>
      {state?.saved && <p className="alert alert-success text-sm" role="status">{labels.saved}</p>}
      {state?.error && <p className="alert alert-danger text-sm" role="alert">{labels.error}</p>}
      <button className="btn btn-primary" disabled={pending} type="submit">{labels.save}</button>
    </form>
  );
}
