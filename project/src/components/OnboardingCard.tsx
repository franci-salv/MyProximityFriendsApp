import { useMemo, useState } from 'react';
import { SIMULATOR_CITIES } from '../data/cities';
import type { AppCity, UserProfile } from '../types/models';

interface OnboardingCardProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingCard({ onComplete }: OnboardingCardProps) {
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState<AppCity>('Eindhoven');

  const avatar = useMemo(() => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
    return initials || 'FR';
  }, [name]);

  const handleStart = () => {
    if (!name.trim()) return;

    onComplete({
      id: crypto.randomUUID(),
      name: name.trim(),
      avatar,
      homeCity,
      currentCity: homeCity,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-3xl border border-orange-100 bg-white/85 p-6 shadow-lg backdrop-blur">
      <h1 className="text-2xl font-semibold text-zinc-900">Welcome to FriendApp</h1>
      <p className="mt-2 text-sm text-zinc-600">Set up your mock profile and start location simulation.</p>

      <label className="mt-6 block text-sm font-medium text-zinc-700">Your name</label>
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

      <button
        className="mt-5 w-full rounded-xl bg-zinc-900 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={handleStart}
        disabled={!name.trim()}
      >
        Enter Dashboard
      </button>
    </div>
  );
}
