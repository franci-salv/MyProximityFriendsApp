export type AppCity = 'London' | 'Paris' | 'Eindhoven' | 'New York' | 'Berlin' | 'Lisbon';

export interface CityCoordinates {
  city: AppCity;
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  homeCity: AppCity;
  currentCity: AppCity;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  city: AppCity;
  avatar: string;
  status: 'online' | 'offline';
}

export interface ProfileRow {
  id: string;
  name: string;
  avatar: string;
  home_city: AppCity;
  created_at: string;
}

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface InviteRow {
  id: string;
  code: string;
  created_by: string;
  accepted_by: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface LocationUpdateRow {
  id: string;
  user_id: string;
  city: AppCity;
  lat: number;
  lng: number;
  created_at: string;
}

export interface ProximityEventRow {
  id: string;
  user_id: string;
  friend_id: string;
  city: AppCity;
  message: string;
  created_at: string;
}

export interface ToastState {
  id: string;
  message: string;
  visible: boolean;
}

export type HistoryEventType = 'city_change' | 'friend_nearby' | 'db_write' | 'system';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  city: AppCity;
  createdAt: string;
}
