import { useState, useEffect } from 'react';
import { User, Shield, LogOut, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import {
  getStoredUsername,
  isCurrentUserAnonymous,
  linkEmailPassword,
  linkGoogle,
  signOut,
} from '../lib/auth';

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

export function ProfilePage({ onSignOut }: ProfilePageProps) {
  const username = getStoredUsername();
  const [anonymous, setAnonymous] = useState<boolean | null>(null);

  // Email-linking form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linking, setLinking] = useState(false);
  const [emailLinked, setEmailLinked] = useState(false);

  useEffect(() => {
    isCurrentUserAnonymous().then(setAnonymous);
  }, []);

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinking(true);
    try {
      await linkEmailPassword(email, password);
      setEmailLinked(true);
      toast.success('Email set — check your inbox to confirm.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not link email');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await linkGoogle();
      // Redirects — cart data is preserved under the same user id
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not link Google account');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Header */}
      <div className="px-6 pt-2 pb-4 border-b border-gray-50 sticky top-0 bg-white/50 backdrop-blur-md z-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-12">

        {/* Username card */}
        <div className="bg-[#F5F5F7] rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#51EAA7]/15 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-[#51EAA7]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Username</p>
            <p className="text-2xl font-black text-gray-900 truncate">@{username ?? '—'}</p>
            {anonymous === true && (
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider">Anonymous account</span>
            )}
            {anonymous === false && (
              <span className="text-[9px] font-black text-[#51EAA7] uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3" /> Secured
              </span>
            )}
          </div>
        </div>

        {/* ── Account-linking section (anonymous users only) ── */}
        {anonymous === true && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Shield className="w-4 h-4 text-gray-400" />
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Secure your account</h2>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              Add an email and password so you can sign back in on any device. Your cart is preserved either way.
            </p>

            {emailLinked ? (
              <div className="bg-[#51EAA7]/10 rounded-2xl p-4 text-center space-y-1">
                <p className="text-sm font-black text-[#51EAA7]">Check your inbox to confirm your email.</p>
                <p className="text-xs text-gray-400">Your account and cart are safe.</p>
              </div>
            ) : (
              <form onSubmit={handleLinkEmail} className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="link-email"
                    className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1"
                  >
                    Email
                  </Label>
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-[#F5F5F7] border-transparent text-gray-900 placeholder:text-gray-300 h-12 rounded-2xl shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="link-password"
                    className="text-gray-500 font-bold text-xs uppercase tracking-widest ml-1"
                  >
                    Password
                  </Label>
                  <Input
                    id="link-password"
                    type="password"
                    placeholder="Min of 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-[#F5F5F7] border-transparent text-gray-900 placeholder:text-gray-300 h-12 rounded-2xl shadow-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={linking}
                  className="w-full bg-[#51EAA7] hover:bg-[#3ddb94] text-black font-black h-12 rounded-2xl text-sm"
                >
                  {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Email & Password'}
                </Button>
              </form>
            )}

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleLinkGoogle}
              className="w-full bg-[#F5F5F7] border border-gray-200 h-12 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <GoogleIcon />
              Link Google Account
            </button>
          </div>
        )}

        {/* ── Sign out ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
