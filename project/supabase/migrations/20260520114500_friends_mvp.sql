create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar text not null,
  home_city text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  constraint requester_addressee_unique unique (requester_id, addressee_id),
  constraint different_users check (requester_id <> addressee_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.location_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

create table if not exists public.proximity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  city text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.invites enable row level security;
alter table public.location_updates enable row level security;
alter table public.proximity_events enable row level security;

create policy "profiles_select_own_or_friend"
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
        or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
      )
  )
);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

create policy "friendships_select_related" on public.friendships
for select using (auth.uid() in (requester_id, addressee_id));

create policy "friendships_insert_related" on public.friendships
for insert with check (auth.uid() in (requester_id, addressee_id));

create policy "invites_select_related" on public.invites
for select using (auth.uid() in (created_by, accepted_by));

create policy "invites_insert_created_by" on public.invites
for insert with check (auth.uid() = created_by);

create policy "invites_update_related" on public.invites
for update using (auth.uid() in (created_by, accepted_by));

create policy "location_updates_select_related" on public.location_updates
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = auth.uid() and f.addressee_id = location_updates.user_id)
        or (f.addressee_id = auth.uid() and f.requester_id = location_updates.user_id)
      )
  )
);

create policy "location_updates_insert_own" on public.location_updates
for insert with check (auth.uid() = user_id);

create policy "proximity_events_select_related" on public.proximity_events
for select using (
  auth.uid() = user_id
  or auth.uid() = friend_id
);

create policy "proximity_events_insert_own" on public.proximity_events
for insert with check (auth.uid() = user_id);
