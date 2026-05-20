# FriendApp MVP

Private-beta location friend finder built with React, TypeScript, Tailwind, Supabase, and Leaflet.

## Run locally

1. Copy `.env.example` to `.env`.
2. Fill Supabase credentials.
3. Run:

```bash
npm run dev
```

## Manual setup before launch

1. Create a Supabase project.
2. In SQL editor, run `supabase/migrations/20260520114500_friends_mvp.sql`.
3. In Authentication -> Providers, enable Email provider (magic link).
4. In Authentication -> URL Configuration:
   - Site URL: your production URL (or `http://localhost:5173` for local testing)
   - Add redirect URLs for local + production callback URLs.
5. In Project Settings -> API, copy:
   - Project URL -> `VITE_SUPABASE_URL`
   - `anon` key -> `VITE_SUPABASE_ANON_KEY`
6. Set environment variables in hosting platform.
7. (Optional) Seed a few users by signing in and creating/accepting invite codes from the app.

## MVP scope implemented

- Supabase auth session flow with email magic link.
- Profile bootstrap/create after auth.
- Invite creation and acceptance UI + DB writes.
- Friend list from accepted friendships and profile/location tables.
- Simulator-driven city updates with changed-city write policy.
- Proximity event writes and DB-backed history timeline.
- Map/list views backed by real friend rows with demo fallback.
