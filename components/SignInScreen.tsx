import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Check, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  USERNAME_REGEX,
  isUsernameAvailable,
  signUpWithEmail,
  addUsernameToExistingSession,
  signInWithEmail,
  signInWithGoogle,
} from '../lib/auth';

// Set to false once Supabase email confirmation is disabled in the dashboard
const DEV_BYPASS_AUTH = false;

export type SignInStep = 'landing' | 'signup-email' | 'signup-username' | 'signin';
type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

interface SignInScreenProps {
  onSignIn: () => void;
  initialStep?: SignInStep;
  /** True when user already has a Supabase session (e.g. post-Google-OAuth) but no profile yet. */
  hasExistingSession?: boolean;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 11.433 17.64 9.125 17.64 6.385z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

const slideIn = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
  transition: { duration: 0.22 },
};

export function SignInScreen({
  onSignIn,
  initialStep = 'landing',
  hasExistingSession = false,
}: SignInScreenProps) {
  const [step, setStep] = useState<SignInStep>(initialStep);

  // Sign-up credentials state
  const [signupEmail, setSignupEmail]       = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Username state
  const [username, setUsername]             = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sign-in state
  const [signinEmail, setSigninEmail]       = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  // Username availability — debounced 400 ms
  useEffect(() => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    if (!username) { setUsernameStatus('idle'); return; }
    if (!USERNAME_REGEX.test(username)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    checkTimerRef.current = setTimeout(async () => {
      const available = await isUsernameAvailable(username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 400);
    return () => { if (checkTimerRef.current) clearTimeout(checkTimerRef.current); };
  }, [username]);

  const handleUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSignupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hasSession = await signUpWithEmail(signupEmail, signupPassword);
      if (hasSession) {
        setStep('signup-username');
      } else {
        // Supabase "Confirm email" is ON — user must click the link first
        setEmailConfirmationSent(true);
        toast.success('Check your inbox — click the confirmation link, then sign in.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const handlePickUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available' || loading) return;
    setLoading(true);
    try {
      await addUsernameToExistingSession(username);
      onSignIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save username');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(signinEmail, signinPassword);
      onSignIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  // ── Username status copy ───────────────────────────────────────────────────

  const usernameHintText: Record<UsernameStatus, string> = {
    idle:      '3–20 chars · letters, numbers, underscores',
    invalid:   '3–20 chars · letters, numbers, underscores only',
    checking:  'Checking…',
    available: '✓ Available',
    taken:     '✗ Already taken',
  };
  const usernameHintColour: Record<UsernameStatus, string> = {
    idle:      'text-gray-400',
    invalid:   'text-orange-400',
    checking:  'text-gray-400',
    available: 'text-[#651610]',
    taken:     'text-red-400',
  };

  // ── Shared sub-components ─────────────────────────────────────────────────

  const BackButton = ({ to }: { to: SignInStep }) => (
    <button
      type="button"
      onClick={() => setStep(to)}
      className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );

  const OrDivider = () => (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors disabled:opacity-50 text-sm"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );

  // ── Logo section (shared across all steps) ────────────────────────────────

  const LogoSection = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex flex-col items-center ${compact ? 'mb-8' : 'mb-12'}`}>
      {/* Pink logo card — placeholder for arlo character mascot */}
      <div className={`bg-[#FFC8FF] rounded-[32px] flex items-center justify-center ${compact ? 'w-20 h-20 mb-5' : 'w-32 h-32 mb-8'}`}>
        {/* ARLO character mascot comes here — replace this text when asset is ready */}
        <span
          className="font-display text-[#651610] select-none"
          style={{ fontSize: compact ? '2rem' : '3rem', lineHeight: 1 }}
        >
          a.
        </span>
      </div>
      {!compact && (
        <>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-[0.2em] uppercase">
            Redefining physical shopping.
          </p>
        </>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#EDF0F5] dark:bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">

        <AnimatePresence mode="wait">

          {/* ── Email confirmation sent ── */}
          {emailConfirmationSent && (
            <motion.div key="confirm-email" {...slideIn} className="text-center space-y-6">
              <LogoSection compact />
              <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FFC8FF] flex items-center justify-center mx-auto">
                  <span className="text-2xl">✉️</span>
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Check your inbox</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  We sent a confirmation link to <strong className="text-gray-700 dark:text-gray-200">{signupEmail}</strong>.
                  Click it, then come back and sign in.
                </p>
                <Button
                  onClick={() => { setEmailConfirmationSent(false); setStep('signin'); }}
                  className="w-full bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-12 rounded-2xl text-sm"
                >
                  Go to Sign In
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Landing ── */}
          {!emailConfirmationSent && step === 'landing' && (
            <motion.div key="landing" {...slideIn}>
              <LogoSection />

              <div className="space-y-3">
                <Button
                  onClick={() => setStep('signup-email')}
                  className="w-full bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-[#651610]/20"
                >
                  Sign Up — it's free
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStep('signin')}
                  className="w-full h-14 rounded-2xl border-2 border-[#651610] text-[#651610] font-black text-base bg-transparent hover:bg-[#651610]/5"
                >
                  Sign In
                </Button>

                <OrDivider />
                <GoogleButton />

                {/* O6 — Privacy note */}
                <p className="text-center text-[10px] text-gray-400 leading-relaxed pt-1">
                  By signing up you agree to our{' '}
                  {/* TODO: replace # with real Terms URL */}
                  <a href="#" className="underline hover:text-[#651610]">Terms</a>
                  {' '}&amp;{' '}
                  {/* TODO: replace # with real Privacy Policy URL */}
                  <a href="#" className="underline hover:text-[#651610]">Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Sign Up — Step 1: Email + Password ── */}
          {!emailConfirmationSent && step === 'signup-email' && (
            <motion.div key="signup-email" {...slideIn}>
              <LogoSection compact />
              <BackButton to="landing" />

              <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create your account</h2>
                  <p className="text-sm text-gray-400">Enter your email and choose a password.</p>
                </div>

                <form onSubmit={handleSignupEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email-input" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                      Email
                    </Label>
                    <Input
                      id="signup-email-input"
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      required
                      className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-12 rounded-2xl shadow-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password-input" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                      Password
                    </Label>
                    <Input
                      id="signup-password-input"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-12 rounded-2xl shadow-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-[#651610]/20 disabled:opacity-50 mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue →'}
                  </Button>
                </form>

                <p className="text-center text-[10px] text-gray-400 leading-relaxed">
                  By signing up you agree to our{' '}
                  <a href="#" className="underline hover:text-[#651610]">Terms</a>
                  {' '}&amp;{' '}
                  <a href="#" className="underline hover:text-[#651610]">Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Sign Up — Step 2: Username ── */}
          {!emailConfirmationSent && step === 'signup-username' && (
            <motion.div key="signup-username" {...slideIn}>
              <LogoSection compact />
              {!hasExistingSession && <BackButton to="signup-email" />}

              <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Choose your username</h2>
                  <p className="text-sm text-gray-400">This is how you appear in arlo.</p>
                </div>

                <form onSubmit={handlePickUsername} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="username-input" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                      Username
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black select-none">@</span>
                      <Input
                        id="username-input"
                        type="text"
                        placeholder="yourname"
                        value={username}
                        onChange={handleUsernameInput}
                        maxLength={20}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-12 rounded-2xl pl-8 pr-10 shadow-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking'  && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                        {usernameStatus === 'available' && <Check className="w-4 h-4 text-[#651610]" />}
                        {usernameStatus === 'taken'     && <X className="w-4 h-4 text-red-400" />}
                      </span>
                    </div>
                    <p className={`text-[10px] ml-1 font-medium ${usernameHintColour[usernameStatus]}`}>
                      {usernameHintText[usernameStatus]}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={usernameStatus !== 'available' || loading}
                    className="w-full bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-[#651610]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Username →'}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Sign In ── */}
          {!emailConfirmationSent && step === 'signin' && (
            <motion.div key="signin" {...slideIn}>
              <LogoSection compact />
              <BackButton to="landing" />

              <div className="bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Welcome back</h2>
                  <p className="text-sm text-gray-400">Sign in to continue with arlo.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@example.com"
                      value={signinEmail}
                      onChange={e => setSigninEmail(e.target.value)}
                      required
                      className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-12 rounded-2xl shadow-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="signin-password" className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                        Password
                      </Label>
                      {/* TODO: wire up forgot-password flow (PL8) */}
                      <a href="#" className="text-[10px] font-bold text-[#651610] hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signinPassword}
                      onChange={e => setSigninPassword(e.target.value)}
                      required
                      className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-12 rounded-2xl shadow-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-[#651610]/20 disabled:opacity-50 mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>

                <OrDivider />
                <GoogleButton />

                <div className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('signup-email')}
                    className="text-[#651610] font-black hover:underline"
                  >
                    Create a free account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
