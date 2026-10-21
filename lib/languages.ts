// Languages an artist can pick for a release. Stored as the code; labels are shown per UI language.
export const RELEASE_LANGUAGES = [
  "en", "lib-en", "fr", "kpelle", "bassa", "gio", "mano", "kru", "grebo", "vai", "mandingo", "loma", "gola", "kissi", "krahn", "other", "none",
] as const;
export type ReleaseLanguage = (typeof RELEASE_LANGUAGES)[number];

const LABELS: Record<"en" | "fr", Record<ReleaseLanguage, string>> = {
  en: { en: "English", "lib-en": "Liberian English (Kolokwa)", fr: "French", kpelle: "Kpelle", bassa: "Bassa", gio: "Gio (Dan)", mano: "Mano", kru: "Kru", grebo: "Grebo", vai: "Vai", mandingo: "Mandingo", loma: "Loma", gola: "Gola", kissi: "Kissi", krahn: "Krahn", other: "Other language", none: "Instrumental (no lyrics)" },
  fr: { en: "Anglais", "lib-en": "Anglais libérien (Kolokwa)", fr: "Français", kpelle: "Kpelle", bassa: "Bassa", gio: "Gio (Dan)", mano: "Mano", kru: "Kru", grebo: "Grebo", vai: "Vaï", mandingo: "Mandingue", loma: "Loma", gola: "Gola", kissi: "Kissi", krahn: "Krahn", other: "Autre langue", none: "Instrumental (sans paroles)" },
};
export const languageLabel = (code: string | null | undefined, locale: "en" | "fr") => (code && LABELS[locale][code as ReleaseLanguage]) || "";
export const languageOptions = (locale: "en" | "fr") => RELEASE_LANGUAGES.map((code) => ({ code, label: LABELS[locale][code] }));
export const isReleaseLanguage = (v: string): v is ReleaseLanguage => (RELEASE_LANGUAGES as readonly string[]).includes(v);
