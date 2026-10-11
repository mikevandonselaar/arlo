import { useState } from 'react';
import { User, LogOut, ChevronRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Wordmark } from './Wordmark';
import { getStoredUsername, linkEmailPassword, linkGoogle, signOut } from '../lib/auth';
import { useCurrency, Currency, CURRENCY_SYMBOLS } from '../lib/currency';

interface ProfilePageProps {
  onSignOut: () => void;
  onNavigateToHeadsUp: () => void;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 11.433 17.64 9.125 17.64 6.385z" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

// ── My Orders placeholder page ────────────────────────────────────────────────

function MyOrdersPage({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-50 bg-bg text-ink flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0">
        <button
          onClick={onClose}
          aria-label="Terug"
          className="w-10 h-10 rounded-sm border border-line flex items-center justify-center active:opacity-70"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-medium">Bestellingen</span>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 border border-line rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-9 h-9 text-muted" />
        </div>
        <p className="text-muted text-sm leading-relaxed max-w-xs">
          Je bestellingen staan hier zodra je iets hebt gekocht.
        </p>
        {/* TODO: connect to order system (PL10) */}
        <div className="mt-10 text-muted">
          <Wordmark className="text-2xl" />
        </div>
      </div>
    </motion.div>
  );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────

export function ProfilePage({ onSignOut, onNavigateToHeadsUp }: ProfilePageProps) {
  const username = getStoredUsername();
  const { currency, setCurrency } = useCurrency();

  const [showOrders, setShowOrders] = useState(false);

  // Email-linking form
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [linking, setLinking]   = useState(false);
  const [emailLinked, setEmailLinked] = useState(false);

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    try {
      await linkEmailPassword(email, password);
      setEmailLinked(true);
      toast.success('E-mail ingesteld. Check je inbox om te bevestigen.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'E-mail instellen lukt niet');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await linkGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google-account koppelen lukt niet');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const CURRENCIES: Currency[] = ['GBP', 'EUR', 'USD'];

  return (
    <>
      <div className="h-full flex flex-col bg-bg text-ink">

        {/* Header */}
        <div className="px-6 pt-4 pb-4 sticky top-0 bg-bg z-10">
          <h1 className="type-hero">Profiel</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-4">

          {/* P3: closet teaser — not clickable */}
          <div className="border border-line rounded-sm p-5 flex items-center gap-4" aria-label="Binnenkort">
            <div className="w-12 h-12 rounded-sm border border-line flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-medium">U</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Je kast. Binnenkort.</p>
              <p className="text-[11px] text-muted mt-0.5 leading-snug">
                Je hele garderobe, geordend door utan.
              </p>
            </div>
          </div>

          {/* Username card */}
          <div className="border border-line rounded-sm p-5 flex items-center gap-4">
            {/* P1: profile icon */}
            <div className="w-14 h-14 rounded-full border border-line flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <p className="type-data text-muted mb-0.5">Gebruikersnaam</p>
              <p className="text-2xl font-medium truncate">@{username ?? '—'}</p>
              {/* P2: no "Anonymous Account" label — anonymous accounts removed */}
            </div>
          </div>

          {/* P4: Preferences section */}
          <div className="border border-line rounded-sm p-5 space-y-5">
            <p className="type-data text-muted">Voorkeuren</p>

            {/* Currency */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium">Valuta</p>
              <div className="flex gap-2">
                {CURRENCIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`flex-1 h-10 rounded-sm text-sm font-medium active:opacity-70 ${
                      currency === c
                        ? 'bg-accent text-on-accent'
                        : 'border border-line text-muted'
                    }`}
                  >
                    {CURRENCY_SYMBOLS[c]} {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* P5: My Orders */}
          <div className="w-full border border-line rounded-sm p-5 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm border border-line flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">
                Bestellingen <span className="text-xs font-normal text-muted">(binnenkort)</span>
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </div>

          {/* Account section */}
          <div className="border border-line rounded-sm p-5 space-y-3">
            <p className="type-data text-muted">Account</p>

            {emailLinked ? (
              <div className="border border-line rounded-sm p-4 text-center space-y-1">
                <p className="text-sm font-medium">Check je inbox om je e-mail te bevestigen.</p>
                <p className="text-xs text-muted">Je account en mand zijn veilig.</p>
              </div>
            ) : (
              <form onSubmit={handleLinkEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="link-email" className="ml-1">
                    E-mail
                  </Label>
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="naam@voorbeeld.nl"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="link-password" className="ml-1">
                    Wachtwoord
                  </Label>
                  <Input
                    id="link-password"
                    type="password"
                    placeholder="Minimaal 6 tekens"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
                {/* P6: Set Email & Password */}
                <Button
                  type="submit"
                  disabled={linking}
                  className="w-full h-11 text-sm"
                >
                  {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'E-mail en wachtwoord instellen'}
                </Button>
              </form>
            )}

            {/* P7: Link Google Account — outline */}
            <button
              type="button"
              onClick={handleLinkGoogle}
              className="w-full border border-ink h-11 rounded-sm flex items-center justify-center gap-2.5 font-medium text-sm active:opacity-70"
            >
              <GoogleIcon />
              Koppel Google-account
            </button>
          </div>

          {/* Heads Up link */}
          <button
            type="button"
            onClick={onNavigateToHeadsUp}
            className="self-center mt-6 py-[6px] text-[11px] text-muted underline active:opacity-70"
          >
            Iets vreemds gezien? Laat het weten.
          </button>

          {/* P8: Sign Out — outline */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-sm border border-line text-muted font-medium text-sm active:opacity-70"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>

        </div>
      </div>

      {/* P5: My Orders overlay */}
      <AnimatePresence>
        {showOrders && <MyOrdersPage onClose={() => setShowOrders(false)} />}
      </AnimatePresence>
    </>
  );
}
