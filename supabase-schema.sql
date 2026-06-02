-- Run once in Supabase SQL Editor (Database → SQL Editor → New query)

create table if not exists stakeholders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  institution text not null,
  email       text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists engagements (
  id               uuid primary key default gen_random_uuid(),
  institution      text not null,
  stakeholder_id   uuid references stakeholders(id) on delete set null,
  stakeholder_name text,
  date             date not null,
  type             text,
  objective        text,
  status           text,
  owner            text,
  notes            text,
  actions          jsonb default '[]',
  synced_email_id  text unique,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists et_meta (
  id              text primary key,
  last_sync_at    timestamptz,
  email_data_date text,
  updated_at      timestamptz default now()
);

insert into et_meta (id) values ('singleton') on conflict (id) do nothing;

-- Row Level Security (open for anon key — tighten if needed)
alter table stakeholders enable row level security;
alter table engagements  enable row level security;
alter table et_meta      enable row level security;

create policy "Allow all" on stakeholders for all using (true) with check (true);
create policy "Allow all" on engagements  for all using (true) with check (true);
create policy "Allow all" on et_meta      for all using (true) with check (true);
