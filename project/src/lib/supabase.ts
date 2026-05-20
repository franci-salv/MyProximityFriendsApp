import { createClient } from '@supabase/supabase-js';
import { CITY_COORDINATES } from '../data/cities';
import type {
  AppCity,
  Contact,
  FriendshipRow,
  HistoryEvent,
  InviteRow,
  LocationUpdateRow,
  ProfileRow,
  ProximityEventRow,
} from '../types/models';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Running in local mock mode.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export async function simulateSupabaseCityWrite(userId: string, city: string): Promise<string> {
  if (!hasSupabaseEnv) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return `Mock write saved for ${userId} in ${city}`;
  }

  const { error } = await supabase.from('location_updates').insert({
    user_id: userId,
    city,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return `Supabase write failed: ${error.message}`;
  }

  return `Supabase write saved for ${userId} in ${city}`;
}

function toAvatar(name: string): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || 'FR';
}

export function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function upsertProfile(id: string, name: string, homeCity: AppCity) {
  const payload = {
    id,
    name,
    home_city: homeCity,
    avatar: toAvatar(name),
  };
  const { data, error } = await supabase.from('profiles').upsert(payload).select('*').single<ProfileRow>();
  if (error) throw error;
  return data;
}

export async function getProfile(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle<ProfileRow>();
  if (error) throw error;
  return data;
}

export async function getContactsForUser(userId: string) {
  const { data: outgoingEdges, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .eq('requester_id', userId)
    .returns<FriendshipRow[]>();
  if (error) throw error;

  const outgoingFriendIds = Array.from(new Set((outgoingEdges ?? []).map((row) => row.addressee_id).filter(Boolean)));
  if (outgoingFriendIds.length === 0) return [];

  const { data: reverseEdges, error: reverseError } = await supabase
    .from('friendships')
    .select('*')
    .eq('status', 'accepted')
    .eq('addressee_id', userId)
    .in('requester_id', outgoingFriendIds)
    .returns<FriendshipRow[]>();
  if (reverseError) throw reverseError;

  const mutualFriendIds = new Set((reverseEdges ?? []).map((row) => row.requester_id));
  const friendIds = outgoingFriendIds.filter((friendId) => mutualFriendIds.has(friendId));
  if (friendIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds)
    .returns<ProfileRow[]>();
  if (profilesError) throw profilesError;

  const { data: updates, error: updatesError } = await supabase
    .from('location_updates')
    .select('*')
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .returns<LocationUpdateRow[]>();
  if (updatesError) throw updatesError;

  const latestByUser = new Map<string, LocationUpdateRow>();
  (updates ?? []).forEach((item) => {
    if (!latestByUser.has(item.user_id)) {
      latestByUser.set(item.user_id, item);
    }
  });

  return (profiles ?? []).map<Contact>((profile) => {
    const latest = latestByUser.get(profile.id);
    return {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      city: latest?.city ?? profile.home_city,
      status: latest ? 'online' : 'offline',
    };
  });
}

export async function createInvite(userId: string) {
  const code = makeInviteCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
  const { data, error } = await supabase
    .from('invites')
    .insert({ code, created_by: userId, expires_at: expiresAt })
    .select('*')
    .single<InviteRow>();
  if (error) throw error;
  return data;
}

export async function acceptInvite(userId: string, code: string) {
  const cleanCode = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('code', cleanCode)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle<InviteRow>();
  if (error) throw error;
  if (!data) throw new Error('Invite code is invalid or expired.');
  if (data.created_by === userId) throw new Error('You cannot accept your own invite.');

  const { error: friendshipError } = await supabase.from('friendships').upsert(
    {
      requester_id: userId,
      addressee_id: data.created_by,
      status: 'accepted',
    },
    {
      onConflict: 'requester_id,addressee_id',
      ignoreDuplicates: true,
    },
  );
  if (friendshipError) throw friendshipError;

  const { error: inviteError } = await supabase
    .from('invites')
    .update({ used_at: new Date().toISOString(), accepted_by: userId })
    .eq('id', data.id);
  if (inviteError) throw inviteError;

  return data;
}

export async function insertLocationUpdate(userId: string, city: AppCity) {
  const coords = CITY_COORDINATES[city];
  const { error } = await supabase.from('location_updates').insert({
    user_id: userId,
    city,
    lat: coords.lat,
    lng: coords.lng,
  });
  if (error) throw error;
}

export async function insertProximityEvent(userId: string, friendId: string, city: AppCity, message: string) {
  const { error } = await supabase.from('proximity_events').insert({
    user_id: userId,
    friend_id: friendId,
    city,
    message,
  });
  if (error) throw error;
}

export async function getHistory(userId: string): Promise<HistoryEvent[]> {
  const [eventsResult, updatesResult] = await Promise.all([
    supabase
      .from('proximity_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<ProximityEventRow[]>(),
    supabase
      .from('location_updates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<LocationUpdateRow[]>(),
  ]);

  if (eventsResult.error) throw eventsResult.error;
  if (updatesResult.error) throw updatesResult.error;

  const merged: HistoryEvent[] = [
    ...(eventsResult.data ?? []).map((event) => ({
      id: event.id,
      type: 'friend_nearby' as const,
      title: 'Friend nearby',
      description: event.message,
      city: event.city,
      createdAt: event.created_at,
    })),
    ...(updatesResult.data ?? []).map((update) => ({
      id: `location-${update.id}`,
      type: 'city_change' as const,
      title: `City updated to ${update.city}`,
      description: 'Location update written to Supabase.',
      city: update.city,
      createdAt: update.created_at,
    })),
  ];

  return merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 24);
}
