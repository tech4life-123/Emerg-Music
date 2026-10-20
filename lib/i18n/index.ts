import { cookies } from "next/headers";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

export type Locale = "en" | "fr";
export type Messages = typeof en;
const all: Record<Locale, Messages> = { en, fr };

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value === "fr" ? "fr" : "en";
}

export async function getMessages() {
  const locale = await getLocale();
  return { locale, t: all[locale] };
}
