import { useState, useEffect } from 'react';
import { SignInScreen } from './components/SignInScreen';
import { MainApp } from './components/MainApp';
import { getSessionProfile } from './lib/auth';

type AppState =
  | 'loading'         // checking localStorage / Supabase on first render
  | 'pick-username'   // has a session (e.g. post-Google-OAuth) but no profile yet
  | 'sign-in'         // no session — returning user needs to authenticate
  | 'new-user'        // no session, no stored username — show username picker
  | 'app';            // fully authenticated with a profile

export default function App() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    getSessionProfile().then(profile => {
      if (!profile) {
        // No active session — decide which sign-in step to open
        const stored = localStorage.getItem('arlo-username');
        setState(stored ? 'sign-in' : 'new-user');
        return;
      }
      if (!profile.username) {
        // Session exists (e.g. just came back from Google OAuth) but no profile yet
        setState('pick-username');
        return;
      }
      setState('app');
    });
  }, []);

  const handleSignIn = () => setState('app');
  const handleSignOut = () => {
    localStorage.removeItem('arlo-username');
    setState('new-user');
  };

  if (state === 'loading') {
    return <div className="min-h-screen bg-[--arlo-bg]" />;
  }

  return (
    <div className="min-h-screen bg-[--arlo-bg] selection:bg-[#FFC8FF]/50">
      {state === 'app' ? (
        <MainApp onSignOut={handleSignOut} />
      ) : (
        <SignInScreen
          onSignIn={handleSignIn}
          initialStep={state === 'sign-in' ? 'sign-in' : 'pick-username'}
          hasExistingSession={state === 'pick-username'}
        />
      )}
    </div>
  );
}
