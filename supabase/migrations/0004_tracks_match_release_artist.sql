-- STATUS: written 2026-10-20, NOT YET APPLIED (the Supabase tool asked for confirmation because of the DROP POLICY statements).
-- Apply in the Supabase SQL editor before the Artist Studio is used by real artists.

-- A track may only be attached to a release owned by the same artist (stops attaching tracks to someone else's release).
drop policy "tracks: artist manages own" on public.tracks;
create policy "tracks: artist manages own" on public.tracks for all to authenticated
  using (public.owns_artist(artist_id))
  with check (
    public.owns_artist(artist_id)
    and exists (select 1 from public.releases r where r.id = release_id and r.artist_id = tracks.artist_id)
  );

-- Artists may edit only descriptive fields and request review; removal reason and publish date are set by admin functions.
revoke update on public.releases from authenticated;
grant update (title, type, cover_path, status) on public.releases to authenticated;

-- Admin decisions on reports go through an audited function instead of direct updates.
create or replace function public.resolve_copyright_report(p_report uuid, p_status public.report_status, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if p_status = 'received' then raise exception 'Choose under_review, upheld or dismissed'; end if;
  update public.copyright_reports set status = p_status, resolution_note = p_note,
    resolved_at = case when p_status in ('upheld','dismissed') then now() else null end where id = p_report;
  if not found then raise exception 'Report not found'; end if;
  perform public.write_audit('resolve_report', 'copyright_report', p_report::text, jsonb_build_object('status', p_status, 'note', p_note));
end $$;
revoke execute on function public.resolve_copyright_report(uuid, public.report_status, text) from public, anon;
grant execute on function public.resolve_copyright_report(uuid, public.report_status, text) to authenticated;
revoke update on public.copyright_reports from authenticated;
drop policy "reports: admin updates" on public.copyright_reports;
