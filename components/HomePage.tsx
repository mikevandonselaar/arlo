import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import HomeCarousel from './HomeCarousel';
import { addToWaitlist } from '../lib/auth';

interface HomePageProps {
  onAddToCart: (product: never) => void;
  onStartScanning: () => void;
  onNavigateToHeadsUp: () => void;
}

function JoinModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addToWaitlist(email);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full bg-white dark:bg-[#1A1A1A] rounded-t-[32px] px-6 pt-6 pb-10"
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div />
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#EDF0F5] dark:bg-[#2A2A2A] flex items-center justify-center ml-auto">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#FFC8FF] flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-[#651610] text-2xl">a.</span>
              </div>
              <p className="font-black text-[#651610] text-xl mb-2">you're in.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                We've saved your email. Welcome to arlo.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full h-12 rounded-2xl bg-[#651610] text-white font-black text-sm active:opacity-80 transition-opacity"
              >
                Start scanning →
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
            >
              <p className="text-[10px] font-black text-[#651610] uppercase tracking-widest mb-2">join arlo.</p>
              <h2 className="font-display text-gray-900 dark:text-white text-2xl leading-tight mb-1">
                stay in the loop.
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Leave your email and we'll keep you posted on new stores, features, and drops.
              </p>

              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1.5">
                Email address
              </label>
              <input
                ref={inputRef}
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 rounded-2xl bg-[#EDF0F5] dark:bg-[#2A2A2A] px-4 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-300 border-none outline-none mb-4"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-2xl bg-[#651610] text-white font-black text-sm flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join arlo. →'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function HomePage({ onStartScanning, onNavigateToHeadsUp }: HomePageProps) {
  const [city, setCity]           = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setCity(data.address?.city || data.address?.town || data.address?.village || null);
        } catch { /* silent */ }
      },
      () => setCity(null),
    );
  }, []);

  const availableHeight = window.innerHeight - 56 - 34;

  return (
    <>
      <div className="h-full bg-[#EDF0F5] dark:bg-[#0F0F0F] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-[#651610] text-2xl leading-none">arlo.</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFC8FF] text-[#651610] text-[9px] font-black tracking-widest uppercase">
              alpha
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1A1A1A] rounded-full pl-2.5 pr-3.5 py-1.5 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#651610] flex-shrink-0" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">
              {city ?? 'Locating…'}
            </span>
          </div>
        </div>

        <HomeCarousel
          availableHeight={availableHeight}
          onJoin={() => setShowJoinModal(true)}
          onFeedback={onNavigateToHeadsUp}
          onStartScanning={onStartScanning}
        />

      </div>

      <AnimatePresence>
        {showJoinModal && <JoinModal onClose={() => setShowJoinModal(false)} />}
      </AnimatePresence>
    </>
  );
}
