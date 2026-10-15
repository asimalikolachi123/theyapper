-- This migration was applied to the existing Supabase project wfeuudmauvkjhapjezff.
-- Additive changes only; existing user content is preserved.
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists pronouns text;
alter table public.profiles add column if not exists accent_color text default '#6558e8';
alter table public.posts add column if not exists image_urls text[] not null default '{}';
alter table public.posts add column if not exists context_url text;
alter table public.posts add column if not exists community_id uuid;
alter table public.posts add column if not exists context_tag text not null default 'Open conversation';
alter table public.posts drop constraint if exists posts_context_tag_check;
alter table public.posts add constraint posts_context_tag_check check(context_tag in ('Open conversation','Need advice','Teach me','Respectful debate','Just sharing','Build together'));

create table if not exists public.post_reposts (
 user_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,post_id)
);
alter table public.post_reposts enable row level security;
drop policy if exists "Reposts are public" on public.post_reposts;
create policy "Reposts are public" on public.post_reposts for select using(true);
drop policy if exists "Users manage own reposts" on public.post_reposts;
create policy "Users manage own reposts" on public.post_reposts for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

create table if not exists public.post_hashtags (
 post_id uuid not null references public.posts(id) on delete cascade,
 hashtag text not null check(hashtag ~ '^[a-z0-9_]{1,50}$'),
 created_at timestamptz not null default now(), primary key(post_id,hashtag)
);
create index if not exists post_hashtags_tag_idx on public.post_hashtags(hashtag,created_at desc);
alter table public.post_hashtags enable row level security;
drop policy if exists "Hashtags are public" on public.post_hashtags;
create policy "Hashtags are public" on public.post_hashtags for select using(true);
drop policy if exists "Authors add hashtags to own posts" on public.post_hashtags;
create policy "Authors add hashtags to own posts" on public.post_hashtags for insert to authenticated with check(exists(select 1 from public.posts p where p.id=post_id and p.author_id=auth.uid()));

create table if not exists public.communities (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(char_length(slug) between 2 and 60),
 name text not null check(char_length(name) between 2 and 50), topic text not null check(char_length(topic) between 2 and 40),
 description text not null default '', created_by uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.communities enable row level security;
drop policy if exists "Communities are public" on public.communities;
create policy "Communities are public" on public.communities for select using(true);
drop policy if exists "Signed in users create communities as themselves" on public.communities;
create policy "Signed in users create communities as themselves" on public.communities for insert to authenticated with check(auth.uid()=created_by);
drop policy if exists "Creators update their communities" on public.communities;
create policy "Creators update their communities" on public.communities for update to authenticated using(auth.uid()=created_by) with check(auth.uid()=created_by);

create table if not exists public.community_members (
 community_id uuid not null references public.communities(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(community_id,user_id)
);
alter table public.community_members enable row level security;
drop policy if exists "Community membership counts are public" on public.community_members;
create policy "Community membership counts are public" on public.community_members for select using(true);
drop policy if exists "Users manage own community memberships" on public.community_members;
create policy "Users manage own community memberships" on public.community_members for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
do $$ begin alter table public.posts add constraint posts_community_id_fkey foreign key(community_id) references public.communities(id) on delete set null; exception when duplicate_object then null; end $$;
create index if not exists posts_community_created_idx on public.posts(community_id,created_at desc);

create table if not exists public.creator_collections (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 60), description text not null default '',
 is_public boolean not null default false, created_at timestamptz not null default now(), unique(owner_id,name)
);
alter table public.creator_collections enable row level security;
drop policy if exists "Public creator collections and own private collections" on public.creator_collections;
create policy "Public creator collections and own private collections" on public.creator_collections for select to authenticated using(is_public or auth.uid()=owner_id);
drop policy if exists "Users manage own creator collections" on public.creator_collections;
create policy "Users manage own creator collections" on public.creator_collections for all to authenticated using(auth.uid()=owner_id) with check(auth.uid()=owner_id);

create table if not exists public.collection_posts (
 collection_id uuid not null references public.creator_collections(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 added_at timestamptz not null default now(), primary key(collection_id,post_id)
);
alter table public.collection_posts enable row level security;
drop policy if exists "Users manage their own collection items" on public.collection_posts;
create policy "Users manage their own collection items" on public.collection_posts for all to authenticated using(exists(select 1 from public.creator_collections c where c.id=collection_id and c.owner_id=auth.uid())) with check(exists(select 1 from public.creator_collections c where c.id=collection_id and c.owner_id=auth.uid()));
create index if not exists collection_posts_post_idx on public.collection_posts(post_id);

create table if not exists public.notification_preferences (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 likes boolean not null default true, replies boolean not null default true, follows boolean not null default true,
 mentions boolean not null default true, messages boolean not null default true, community_activity boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists "Users manage their notification preferences" on public.notification_preferences;
create policy "Users manage their notification preferences" on public.notification_preferences for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check(kind in ('like','comment','follow','message','mention','reply','repost','community'));
create index if not exists messages_receiver_unread_idx on public.messages(receiver_id,created_at desc) where read_at is null;
create index if not exists follows_following_idx on public.follows(following_id,created_at desc);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-media','profile-media',true,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "Public can view profile media" on storage.objects;
create policy "Public can view profile media" on storage.objects for select using(bucket_id='profile-media');
drop policy if exists "Users upload own profile media" on storage.objects;
create policy "Users upload own profile media" on storage.objects for insert to authenticated with check(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users update own profile media" on storage.objects;
create policy "Users update own profile media" on storage.objects for update to authenticated using(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users delete own profile media" on storage.objects;
create policy "Users delete own profile media" on storage.objects for delete to authenticated using(bucket_id='profile-media' and (storage.foldername(name))[1]=auth.uid()::text);

do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; when undefined_object then null; end $$;