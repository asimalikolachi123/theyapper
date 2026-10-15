-- Run this SQL in Supabase Dashboard > SQL Editor.
-- Uses Supabase Auth for identity and Row Level Security for user-owned data.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  display_name text not null default 'Yapper',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 500),
  image_url text,
  created_at timestamptz not null default now(),
  constraint post_has_content_or_image check (char_length(trim(content)) > 0 or image_url is not null)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists comments_post_id_idx on public.comments(post_id, created_at);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone" on public.posts for select using (true);
drop policy if exists "Users can publish own posts" on public.posts;
create policy "Users can publish own posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Users can edit own posts" on public.posts;
create policy "Users can edit own posts" on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts" on public.posts for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "Follows are public" on public.follows;
create policy "Follows are public" on public.follows for select using (true);
drop policy if exists "Users manage own follows" on public.follows;
create policy "Users manage own follows" on public.follows for all to authenticated using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "Likes are public" on public.likes;
create policy "Likes are public" on public.likes for select using (true);
drop policy if exists "Users manage own likes" on public.likes;
create policy "Users manage own likes" on public.likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Comments are public" on public.comments;
create policy "Comments are public" on public.comments for select using (true);
drop policy if exists "Users manage own comments" on public.comments;
create policy "Users manage own comments" on public.comments for all to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "Users view own bookmarks" on public.bookmarks;
create policy "Users view own bookmarks" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users manage own bookmarks" on public.bookmarks;
create policy "Users manage own bookmarks" on public.bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a profile automatically after each new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  desired_username text;
begin
  desired_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'yapper'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(desired_username) < 3 then desired_username := 'yapper_' || substr(new.id::text, 1, 8); end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, desired_username || '_' || substr(new.id::text, 1, 4), coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Yapper'))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();



-- theYapper conversation intents, direct messages and activity notifications.
alter table public.posts add column if not exists context_tag text not null default 'Open conversation';
alter table public.posts drop constraint if exists posts_context_tag_check;
alter table public.posts add constraint posts_context_tag_check
  check (context_tag in ('Open conversation','Need advice','Teach me','Respectful debate','Just sharing','Build together'));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_no_self check (sender_id <> receiver_id)
);
create index if not exists messages_pair_created_idx on public.messages(sender_id,receiver_id,created_at);
alter table public.messages enable row level security;
drop policy if exists "Message participants can read" on public.messages;
create policy "Message participants can read" on public.messages for select to authenticated using (auth.uid()=sender_id or auth.uid()=receiver_id);
drop policy if exists "Users send messages as themselves" on public.messages;
create policy "Users send messages as themselves" on public.messages for insert to authenticated with check (auth.uid()=sender_id);
drop policy if exists "Recipients mark messages read" on public.messages;
create policy "Recipients mark messages read" on public.messages for update to authenticated using (auth.uid()=receiver_id) with check (auth.uid()=receiver_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  kind text not null check (kind in ('like','comment','follow','message')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id,created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "Users read their notifications" on public.notifications;
create policy "Users read their notifications" on public.notifications for select to authenticated using (auth.uid()=recipient_id);
drop policy if exists "Users update their notifications" on public.notifications;
create policy "Users update their notifications" on public.notifications for update to authenticated using (auth.uid()=recipient_id) with check (auth.uid()=recipient_id);
drop policy if exists "Authenticated users create notifications" on public.notifications;
create policy "Authenticated users create notifications" on public.notifications for insert to authenticated with check (auth.uid()=actor_id);

create or replace function public.notify_post_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_user uuid; target_post uuid; notification_kind text; actor uuid;
begin
 if tg_table_name='likes' then
  select author_id into target_user from public.posts where id=new.post_id;
  target_post:=new.post_id; notification_kind:='like'; actor:=new.user_id;
 elsif tg_table_name='comments' then
  select author_id into target_user from public.posts where id=new.post_id;
  target_post:=new.post_id; notification_kind:='comment'; actor:=new.author_id;
 elsif tg_table_name='follows' then
  target_user:=new.following_id; notification_kind:='follow'; actor:=new.follower_id;
 elsif tg_table_name='messages' then
  target_user:=new.receiver_id; notification_kind:='message'; actor:=new.sender_id;
 end if;
 if target_user is not null and target_user <> actor then
  insert into public.notifications(recipient_id,actor_id,post_id,kind)
  values(target_user,actor,target_post,notification_kind);
 end if;
 return new;
end; $$;

drop trigger if exists notify_like_activity on public.likes;
create trigger notify_like_activity after insert on public.likes for each row execute function public.notify_post_activity();
drop trigger if exists notify_comment_activity on public.comments;
create trigger notify_comment_activity after insert on public.comments for each row execute function public.notify_post_activity();
drop trigger if exists notify_follow_activity on public.follows;
create trigger notify_follow_activity after insert on public.follows for each row execute function public.notify_post_activity();
drop trigger if exists notify_message_activity on public.messages;
create trigger notify_message_activity after insert on public.messages for each row execute function public.notify_post_activity();

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
when undefined_object then null;
end $$;


-- Public post image uploads (maximum 5 MB per image).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('post-media','post-media',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "Public can view post media" on storage.objects;
create policy "Public can view post media" on storage.objects for select using (bucket_id='post-media');
drop policy if exists "Signed in users upload post media" on storage.objects;
create policy "Signed in users upload post media" on storage.objects for insert to authenticated with check (bucket_id='post-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users delete their post media" on storage.objects;
create policy "Users delete their post media" on storage.objects for delete to authenticated using (bucket_id='post-media' and (storage.foldername(name))[1]=auth.uid()::text);
