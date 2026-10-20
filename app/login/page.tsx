import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { getMessages } from "@/lib/i18n";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { t } = await getMessages();
  const { next } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 text-center text-3xl font-bold">{t.auth.signInTitle}</h1>
      <AuthForm action={signIn} next={next} labels={{ ...t.auth, action: t.auth.signInAction }} />
      <p className="mt-4 text-center text-sm text-muted">{t.auth.noAccount} <Link className="text-lilac underline" href="/signup">{t.nav.signUp}</Link></p>
    </div>
  );
}
