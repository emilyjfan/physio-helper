-- ============================================================================
-- Physio Helper — Initial Schema
-- ============================================================================

-- ─── Custom types ───────────────────────────────────────────────────────────

create type user_role as enum ('physio', 'patient');

-- ─── Users (profiles) ──────────────────────────────────────────────────────

create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null,
  full_name  text not null,
  email      text not null,
  physio_id  uuid references users(id),  -- set on patient rows
  created_at timestamptz not null default now()
);

-- ─── Exercises ──────────────────────────────────────────────────────────────

create table exercises (
  id           uuid primary key default gen_random_uuid(),
  created_by   uuid references users(id),  -- null = pre-built library exercise
  name         text not null,
  description  text not null default '',
  instructions text[] not null default '{}',
  image_url    text,
  video_url    text,
  created_at   timestamptz not null default now()
);

-- ─── Plans ──────────────────────────────────────────────────────────────────

create table plans (
  id         uuid primary key default gen_random_uuid(),
  physio_id  uuid not null references users(id),
  patient_id uuid not null references users(id),
  title      text not null,
  notes      text,
  is_active  boolean not null default true,
  start_date date not null default current_date,
  end_date   date,
  created_at timestamptz not null default now()
);

-- ─── Plan Exercises (join table) ────────────────────────────────────────────

create table plan_exercises (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references plans(id) on delete cascade,
  exercise_id  uuid not null references exercises(id),
  sets         integer not null default 1,
  reps         integer not null default 10,
  hold_seconds integer,
  rest_seconds integer,
  order_index  integer not null default 0,
  notes        text
);

-- ─── Sessions ───────────────────────────────────────────────────────────────

create table sessions (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references plans(id),
  patient_id   uuid not null references users(id),
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── Session Exercise Logs ──────────────────────────────────────────────────

create table session_exercise_logs (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references sessions(id) on delete cascade,
  plan_exercise_id  uuid not null references plan_exercises(id),
  sets_completed    integer not null default 0,
  difficulty_rating integer check (difficulty_rating between 1 and 5),
  notes             text
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

create index idx_users_physio on users(physio_id) where physio_id is not null;
create index idx_plans_patient on plans(patient_id);
create index idx_plans_physio on plans(physio_id);
create index idx_plan_exercises_plan on plan_exercises(plan_id);
create index idx_sessions_patient on sessions(patient_id);
create index idx_sessions_plan on sessions(plan_id);
create index idx_session_logs_session on session_exercise_logs(session_id);

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table users enable row level security;
alter table exercises enable row level security;
alter table plans enable row level security;
alter table plan_exercises enable row level security;
alter table sessions enable row level security;
alter table session_exercise_logs enable row level security;

-- Users: can read own profile, physios can read their patients
create policy "Users can read own profile"
  on users for select using (auth.uid() = id);

create policy "Physios can read their patients"
  on users for select using (
    exists (
      select 1 from users me
      where me.id = auth.uid() and me.role = 'physio'
    )
    and physio_id = auth.uid()
  );

-- Exercises: anyone can read (library), physios can insert/update their own
create policy "Anyone can read exercises"
  on exercises for select using (true);

create policy "Physios can create exercises"
  on exercises for insert with check (
    exists (
      select 1 from users where id = auth.uid() and role = 'physio'
    )
  );

create policy "Physios can update own exercises"
  on exercises for update using (created_by = auth.uid());

-- Plans: physios manage, patients read their own
create policy "Physios can manage their plans"
  on plans for all using (physio_id = auth.uid());

create policy "Patients can read own plans"
  on plans for select using (patient_id = auth.uid());

-- Plan exercises: follow plan access
create policy "Users can read plan exercises for accessible plans"
  on plan_exercises for select using (
    exists (
      select 1 from plans
      where plans.id = plan_id
      and (plans.physio_id = auth.uid() or plans.patient_id = auth.uid())
    )
  );

create policy "Physios can manage plan exercises"
  on plan_exercises for all using (
    exists (
      select 1 from plans
      where plans.id = plan_id and plans.physio_id = auth.uid()
    )
  );

-- Sessions: patients create/read own, physios read their patients' sessions
create policy "Patients can manage own sessions"
  on sessions for all using (patient_id = auth.uid());

create policy "Physios can read their patients sessions"
  on sessions for select using (
    exists (
      select 1 from plans
      where plans.id = plan_id and plans.physio_id = auth.uid()
    )
  );

-- Session exercise logs: follow session access
create policy "Patients can manage own session logs"
  on session_exercise_logs for all using (
    exists (
      select 1 from sessions
      where sessions.id = session_id and sessions.patient_id = auth.uid()
    )
  );

create policy "Physios can read their patients session logs"
  on session_exercise_logs for select using (
    exists (
      select 1 from sessions
      join plans on plans.id = sessions.plan_id
      where sessions.id = session_id and plans.physio_id = auth.uid()
    )
  );
