-- Trigger functions must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_release_status() from public, anon, authenticated;
-- Intentionally left callable: is_admin() and owns_artist() (used inside RLS policies; return only a boolean about the caller)
-- and approve/reject/moderate functions (check is_admin() internally and write to audit_log).
