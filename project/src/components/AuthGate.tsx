import { useMemo, useState } from 'react';
import { SIMULATOR_CITIES } from '../data/cities';
import { hasSupabaseEnv, supabase, upsertProfile } from '../lib/supabase';
import type { AppCity, UserProfile } from '../types/models';

interface AuthGateProps {
  onAuthenticated: (profile: UserProfile) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState<AppCity>('Eindhoven');
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const avatar = useMemo(() => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
    return initials || 'FR';
  }, [name]);

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setIsBusy(true);
    setStatus(null);
    const redirectTo = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setIsBusy(false);
    setStatus(error ? error.message : 'Magic link sent. Open your email to continue.');
  };

  const handleDemoMode = () => {
    onAuthenticated({
      id: crypto.randomUUID(),
      name: name.trim() || 'Demo User',
      avatar,
      homeCity,
      currentCity: homeCity,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSaveProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;
    setIsBusy(true);
    setStatus(null);
    try {
      const row = await upsertProfile(session.user.id, name.trim() || email.split('@')[0] || 'Friend', homeCity);
      onAuthenticated({
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        homeCity: row.home_city,
        currentCity: row.home_city,
        createdAt: row.created_at,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile.';
      setStatus(message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-orange-100 bg-white/85 p-6 shadow-lg backdrop-blur">
      <h1 className="text-2xl font-semibold text-zinc-900">FriendApp private beta</h1>
      <p className="mt-2 text-sm text-zinc-600">Sign in with an email magic link and bootstrap your profile.</p>

      <label className="mt-6 block text-sm font-medium text-zinc-700">Display name</label>
      <input
        className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-amber-400"
        placeholder="Alex Rivers"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <label className="mt-4 block text-sm font-medium text-zinc-700">Home city</label>
      <select
        className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-amber-400"
        value={homeCity}
        onChange={(event) => setHomeCity(event.target.value as AppCity)}
      >
        {SIMULATOR_CITIES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <div className="mt-5 rounded-2xl bg-orange-50 p-3 text-sm text-zinc-700">
        Avatar preview: <span className="font-semibold">{avatar}</span>
      </div>

      {hasSupabaseEnv ? (
        <>
          <label className="mt-4 block text-sm font-medium text-zinc-700">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-amber-400"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleMagicLink}
              disabled={isBusy || !email.trim()}
            >
              Send magic link
            </button>
            <button
              className="rounded-xl bg-orange-100 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-orange-200 disabled:opacity-40"
              onClick={handleSaveProfile}
              disabled={isBusy}
            >
              I confirmed email
            </button>
          </div>
        </>
      ) : (
        <button
          className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-800"
          onClick={handleDemoMode}
        >
          Continue in demo mode
        </button>
      )}

      {status ? <p className="mt-4 text-xs text-zinc-600">{status}</p> : null}
    </div>
  );
}
