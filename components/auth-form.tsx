"use client";
import { useActionState } from "react";

type State = { error?: boolean; checkEmail?: boolean } | undefined;
type Labels = { email: string; password: string; displayName?: string; action: string; hint?: string; error: string; checkEmail: string };

export function AuthForm({ action, labels, next, withName }: {
  action: (prev: State, fd: FormData) => Promise<State>; labels: Labels; next?: string; withName?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="card mx-auto flex max-w-md flex-col gap-4 p-6">
      {next && <input type="hidden" name="next" value={next} />}
      {withName && (
        <label className="flex flex-col gap-1 text-sm">{labels.displayName}
          <input className="input" name="displayName" autoComplete="name" required maxLength={80} />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">{labels.email}
        <input className="input" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1 text-sm">{labels.password}
        <input className="input" type="password" name="password" autoComplete={withName ? "new-password" : "current-password"} required minLength={8} />
        {labels.hint && <span className="text-xs text-muted">{labels.hint}</span>}
      </label>
      {state?.error && <p className="alert alert-danger text-sm" role="alert">{labels.error}</p>}
      {state?.checkEmail && <p className="alert alert-success text-sm" role="status">{labels.checkEmail}</p>}
      <button className="btn btn-primary" disabled={pending} type="submit">{labels.action}</button>
    </form>
  );
}
