-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  name text,
  role text,
  age integer,
  google_calendar_connected boolean default false,
  notifications_enabled boolean default false,
  fcm_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies: Users can only read/write their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Create captures table
create table captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  
  -- Original data
  type text not null check (type in ('link', 'image', 'video', 'text', 'pdf', 'audio')),
  content text not null,
  user_input text,
  
  -- Extracted/analyzed data
  title text,
  description text,
  metadata jsonb default '{}'::jsonb,
  analysis jsonb default '{}'::jsonb,
  
  -- Processing
  processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table captures enable row level security;

-- Policies: Users can only access their own captures
create policy "Users can view own captures"
  on captures for select
  using (auth.uid() = user_id);

create policy "Users can insert own captures"
  on captures for insert
  with check (auth.uid() = user_id);

create policy "Users can update own captures"
  on captures for update
  using (auth.uid() = user_id);

create policy "Users can delete own captures"
  on captures for delete
  using (auth.uid() = user_id);

-- Create indexes
create index captures_user_id_idx on captures(user_id);
create index captures_created_at_idx on captures(created_at desc);
create index captures_type_idx on captures(type);
create index captures_status_idx on captures(processing_status);

-- Create reminders table (optional)
create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  capture_id uuid references captures(id) on delete set null,
  
  message text not null,
  scheduled_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'sent', 'completed', 'cancelled')),
  
  recurring boolean default false,
  recurring_rule jsonb,
  
  created_at timestamptz default now(),
  sent_at timestamptz,
  completed_at timestamptz
);

-- Enable RLS
alter table reminders enable row level security;

create policy "Users can manage own reminders"
  on reminders for all
  using (auth.uid() = user_id);

-- Create collections table (optional)
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  
  name text not null,
  description text,
  type text default 'manual' check (type in ('manual', 'smart')),
  rules jsonb,
  
  created_at timestamptz default now()
);

-- Enable RLS
alter table collections enable row level security;

create policy "Users can manage own collections"
  on collections for all
  using (auth.uid() = user_id);

-- Create chat_messages table (optional)
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz default now()
);

-- Enable RLS
alter table chat_messages enable row level security;

create policy "Users can manage own chat messages"
  on chat_messages for all
  using (auth.uid() = user_id);

-- Create function to handle new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- GOOGLE CALENDAR INTEGRATION
-- ============================================

-- Calendar OAuth tokens
create table calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  provider text not null default 'google',
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(user_id, provider)
);

-- Enable RLS
alter table calendar_tokens enable row level security;

create policy "Users can manage own calendar tokens"
  on calendar_tokens for all
  using (auth.uid() = user_id);

-- Calendar events (local storage with Google sync)
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  google_event_id text,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  is_all_day boolean default false,
  sync_status text default 'pending' check (sync_status in ('pending', 'synced', 'error')),
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table calendar_events enable row level security;

create policy "Users can manage own calendar events"
  on calendar_events for all
  using (auth.uid() = user_id);

-- Indexes
create index calendar_events_user_id_idx on calendar_events(user_id);
create index calendar_events_google_event_id_idx on calendar_events(google_event_id);
create index calendar_events_start_time_idx on calendar_events(start_time);
