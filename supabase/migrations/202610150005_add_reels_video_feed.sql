create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now(),
  views_count bigint not null default 0 check (views_count >= 0)
);
create index if not exists reels_created_at_idx on public.reels(created_at desc);
create index if not exists reels_user_id_created_at_idx on public.reels(user_id, created_at desc);
alter table public.reels enable row level security;
drop policy if exists "Reels are viewable by everyone" on public.reels;
create policy "Reels are viewable by everyone" on public.reels for select to anon, authenticated using (true);
drop policy if exists "Users can publish own reels" on public.reels;
create policy "Users can publish own reels" on public.reels for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can edit own reels" on public.reels;
create policy "Users can edit own reels" on public.reels for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own reels" on public.reels;
create policy "Users can delete own reels" on public.reels for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.reels to anon, authenticated;
grant insert, update, delete on public.reels to authenticated;

create table if not exists public.reel_likes (
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
create index if not exists reel_likes_user_id_idx on public.reel_likes(user_id);
alter table public.reel_likes enable row level security;
drop policy if exists "Reel likes are viewable by everyone" on public.reel_likes;
create policy "Reel likes are viewable by everyone" on public.reel_likes for select to anon, authenticated using (true);
drop policy if exists "Users can like reels as themselves" on public.reel_likes;
create policy "Users can like reels as themselves" on public.reel_likes for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can remove own reel likes" on public.reel_likes;
create policy "Users can remove own reel likes" on public.reel_likes for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.reel_likes to anon, authenticated;
grant insert, delete on public.reel_likes to authenticated;

create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists reel_comments_reel_created_idx on public.reel_comments(reel_id, created_at desc);
alter table public.reel_comments enable row level security;
drop policy if exists "Reel comments are viewable by everyone" on public.reel_comments;
create policy "Reel comments are viewable by everyone" on public.reel_comments for select to anon, authenticated using (true);
drop policy if exists "Users can comment as themselves on reels" on public.reel_comments;
create policy "Users can comment as themselves on reels" on public.reel_comments for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own reel comments" on public.reel_comments;
create policy "Users can delete own reel comments" on public.reel_comments for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.reel_comments to anon, authenticated;
grant insert, delete on public.reel_comments to authenticated;

create or replace function public.increment_reel_views(reel_uuid uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then return; end if;
  update public.reels set views_count = views_count + 1 where id = reel_uuid;
end;
$$;
revoke all on function public.increment_reel_views(uuid) from public;
grant execute on function public.increment_reel_views(uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('reel-videos', 'reel-videos', true, 52428800, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = array['video/mp4','video/webm','video/quicktime'];
drop policy if exists "Public can view reel videos" on storage.objects;
create policy "Public can view reel videos" on storage.objects for select to anon, authenticated using (bucket_id = 'reel-videos');
drop policy if exists "Users upload own reel videos" on storage.objects;
create policy "Users upload own reel videos" on storage.objects for insert to authenticated with check (bucket_id = 'reel-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users update own reel videos" on storage.objects;
create policy "Users update own reel videos" on storage.objects for update to authenticated using (bucket_id = 'reel-videos' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'reel-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users delete own reel videos" on storage.objects;
create policy "Users delete own reel videos" on storage.objects for delete to authenticated using (bucket_id = 'reel-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
