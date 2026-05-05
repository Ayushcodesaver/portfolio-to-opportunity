
-- fix function search path
create or replace function public.update_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- restrict execute on security definer fns
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- tighten notifications insert
drop policy if exists "system insert notifications" on public.notifications;
create policy "users insert own notifications" on public.notifications
  for insert to authenticated with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));

-- tighten audit log insert
drop policy if exists "system insert logs" on public.audit_logs;
create policy "admins insert logs" on public.audit_logs
  for insert to authenticated with check (admin_id = auth.uid() and public.has_role(auth.uid(),'admin'));

-- restrict storage listing on public buckets (only owner can list)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read by name" on storage.objects
  for select using (bucket_id = 'avatars' and name is not null);

drop policy if exists "media public read" on storage.objects;
create policy "media public read by name" on storage.objects
  for select using (bucket_id = 'project-media' and name is not null);
