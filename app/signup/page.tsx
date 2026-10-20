import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { getMessages } from "@/lib/i18n";
import { signUp } from "../login/actions";

export default async function SignupPage() {
  const { t } = await getMessages();
  return (
    <div>
      <h1 className="mb-6 text-center text-3xl font-bold">{t.auth.signUpTitle}</h1>
      <AuthForm action={signUp} withName labels={{ ...t.auth, action: t.auth.signUpAction, hint: t.auth.passwordHint }} />
      <p className="mt-4 text-center text-sm text-muted">{t.auth.haveAccount} <Link className="text-lilac underline" href="/login">{t.nav.signIn}</Link></p>
    </div>
  );
}
