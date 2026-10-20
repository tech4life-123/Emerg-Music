import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/i18n";

export async function SiteHeader() {
  const { t } = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data?.role : null;
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" aria-label="Emerg Music" className="shrink-0">
          <Image src="/brand/logo-horizontal.svg" alt="Emerg Music" width={190} height={32} priority className="h-8 w-auto max-w-none" />
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              {role === "admin" && <Link className="btn btn-secondary inline-flex items-center" href="/admin">{t.admin.title}</Link>}
              <Link className="btn btn-secondary inline-flex items-center" href="/studio">{t.studio.title}</Link>
              <Link className="btn btn-secondary inline-flex items-center" href="/profile">{t.nav.profile}</Link>
              <form action="/auth/signout" method="post"><button className="btn btn-secondary" type="submit">{t.nav.signOut}</button></form>
            </>
          ) : (
            <>
              <Link className="btn btn-secondary inline-flex items-center" href="/login">{t.nav.signIn}</Link>
              <Link className="btn btn-primary inline-flex items-center" href="/signup">{t.nav.signUp}</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
