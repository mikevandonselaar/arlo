import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { SignInScreen } from './components/SignInScreen';
import { MainApp } from './components/MainApp';
import { getSessionProfile } from './lib/auth';
import { supabase } from './lib/supabase';

type AppState =
  | 'loading'        // checking Supabase session on first render
  | 'auth'           // no session — show sign-in / sign-up screens
  | 'pick-username'  // has session but no profile row yet (e.g. post-Google-OAuth)
  | 'app';           // fully authenticated with a profile

async function resolveState(): Promise<AppState> {
  const profile = await getSessionProfile();
  if (!profile) return 'auth';
  if (!profile.username) return 'pick-username';
  return 'app';
}

export default function App() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    // Initial session check
    resolveState().then(setState).catch(() => setState('auth'));

    // React to Supabase auth events (sign-in via email confirmation link,
    // Google OAuth redirect, token refresh, sign-out).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setState('auth');
        } else {
          // Don't overwrite 'loading' immediately — let the initial
          // resolveState() above finish first. For subsequent events
          // (sign-in, sign-out) we always re-resolve.
          resolveState().then(setState).catch(() => setState('auth'));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Manual callback — still useful as an instant transition so the UI
  // doesn't wait for the onAuthStateChange round-trip.
  const handleSignIn = () => setState('app');
  const handleSignOut = () => setState('auth');

  return (
    <div className="min-h-screen bg-[#EDF0F5] dark:bg-[#0F0F0F] selection:bg-[#FFC8FF]/50">
      {/* Toaster must live here so it's present during auth AND in-app */}
      <Toaster position="top-center" richColors closeButton />

      {state === 'loading' ? (
        <div className="min-h-screen" />
      ) : state === 'app' ? (
        <MainApp onSignOut={handleSignOut} />
      ) : (
        <SignInScreen
          onSignIn={handleSignIn}
          initialStep={state === 'pick-username' ? 'signup-username' : 'landing'}
          hasExistingSession={state === 'pick-username'}
        />
      )}
    </div>
  );
}
