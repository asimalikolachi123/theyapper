insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('post-media','post-media',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "Public can view post media" on storage.objects;
create policy "Public can view post media" on storage.objects for select using(bucket_id='post-media');
drop policy if exists "Users upload own post media" on storage.objects;
create policy "Users upload own post media" on storage.objects for insert to authenticated with check(bucket_id='post-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users update own post media" on storage.objects;
create policy "Users update own post media" on storage.objects for update to authenticated using(bucket_id='post-media' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='post-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Users delete own post media" on storage.objects;
create policy "Users delete own post media" on storage.objects for delete to authenticated using(bucket_id='post-media' and (storage.foldername(name))[1]=auth.uid()::text);
