-- Create the user's public profile automatically when Supabase Auth creates an account.
create or replace function public.handle_new_yapper_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base_name text; candidate text; display_label text; suffix text;
begin
 display_label := left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(coalesce(new.email, 'member'), '@', 1), 'New member'), 60);
 base_name := lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(coalesce(new.email, 'member'), '@', 1), 'member'));
 base_name := regexp_replace(base_name, '[^a-z0-9_]', '', 'g');
 if length(base_name) < 3 then base_name := 'user'; end if;
 base_name := left(base_name, 20); candidate := base_name; suffix := substr(replace(new.id::text, '-', ''), 1, 6);
 if exists(select 1 from public.profiles where username = candidate and id <> new.id) then candidate := left(base_name, 20) || '_' || suffix; end if;
 insert into public.profiles(id,username,display_name,bio,accent_color) values(new.id,candidate,display_label,'','#6558e8') on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created_yapper_profile on auth.users;
create trigger on_auth_user_created_yapper_profile after insert on auth.users for each row execute procedure public.handle_new_yapper_user();
grant execute on function public.handle_new_yapper_user() to supabase_auth_admin;
