import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Check, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Wordmark } from './Wordmark';
import {
  USERNAME_REGEX,
  isUsernameAvailable,
  signUpWithEmail,
  addUsernameToExistingSession,
  signInWithEmail,
  signInWithGoogle,
} from '../lib/auth';

// Shows a "skip login" button, only in the dev server on localhost.
// import.meta.env.DEV is false in production builds, so it never ships.
const DEV_BYPASS_AUTH =
  import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(window.location.hostname);

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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 11.433 17.64 9.125 17.64 6.385z" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" />
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
        toast.success('Check je inbox. Klik op de bevestigingslink en log daarna in.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Account maken lukt niet');
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
      toast.error(err instanceof Error ? err.message : 'Gebruikersnaam opslaan lukt niet');
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
      toast.error(err instanceof Error ? err.message : 'E-mail of wachtwoord klopt niet');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Inloggen met Google lukt niet');
      setLoading(false);
    }
  };

  // ── Username status copy ───────────────────────────────────────────────────

  const usernameHintText: Record<UsernameStatus, string> = {
    idle:      '3–20 tekens · letters, cijfers, underscores',
    invalid:   'Alleen 3–20 tekens · letters, cijfers, underscores',
    checking:  'Controleren',
    available: 'Beschikbaar',
    taken:     'Bezet',
  };
  const usernameHintColour: Record<UsernameStatus, string> = {
    idle:      'text-muted',
    invalid:   'text-ink',
    checking:  'text-muted',
    available: 'text-accent',
    taken:     'text-ink',
  };

  // ── Shared sub-components ─────────────────────────────────────────────────

  const BackButton = ({ to }: { to: SignInStep }) => (
    <button
      type="button"
      onClick={() => setStep(to)}
      className="flex items-center gap-1.5 text-sm font-medium text-muted active:opacity-70 mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Terug
    </button>
  );

  const OrDivider = () => (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-line" />
      <span className="type-data text-muted">of</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full border border-line h-14 rounded-sm flex items-center justify-center gap-3 font-medium text-ink active:opacity-70 disabled:opacity-50 text-sm"
    >
      <GoogleIcon />
      Verder met Google
    </button>
  );

  // ── Logo section (shared across all steps) ────────────────────────────────

  const LogoSection = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex flex-col items-center text-ink ${compact ? 'mb-8' : 'mb-12'}`}>
      <Wordmark className={compact ? 'text-2xl mb-5' : 'text-[56px] mb-8'} />
      {!compact && (
        <p className="type-data text-muted">
          Winkelen zonder gedoe.
        </p>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">

        <AnimatePresence mode="wait">

          {/* ── Email confirmation sent ── */}
          {emailConfirmationSent && (
            <motion.div key="confirm-email" {...slideIn} className="text-center space-y-6">
              <LogoSection compact />
              <div className="border border-line rounded-sm p-8 space-y-4">
                <h2 className="text-xl font-medium text-ink">Check je inbox</h2>
                <p className="text-sm text-muted leading-relaxed">
                  Er is een bevestigingslink gestuurd naar <strong className="font-medium text-ink">{signupEmail}</strong>.
                  Klik erop en log daarna in.
                </p>
                <Button
                  onClick={() => { setEmailConfirmationSent(false); setStep('signin'); }}
                  className="w-full h-12 text-sm"
                >
                  Naar inloggen
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Landing ── */}
          {!emailConfirmationSent && step === 'landing' && (
            <motion.div key="landing" {...slideIn}>
              <LogoSection />

              <div className="space-y-3">
                {DEV_BYPASS_AUTH && (
                  <Button
                    variant="outline"
                    onClick={onSignIn}
                    className="w-full h-14 text-base"
                  >
                    Login overslaan (dev)
                  </Button>
                )}

                <Button
                  onClick={() => setStep('signup-email')}
                  className="w-full h-14 text-base"
                >
                  Account maken
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStep('signin')}
                  className="w-full h-14 text-base"
                >
                  Inloggen
                </Button>

                <OrDivider />
                <GoogleButton />

                {/* O6 — Privacy note */}
                <p className="text-center text-[10px] text-muted leading-relaxed pt-1">
                  Met een account ga je akkoord met de{' '}
                  {/* TODO: replace # with real Terms URL */}
                  <a href="#" className="underline">voorwaarden</a>
                  {' '}en het{' '}
                  {/* TODO: replace # with real Privacy Policy URL */}
                  <a href="#" className="underline">privacybeleid</a>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Sign Up — Step 1: Email + Password ── */}
          {!emailConfirmationSent && step === 'signup-email' && (
            <motion.div key="signup-email" {...slideIn}>
              <LogoSection compact />
              <BackButton to="landing" />

              <div className="border border-line rounded-sm p-8 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-2xl font-medium text-ink">Account maken</h2>
                  <p className="text-sm text-muted">Vul je e-mail in en kies een wachtwoord.</p>
                </div>

                <form onSubmit={handleSignupEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email-input" className="ml-1">
                      E-mail
                    </Label>
                    <Input
                      id="signup-email-input"
                      type="email"
                      placeholder="naam@voorbeeld.nl"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password-input" className="ml-1">
                      Wachtwoord
                    </Label>
                    <Input
                      id="signup-password-input"
                      type="password"
                      placeholder="Minimaal 8 tekens"
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verder'}
                  </Button>
                </form>

                <p className="text-center text-[10px] text-muted leading-relaxed">
                  Met een account ga je akkoord met de{' '}
                  <a href="#" className="underline">voorwaarden</a>
                  {' '}en het{' '}
                  <a href="#" className="underline">privacybeleid</a>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Sign Up — Step 2: Username ── */}
          {!emailConfirmationSent && step === 'signup-username' && (
            <motion.div key="signup-username" {...slideIn}>
              <LogoSection compact />
              {!hasExistingSession && <BackButton to="signup-email" />}

              <div className="border border-line rounded-sm p-8 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-2xl font-medium text-ink">Kies een gebruikersnaam</h2>
                  <p className="text-sm text-muted">Zo heet je in utan.</p>
                </div>

                <form onSubmit={handlePickUsername} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="username-input" className="ml-1">
                      Gebruikersnaam
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium select-none">@</span>
                      <Input
                        id="username-input"
                        type="text"
                        placeholder="jouwnaam"
                        value={username}
                        onChange={handleUsernameInput}
                        maxLength={20}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="h-12 pl-8 pr-10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking'  && <Loader2 className="w-4 h-4 text-muted animate-spin" />}
                        {usernameStatus === 'available' && <Check className="w-4 h-4 text-accent" />}
                        {usernameStatus === 'taken'     && <X className="w-4 h-4 text-ink" />}
                      </span>
                    </div>
                    <p className={`type-data ml-1 ${usernameHintColour[usernameStatus]}`}>
                      {usernameHintText[usernameStatus]}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={usernameStatus !== 'available' || loading}
                    className="w-full h-14 text-base disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Opslaan'}
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

              <div className="border border-line rounded-sm p-8 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-2xl font-medium text-ink">Inloggen</h2>
                  <p className="text-sm text-muted">Log in om verder te gaan.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="ml-1">
                      E-mail
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="naam@voorbeeld.nl"
                      value={signinEmail}
                      onChange={e => setSigninEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="signin-password">
                        Wachtwoord
                      </Label>
                      {/* TODO: wire up forgot-password flow (PL8) */}
                      <a href="#" className="text-[11px] text-ink underline">
                        Wachtwoord vergeten?
                      </a>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signinPassword}
                      onChange={e => setSigninPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Inloggen'}
                  </Button>
                </form>

                <OrDivider />
                <GoogleButton />

                <div className="text-center text-[11px] text-muted">
                  Nieuw hier?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('signup-email')}
                    className="text-ink font-medium underline"
                  >
                    Account maken
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
