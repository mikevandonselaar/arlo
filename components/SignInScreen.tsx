import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Loader2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import kodaLogo from '../assets/889e0f89ea9f9c4f1bed9fb0d641b7ce6702968e.png';
import {
  USERNAME_REGEX,
  isUsernameAvailable,
  createAccountWithUsername,
  addUsernameToExistingSession,
  signInWithEmail,
  signInWithGoogle,
  getStoredUsername,
} from '../lib/auth';

interface SignInScreenProps {
  onSignIn: () => void;
  /** Which step to open on first render. Defaults to 'pick-username'. */
  initialStep?: 'pick-username' | 'sign-in';
  /** True when the user already has a Supabase session (e.g. post-Google-OAuth)
   *  but hasn't created a profile yet. Skips session creation in username step. */
  hasExistingSession?: boolean;
}

type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

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

export function SignInScreen({
  onSignIn,
  initialStep = 'pick-username',
  hasExistingSession = false,
}: SignInScreenProps) {
  const [step, setStep] = useState<'pick-username' | 'sign-in'>(initialStep);

  // ── Username picker state ──
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sign-in form state ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ── Shared ──
  const [loading, setLoading] = useState(false);

  const storedUsername = getStoredUsername();

  // Real-time username availability check (debounced 400 ms)
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
    // Enforce lowercase + strip disallowed characters as the user types
    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handlePickUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available' || loading) return;
    setLoading(true);
    try {
      if (hasExistingSession) {
        await addUsernameToExistingSession(username);
      } else {
        await createAccountWithUsername(username);
      }
      onSignIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
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
      // signInWithGoogle redirects — we never reach the line below
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  // ── Username status helpers ──
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
    available: 'text-[#51EAA7]',
    taken:     'text-red-400',
  };

  // ── Shared logo section ──
  const LogoSection = () => (
    <div className="flex flex-col items-center mb-12">
      <div className="w-56 mb-8 transform -rotate-2">
        <ImageWithFallback src={kodaLogo} alt="KODA" className="w-full h-auto object-contain" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#51EAA7]" />
        <div className="w-2 h-2 rounded-full bg-[#aab2ff]" />
        <div className="w-2 h-2 rounded-full bg-[#eca0ff]" />
      </div>
      <p className="text-gray-400 text-center text-[10px] font-black tracking-[0.2em] uppercase">
        In-Store Shopping Redefined
      </p>
    </div>
  );

  // ── Google button ──
  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full bg-white border border-gray-200 h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );

  // ── Divider ──
  const OrDivider = () => (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <LogoSection />

        <AnimatePresence mode="wait">

          {/* ── Step: pick-username ── */}
          {step === 'pick-username' && (
            <motion.form
              key="pick-username"
              onSubmit={handlePickUsername}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className="bg-[#F5F5F7] rounded-[40px] p-10 space-y-6 shadow-sm border border-gray-100"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-900">Choose your username</h2>
                <p className="text-sm text-gray-400">No email required. Add one later to secure your account.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black select-none">@</span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={handleUsernameInput}
                    maxLength={20}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="bg-white border-transparent text-gray-900 placeholder:text-gray-300 h-14 rounded-2xl pl-8 pr-10 shadow-none"
                  />
                  {/* Status icon */}
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <Check className="w-4 h-4 text-[#51EAA7]" />
                    )}
                    {usernameStatus === 'taken' && (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </span>
                </div>
                <p className={`text-[10px] ml-1 font-medium ${usernameHintColour[usernameStatus]}`}>
                  {usernameHintText[usernameStatus]}
                </p>
              </div>

              <Button
                type="submit"
                disabled={usernameStatus !== 'available' || loading}
                className="w-full bg-[#51EAA7] hover:bg-[#3ddb94] text-black font-black h-16 rounded-2xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-[#51EAA7]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Username'}
              </Button>

              <OrDivider />
              <GoogleButton />

              <div className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setStep('sign-in')}
                  className="text-[#aab2ff] font-black hover:underline"
                >
                  Sign in
                </button>
              </div>
            </motion.form>
          )}

          {/* ── Step: sign-in ── */}
          {step === 'sign-in' && (
            <motion.div
              key="sign-in"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="bg-[#F5F5F7] rounded-[40px] p-10 space-y-6 shadow-sm border border-gray-100"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-900">
                  {storedUsername ? `Welcome back, @${storedUsername}` : 'Welcome back'}
                </h2>
                <p className="text-sm text-gray-400">Sign in to continue your arlo.</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-white border-transparent text-gray-900 placeholder:text-gray-300 h-14 rounded-2xl shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="bg-white border-transparent text-gray-900 placeholder:text-gray-300 h-14 rounded-2xl shadow-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#51EAA7] hover:bg-[#3ddb94] text-black font-black h-16 rounded-2xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-[#51EAA7]/20 disabled:opacity-50"
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
                  onClick={() => setStep('pick-username')}
                  className="text-[#aab2ff] font-black hover:underline"
                >
                  Create a free account
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
