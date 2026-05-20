create or replace function public.are_mutual_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.friendships forward_edge
    join public.friendships reverse_edge
      on reverse_edge.requester_id = forward_edge.addressee_id
     and reverse_edge.addressee_id = forward_edge.requester_id
    where forward_edge.requester_id = user_a
      and forward_edge.addressee_id = user_b
      and forward_edge.status = 'accepted'
      and reverse_edge.status = 'accepted'
  );
$$;

drop policy if exists "profiles_select_own_or_friend" on public.profiles;
create policy "profiles_select_own_or_friend"
on public.profiles for select
using (
  auth.uid() = id
  or public.are_mutual_friends(auth.uid(), id)
);

drop policy if exists "location_updates_select_related" on public.location_updates;
create policy "location_updates_select_related" on public.location_updates
for select using (
  auth.uid() = user_id
  or public.are_mutual_friends(auth.uid(), user_id)
);

drop policy if exists "proximity_events_select_related" on public.proximity_events;
create policy "proximity_events_select_related" on public.proximity_events
for select using (
  auth.uid() = user_id
  or (auth.uid() = friend_id and public.are_mutual_friends(user_id, friend_id))
);

drop policy if exists "proximity_events_insert_own" on public.proximity_events;
create policy "proximity_events_insert_own" on public.proximity_events
for insert with check (
  auth.uid() = user_id
  and public.are_mutual_friends(user_id, friend_id)
);
