
-- ============ ENUMS ============
create type public.app_role as enum ('intern', 'hr', 'admin');
create type public.project_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.internship_type as enum ('summer', 'winter', 'full_time');
create type public.portfolio_goal as enum ('frontend', 'backend', 'fullstack', 'mobile', 'data', 'devops');
create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high');
create type public.attendance_status as enum ('present', 'absent', 'late', 'leave', 'holiday');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  bio text default '',
  avatar_url text,
  location text,
  skills text[] default '{}',
  github_url text,
  twitter_url text,
  linkedin_url text,
  internship_type public.internship_type,
  internship_start date,
  internship_end date,
  portfolio_goal public.portfolio_goal,
  is_banned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- ============ PROJECTS ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  media_url text,
  github_url text,
  demo_url text,
  tags text[] default '{}',
  difficulty public.difficulty_level default 'intermediate',
  is_team boolean default false,
  team_members text[] default '{}',
  status public.project_status default 'draft',
  rejection_reason text,
  views_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.projects enable row level security;

-- ============ LIKES / SAVES ============
create table public.project_likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (project_id, user_id)
);
alter table public.project_likes enable row level security;

create table public.project_saves (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (project_id, user_id)
);
alter table public.project_saves enable row level security;

-- ============ COMMENTS ============
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);
alter table public.comments enable row level security;

-- ============ FOLLOWS ============
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;

-- ============ AI ============
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'New chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.ai_conversations enable row level security;

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);
alter table public.ai_messages enable row level security;

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  feature text not null,
  tokens int default 0,
  created_at timestamptz default now()
);
alter table public.ai_usage enable row level security;

-- ============ HR: EVALUATIONS ============
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid references auth.users(id) on delete cascade not null,
  hr_id uuid references auth.users(id) on delete cascade not null,
  code_quality int check (code_quality between 1 and 5),
  communication int check (communication between 1 and 5),
  problem_solving int check (problem_solving between 1 and 5),
  initiative int check (initiative between 1 and 5),
  teamwork int check (teamwork between 1 and 5),
  comments text,
  strengths text[] default '{}',
  improvements text[] default '{}',
  recommendation text,
  created_at timestamptz default now()
);
alter table public.evaluations enable row level security;

-- ============ HR: ATTENDANCE ============
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  status public.attendance_status not null,
  notes text,
  created_at timestamptz default now(),
  unique (intern_id, date)
);
alter table public.attendance enable row level security;

-- ============ HR: MESSAGES / CONVERSATIONS ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references auth.users(id) on delete cascade not null,
  user_b uuid references auth.users(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_a, user_b)
);
alter table public.conversations enable row level security;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;

-- ============ HR: TICKETS ============
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid references auth.users(id) on delete cascade not null,
  hr_id uuid references auth.users(id) on delete set null,
  subject text not null,
  description text not null,
  priority public.ticket_priority default 'medium',
  status public.ticket_status default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.tickets enable row level security;

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  is_internal boolean default false,
  created_at timestamptz default now()
);
alter table public.ticket_messages enable row level security;

-- ============ AUDIT LOGS ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;

-- ============ ADMIN SETTINGS ============
create table public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table public.admin_settings enable row level security;

-- ============ TRIGGERS ============
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.update_updated_at();
create trigger ai_conversations_updated_at before update on public.ai_conversations for each row execute function public.update_updated_at();
create trigger tickets_updated_at before update on public.tickets for each row execute function public.update_updated_at();

-- Auto create profile + intern role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text;
  v_full_name text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', v_username);
  -- ensure username is unique by appending suffix
  while exists(select 1 from public.profiles where username = v_username) loop
    v_username := v_username || floor(random()*1000)::text;
  end loop;
  insert into public.profiles (id, username, full_name, bio, avatar_url)
  values (new.id, v_username, v_full_name,
    coalesce(new.raw_user_meta_data->>'bio',''),
    new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'intern');
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ RLS POLICIES ============
-- profiles
create policy "profiles viewable by all authenticated" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "admins update any profile" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- user_roles
create policy "users view own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- projects
create policy "view approved projects" on public.projects for select to authenticated using (status = 'approved' or user_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'hr'));
create policy "users insert own projects" on public.projects for insert to authenticated with check (user_id = auth.uid());
create policy "users update own projects" on public.projects for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "users delete own projects" on public.projects for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- likes
create policy "view all likes" on public.project_likes for select to authenticated using (true);
create policy "users like" on public.project_likes for insert to authenticated with check (user_id = auth.uid());
create policy "users unlike" on public.project_likes for delete to authenticated using (user_id = auth.uid());

-- saves
create policy "view own saves" on public.project_saves for select to authenticated using (user_id = auth.uid());
create policy "users save" on public.project_saves for insert to authenticated with check (user_id = auth.uid());
create policy "users unsave" on public.project_saves for delete to authenticated using (user_id = auth.uid());

-- comments
create policy "view all comments" on public.comments for select to authenticated using (true);
create policy "users comment" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "users delete own comments" on public.comments for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- follows
create policy "view follows" on public.follows for select to authenticated using (true);
create policy "users follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "users unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- notifications
create policy "users view own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "system insert notifications" on public.notifications for insert to authenticated with check (true);

-- ai
create policy "users own conversations" on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users own ai messages" on public.ai_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users view own ai usage" on public.ai_usage for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "users insert own ai usage" on public.ai_usage for insert to authenticated with check (user_id = auth.uid());

-- evaluations
create policy "intern view own evals" on public.evaluations for select to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "hr create evals" on public.evaluations for insert to authenticated with check (public.has_role(auth.uid(),'hr') and hr_id = auth.uid());
create policy "hr update evals" on public.evaluations for update to authenticated using (public.has_role(auth.uid(),'hr') and hr_id = auth.uid());

-- attendance
create policy "view attendance" on public.attendance for select to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "hr manage attendance" on public.attendance for all to authenticated using (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

-- conversations / messages
create policy "view own convos" on public.conversations for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());
create policy "create convo" on public.conversations for insert to authenticated with check (user_a = auth.uid() or user_b = auth.uid());
create policy "update convo last msg" on public.conversations for update to authenticated using (user_a = auth.uid() or user_b = auth.uid());
create policy "view own messages" on public.messages for select to authenticated using (exists(select 1 from public.conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())));
create policy "send message" on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists(select 1 from public.conversations c where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())));

-- tickets
create policy "view own tickets" on public.tickets for select to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "create ticket" on public.tickets for insert to authenticated with check (intern_id = auth.uid() or public.has_role(auth.uid(),'hr'));
create policy "update ticket" on public.tickets for update to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "view ticket messages" on public.ticket_messages for select to authenticated using (exists(select 1 from public.tickets t where t.id = ticket_id and (t.intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'))));
create policy "send ticket message" on public.ticket_messages for insert to authenticated with check (sender_id = auth.uid());

-- audit logs
create policy "admins view logs" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "system insert logs" on public.audit_logs for insert to authenticated with check (true);

-- admin settings
create policy "admins manage settings" on public.admin_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "all read settings" on public.admin_settings for select to authenticated using (true);

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('project-media','project-media', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('attachments','attachments', false) on conflict do nothing;

create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars user write" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars user update" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars user delete" on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media public read" on storage.objects for select using (bucket_id = 'project-media');
create policy "media user write" on storage.objects for insert to authenticated with check (bucket_id='project-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media user update" on storage.objects for update to authenticated using (bucket_id='project-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media user delete" on storage.objects for delete to authenticated using (bucket_id='project-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attach owner read" on storage.objects for select to authenticated using (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attach owner write" on storage.objects for insert to authenticated with check (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.project_likes;
