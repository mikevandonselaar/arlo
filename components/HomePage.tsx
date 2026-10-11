import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import HomeCarousel from './HomeCarousel';
import { Wordmark } from './Wordmark';
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
      toast.error(err instanceof Error ? err.message : 'E-mail opslaan lukt niet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/45"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="relative w-full bg-bg text-ink border-t border-line px-6 pt-6 pb-10"
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-1 bg-line mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div />
          <button
            onClick={onClose}
            aria-label="Sluit"
            className="w-9 h-9 rounded-sm border border-line flex items-center justify-center ml-auto active:opacity-70"
          >
            <X className="w-4 h-4" />
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
              <p className="type-data flex items-center justify-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Aangemeld
              </p>
              <p className="font-medium text-xl mb-2">Je doet mee.</p>
              <p className="text-sm text-muted leading-relaxed">
                Je e-mail is opgeslagen. Welkom bij utan.
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full h-12 rounded-sm bg-accent text-on-accent font-medium text-sm active:opacity-70"
              >
                Start met scannen
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
            >
              <p className="type-data text-muted mb-2">Meedoen</p>
              <h2 className="text-2xl font-medium leading-tight mb-1">
                Blijf op de hoogte.
              </h2>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Laat je e-mail achter voor nieuws over nieuwe winkels en functies.
              </p>

              <label className="type-data text-muted ml-1 block mb-1.5">
                E-mailadres
              </label>
              <input
                ref={inputRef}
                type="email"
                required
                placeholder="naam@voorbeeld.nl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 rounded-sm border border-ink/30 bg-transparent px-4 text-sm text-ink placeholder:text-muted outline-none focus:border-ink mb-4"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-sm bg-accent text-on-accent font-medium text-sm flex items-center justify-center gap-2 active:opacity-70 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Meedoen'}
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
      <div className="h-full bg-bg text-ink flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-line">
          <div className="flex items-center gap-2">
            <Wordmark className="text-2xl" />
            <span className="type-data text-muted border border-line rounded-sm px-1.5">
              alpha
            </span>
          </div>
          <div className="flex items-center gap-1.5 border border-line rounded-sm pl-2.5 pr-3.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="type-data">
              {city ?? 'Zoeken'}
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
