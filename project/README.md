# FriendApp MVP

Private-beta location friend finder built with React, TypeScript, Tailwind, Supabase, and Leaflet.

## Run locally

1. Copy `.env.example` to `.env`.
2. Fill Supabase credentials.
3. Run:

```bash
npm run dev
```

### `npm run dev` troubleshooting

- If you see **“Port 5173 is in use”**, Vite automatically picks the next free port (for example `http://localhost:5174/`). Use that URL, stop the other process using 5173, or run `npx vite --port 5175`.
- After changing any `VITE_*` variable, **restart** the dev server so Vite reloads env.

## Manual setup before launch

1. Create a Supabase project.
2. In SQL editor, run migrations in order:
   - `supabase/migrations/20260520114500_friends_mvp.sql`
   - `supabase/migrations/20260520120600_enforce_mutual_friend_privacy.sql`
3. In Authentication -> Providers, enable Email provider (magic link).
4. In Authentication -> URL Configuration:
   - Site URL: your production URL (or `http://localhost:5173` for local testing)
   - Add redirect URLs for local + production callback URLs.
5. In Project Settings -> API, copy:
   - Project URL -> `VITE_SUPABASE_URL` (full URL with `https://`, no path)
   - Public client key -> `VITE_SUPABASE_ANON_KEY`: use the **anon / public JWT** or a **publishable** key (`sb_publishable_...`); both work with `createClient` in the browser. Never put the **service_role** / secret key in the frontend.
6. Set environment variables on the **hosting** platform and **redeploy** (Vite bakes `VITE_*` into the build at build time).

   **Production env checklist**

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `VITE_SUPABASE_URL` | Yes | `https://<ref>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Yes | Anon JWT or `sb_publishable_...` |
   | `VITE_APP_BASE_URL` | Optional | Defaults to current origin; set to your canonical site URL if needed. Must be listed under Supabase **Authentication → URL Configuration → Redirect URLs**. |

   If magic link or auth fails with a **fetch / invalid URL** error, the usual cause is a missing or malformed `VITE_SUPABASE_URL` at **build** time, or only one of the two Supabase vars set on the host.

### Deploy on Vercel

1. Import the repo and set **Root Directory** to `project` (where `package.json` and `vercel.json` live).
2. In **Settings → Environment Variables**, add for **Production** (and Preview if you test PRs):

   | Name | Example value |
   |------|-----------------|
   | `VITE_SUPABASE_URL` | `https://tnucsjuocybdekxujwsd.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon** JWT or `sb_publishable_...` key (Project Settings → API) |
   | `VITE_APP_BASE_URL` | `https://your-app.vercel.app` (optional; must match Supabase redirect allow-list) |

3. **Redeploy** after saving env vars (Deployments → … → Redeploy). Changing env alone does not update an old bundle.
4. In Supabase **Authentication → URL Configuration**, add your Vercel URL(s) under **Redirect URLs** and set **Site URL** to the same origin.

7. (Optional) Seed a few users by signing in and creating/accepting invite codes from the app.

## MVP scope implemented

- Supabase auth session flow with email magic link.
- Profile bootstrap/create after auth.
- Invite creation and acceptance UI + DB writes.
- Friend list/map/proximity based on mutual friendships only (both directed edges exist).
- Simulator-driven city updates with changed-city write policy.
- Proximity event writes and DB-backed history timeline.
- Map/list views backed by real friend rows with demo fallback.
