"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function fileReport(fd: FormData) {
  const s = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const supabase = await createClient();
  const description = `${s("url", 300) ? `Page: ${s("url", 300)}\n\n` : ""}${s("description", 3600)}`;
  const { error } = await supabase.from("copyright_reports").insert({ reporter_name: s("name", 120), reporter_email: s("email", 200), description });
  redirect(error ? "/report?error=1" : "/report?sent=1");
}
