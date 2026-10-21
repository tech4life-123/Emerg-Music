"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const s = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const uuid = (v: string) => (/^[0-9a-f-]{36}$/i.test(v) ? v : redirect("/admin?error=1"));

async function run(fn: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { message: string } | null }>) {
  const supabase = await createClient();
  const { error } = await fn(supabase); // the database function checks the admin role and writes the audit log
  revalidatePath("/admin");
  redirect(error ? "/admin?error=1" : "/admin?done=1");
}

export const approveApplication = async (fd: FormData) => run((db) => db.rpc("approve_artist_application", { p_application: uuid(s(fd, "id")) }));
export const rejectApplication = async (fd: FormData) => run((db) => db.rpc("reject_artist_application", { p_application: uuid(s(fd, "id")), p_reason: s(fd, "reason") }));
export const publishRelease = async (fd: FormData) => run((db) => db.rpc("moderate_release", { p_release: uuid(s(fd, "id")), p_status: "published" }));
export const removeRelease = async (fd: FormData) => run((db) => db.rpc("moderate_release", { p_release: uuid(s(fd, "id")), p_status: "removed", p_reason: s(fd, "reason") }));
export const sendBackRelease = async (fd: FormData) => run((db) => db.rpc("moderate_release", { p_release: uuid(s(fd, "id")), p_status: "draft", p_reason: s(fd, "reason") }));
export async function resolveReport(fd: FormData) {
  const status = ["under_review", "upheld", "dismissed"].includes(s(fd, "status")) ? s(fd, "status") : "under_review";
  return run((db) => db.rpc("resolve_copyright_report", { p_report: uuid(s(fd, "id")), p_status: status, p_note: s(fd, "note") }));
}
