import { useState, useEffect } from 'react';
import { SignInScreen } from './components/SignInScreen';
import { MainApp } from './components/MainApp';
import { getSessionProfile } from './lib/auth';

type AppState =
  | 'loading'        // checking Supabase session on first render
  | 'auth'           // no session — show sign-in / sign-up screens
  | 'pick-username'  // has session (e.g. post-Google-OAuth) but no profile yet
  | 'app';           // fully authenticated with a profile

export default function App() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    getSessionProfile().then(profile => {
      if (!profile) {
        setState('auth');
        return;
      }
      if (!profile.username) {
        setState('pick-username');
        return;
      }
      setState('app');
    });
  }, []);

  const handleSignIn = () => setState('app');
  const handleSignOut = () => setState('auth');

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
          initialStep={state === 'pick-username' ? 'signup-username' : 'landing'}
          hasExistingSession={state === 'pick-username'}
        />
      )}
    </div>
  );
}
