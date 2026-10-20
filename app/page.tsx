import { getMessages } from "@/lib/i18n";

export default async function Home() {
  const { t } = await getMessages();
  return (
    <section className="py-10 sm:py-20">
      <p className="mb-4 text-sm tracking-widest text-lilac uppercase">{t.brand.tagline}</p>
      <h1 className="max-w-3xl text-4xl font-bold sm:text-6xl">{t.home.title}</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">{t.home.body}</p>
      <p className="alert alert-warning mt-8 max-w-2xl text-sm" role="status">{t.home.status}</p>
    </section>
  );
}
