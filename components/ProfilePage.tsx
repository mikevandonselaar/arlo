import { useState } from 'react';
import { User, LogOut, ChevronRight, ChevronLeft, ShoppingBag, Sun, Moon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredUsername, linkEmailPassword, linkGoogle, signOut } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useCurrency, Currency, CURRENCY_SYMBOLS } from '../lib/currency';

interface ProfilePageProps {
  onSignOut: () => void;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 11.433 17.64 9.125 17.64 6.385z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
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
      className="fixed inset-0 z-50 bg-[#EDF0F5] dark:bg-[#0F0F0F] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#1A1A1A] flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="font-display text-[#651610] text-lg">my orders</span>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-white dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="w-9 h-9 text-gray-200 dark:text-gray-600" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
          Your orders will appear here once you complete a purchase.
        </p>
        {/* TODO: connect to order system (PL10) */}
        <div className="mt-10">
          <span className="font-display text-[#651610] text-2xl opacity-40">arlo.</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────

export function ProfilePage({ onSignOut }: ProfilePageProps) {
  const username = getStoredUsername();
  const { theme, setTheme } = useTheme();
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
      toast.success('Email set — check your inbox to confirm.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not set email');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await linkGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not link Google account');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const CURRENCIES: Currency[] = ['GBP', 'EUR', 'USD'];

  return (
    <>
      <div className="h-full flex flex-col bg-[#EDF0F5] dark:bg-[#0F0F0F]">

        {/* Header */}
        <div className="px-6 pt-4 pb-4 sticky top-0 bg-[#EDF0F5] dark:bg-[#0F0F0F] z-10">
          <h1 className="font-display text-[#651610] text-4xl leading-none">profile</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-4">

          {/* P3: "Your Closet — Coming Soon" teaser — #FFC8FF, not clickable */}
          <div className="bg-[#FFC8FF] rounded-3xl p-5 flex items-center gap-4" aria-label="Coming soon">
            <div className="w-12 h-12 rounded-2xl bg-[#651610]/10 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-[#651610] text-lg">a.</span>
            </div>
            <div className="min-w-0">
              <p className="font-black text-[#651610] text-sm">Your Closet — Coming Soon</p>
              <p className="text-[11px] text-[#651610]/70 mt-0.5 leading-snug">
                Your full wardrobe, organized by arlo.
              </p>
            </div>
          </div>

          {/* Username card */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 flex items-center gap-4 shadow-sm">
            {/* P1: profile icon #651610 */}
            <div className="w-14 h-14 rounded-full bg-[#FFC8FF] flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-[#651610]" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Username</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white truncate">@{username ?? '—'}</p>
              {/* P2: no "Anonymous Account" label — anonymous accounts removed */}
            </div>
          </div>

          {/* P4: Preferences section */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 shadow-sm space-y-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">Preferences</p>

            {/* Currency */}
            <div className="space-y-2.5">
              <p className="text-xs font-black text-gray-700 dark:text-gray-300">Currency</p>
              <div className="flex gap-2">
                {CURRENCIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`flex-1 h-10 rounded-xl text-sm font-black transition-colors ${
                      currency === c
                        ? 'bg-[#651610] text-white'
                        : 'bg-[#EDF0F5] dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-400 hover:bg-[#651610]/10'
                    }`}
                  >
                    {CURRENCY_SYMBOLS[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme — Light / Dark — manual only, never follows system */}
            <div className="space-y-2.5">
              <p className="text-xs font-black text-gray-700 dark:text-gray-300">Theme</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 h-10 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors ${
                    theme === 'light'
                      ? 'bg-[#651610] text-white'
                      : 'bg-[#EDF0F5] dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-400 hover:bg-[#651610]/10'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 h-10 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#651610] text-white'
                      : 'bg-[#EDF0F5] dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-400 hover:bg-[#651610]/10'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* P5: My Orders */}
          <button
            onClick={() => setShowOrders(true)}
            className="w-full bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDF0F5] dark:bg-[#2A2A2A] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#651610]" />
              </div>
              <span className="font-black text-gray-900 dark:text-white text-sm">My Orders</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Account section */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 shadow-sm space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">Account</p>

            {emailLinked ? (
              <div className="bg-[#FFC8FF] rounded-2xl p-4 text-center space-y-1">
                <p className="text-sm font-black text-[#651610]">Check your inbox to confirm your email.</p>
                <p className="text-xs text-[#651610]/60">Your account and bag are safe.</p>
              </div>
            ) : (
              <form onSubmit={handleLinkEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="link-email" className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                    Email
                  </Label>
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-11 rounded-2xl shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="link-password" className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                    Password
                  </Label>
                  <Input
                    id="link-password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white placeholder:text-gray-300 h-11 rounded-2xl shadow-none"
                  />
                </div>
                {/* P6: Set Email & Password — #651610 */}
                <Button
                  type="submit"
                  disabled={linking}
                  className="w-full bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-11 rounded-2xl text-sm"
                >
                  {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Email & Password'}
                </Button>
              </form>
            )}

            {/* P7: Link Google Account — outline #651610 */}
            <button
              type="button"
              onClick={handleLinkGoogle}
              className="w-full border-2 border-[#651610] h-11 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[#651610] hover:bg-[#651610]/5 transition-colors text-sm"
            >
              <GoogleIcon />
              Link Google Account
            </button>
          </div>

          {/* P8: Sign Out — outline */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
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
