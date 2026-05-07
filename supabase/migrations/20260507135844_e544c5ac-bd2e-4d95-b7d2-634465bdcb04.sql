
create type public.task_status as enum ('pending','submitted','approved','rejected');
create type public.notif_priority as enum ('low','medium','high','urgent');
create type public.task_priority as enum ('low','medium','high');

create table public.internship_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  total_days int not null check (total_days between 1 and 365),
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.internship_programs enable row level security;
create trigger internship_programs_updated_at before update on public.internship_programs for each row execute function public.update_updated_at();

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.internship_programs(id) on delete cascade not null,
  intern_id uuid references auth.users(id) on delete cascade not null,
  current_day int default 1,
  points int default 0,
  joined_at timestamptz default now(),
  unique (program_id, intern_id)
);
alter table public.program_enrollments enable row level security;

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.internship_programs(id) on delete cascade not null,
  title text not null,
  description text default '',
  day_number int not null check (day_number >= 1),
  deadline_at timestamptz,
  points int default 10,
  priority public.task_priority default 'medium',
  attachment_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.daily_tasks enable row level security;
create trigger daily_tasks_updated_at before update on public.daily_tasks for each row execute function public.update_updated_at();
create index idx_daily_tasks_program_day on public.daily_tasks(program_id, day_number);

create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.daily_tasks(id) on delete cascade not null,
  intern_id uuid references auth.users(id) on delete cascade not null,
  content text default '',
  submission_url text,
  file_url text,
  status public.task_status default 'submitted',
  feedback text,
  points_awarded int default 0,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (task_id, intern_id)
);
alter table public.task_submissions enable row level security;
create index idx_task_submissions_intern on public.task_submissions(intern_id);

create table public.global_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  priority public.notif_priority default 'medium',
  category text default 'announcement',
  link text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.global_notifications enable row level security;

create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.global_notifications(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  read_at timestamptz default now(),
  unique (notification_id, user_id)
);
alter table public.notification_reads enable row level security;

create table public.client_requirements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  content text not null default '',
  version int default 1,
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.client_requirements enable row level security;
create trigger client_requirements_updated_at before update on public.client_requirements for each row execute function public.update_updated_at();

create table public.client_requirement_versions (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid references public.client_requirements(id) on delete cascade not null,
  version int not null,
  title text not null,
  description text,
  content text not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_note text,
  created_at timestamptz default now()
);
alter table public.client_requirement_versions enable row level security;

create table public.points_history (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid references auth.users(id) on delete cascade not null,
  points int not null,
  reason text not null,
  source_type text,
  source_id uuid,
  created_at timestamptz default now()
);
alter table public.points_history enable row level security;
create index idx_points_history_intern on public.points_history(intern_id);

-- RLS
create policy "view active programs" on public.internship_programs for select to authenticated using (is_active or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "hr manage programs" on public.internship_programs for all to authenticated using (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

create policy "view own enrollments" on public.program_enrollments for select to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "hr manage enrollments" on public.program_enrollments for all to authenticated using (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "interns self enroll" on public.program_enrollments for insert to authenticated with check (intern_id = auth.uid());

create policy "view daily tasks" on public.daily_tasks for select to authenticated using (true);
create policy "hr manage daily tasks" on public.daily_tasks for all to authenticated using (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

create policy "intern view own submissions" on public.task_submissions for select to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "intern submit" on public.task_submissions for insert to authenticated with check (intern_id = auth.uid());
create policy "update submissions" on public.task_submissions for update to authenticated using ((intern_id = auth.uid()) or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check ((intern_id = auth.uid()) or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

create policy "view global notifs" on public.global_notifications for select to authenticated using (true);
create policy "hr manage global notifs" on public.global_notifications for all to authenticated using (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

create policy "view notif reads" on public.notification_reads for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "mark read" on public.notification_reads for insert to authenticated with check (user_id = auth.uid());

create policy "view active requirements" on public.client_requirements for select to authenticated using (is_active or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "hr manage requirements" on public.client_requirements for all to authenticated using (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

create policy "view requirement versions" on public.client_requirement_versions for select to authenticated using (true);
create policy "hr write requirement versions" on public.client_requirement_versions for insert to authenticated with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

create policy "view own points" on public.points_history for select to authenticated using (intern_id = auth.uid() or public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));
create policy "hr write points" on public.points_history for insert to authenticated with check (public.has_role(auth.uid(),'hr') or public.has_role(auth.uid(),'admin'));

-- Realtime (skip messages — already added)
alter publication supabase_realtime add table public.global_notifications;
alter publication supabase_realtime add table public.daily_tasks;
alter publication supabase_realtime add table public.task_submissions;
alter publication supabase_realtime add table public.client_requirements;
alter publication supabase_realtime add table public.notification_reads;
alter publication supabase_realtime add table public.points_history;

alter table public.global_notifications replica identity full;
alter table public.daily_tasks replica identity full;
alter table public.task_submissions replica identity full;
alter table public.client_requirements replica identity full;
alter table public.notification_reads replica identity full;
alter table public.points_history replica identity full;
