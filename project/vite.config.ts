import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function warnIfSupabaseEnvIncomplete(mode: string, env: Record<string, string>) {
  if (mode !== 'production') return;
  const url = (env.VITE_SUPABASE_URL ?? '').trim();
  const key = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  if (!url && !key) {
    console.warn(
      '[vite] Production build: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are unset. Magic link auth will not work until you set them on the host and redeploy.',
    );
    return;
  }
  if (!url || !key) {
    console.warn(
      '[vite] Production build: only one of VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY is set. Set both on Vercel (or your host) and redeploy.',
    );
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  warnIfSupabaseEnvIncomplete(mode, env);

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
