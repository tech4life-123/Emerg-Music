-- A track's audio_path must live under that artist's own folder in the bucket,
-- so nobody can point a track at another artist's file.
alter table public.tracks
  add constraint tracks_audio_path_own_folder
  check (audio_path is null or audio_path like 'audio/' || artist_id::text || '/' || id::text || '/%');
