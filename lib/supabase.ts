import { createClient } from '@supabase/supabase-js';

/*
 * ─── Google OAuth setup (one-time, in Supabase dashboard) ────────────────────
 *
 * 1. Supabase Dashboard → Authentication → Providers → Google → Enable.
 * 2. Paste your Google OAuth Client ID and Client Secret (from Google Cloud
 *    Console → APIs & Services → Credentials → OAuth 2.0 Client ID).
 * 3. In Google Cloud Console add this Authorized redirect URI:
 *      https://<your-project-ref>.supabase.co/auth/v1/callback
 * 4. In Supabase Dashboard → Authentication → URL Configuration add your
 *    app's origin (e.g. http://localhost:5173 for dev) to "Redirect URLs".
 *
 * No environment variables are needed on the client side for OAuth —
 * the Supabase anon key + project URL are sufficient.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'arlo-auth',
    storage: localStorage,
  },
});
