-- Fix interaction notification trigger: each table has different NEW record columns.
-- Keep one trigger function but branch before accessing table-specific fields.
create or replace function public.notify_post_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  target_user uuid;
  actor_user uuid;
  target_post uuid;
  notification_kind text;
begin
  if tg_table_name = 'likes' then
    target_post := new.post_id;
    actor_user := new.user_id;
    notification_kind := 'like';
    select author_id into target_user from public.posts where id = new.post_id;
  elsif tg_table_name = 'comments' then
    target_post := new.post_id;
    actor_user := new.author_id;
    notification_kind := 'comment';
    select author_id into target_user from public.posts where id = new.post_id;
  elsif tg_table_name = 'follows' then
    actor_user := new.follower_id;
    target_user := new.following_id;
    notification_kind := 'follow';
  elsif tg_table_name = 'messages' then
    actor_user := new.sender_id;
    target_user := new.receiver_id;
    notification_kind := 'message';
  else
    return new;
  end if;

  if target_user is not null and actor_user is not null and target_user <> actor_user then
    insert into public.notifications(recipient_id, actor_id, post_id, kind)
    values (target_user, actor_user, target_post, notification_kind);
  end if;

  return new;
end;
$function$;
