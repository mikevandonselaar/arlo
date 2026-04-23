import { useState, useRef, useEffect } from 'react';
import { MapPin, ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Product } from './MainApp';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const TOTAL_SLIDES = 4;

interface HomePageProps {
  onAddToCart: (product: Product) => void;
  onStartScanning: () => void;
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.98a8.2 8.2 0 0 0 4.78 1.52V7.07a4.85 4.85 0 0 1-1.01-.38z" />
    </svg>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
};

// ── Slide 1: Welcome ──────────────────────────────────────────────────────────

function SlideWelcome({ onStartScanning }: { onStartScanning: () => void }) {
  return (
    <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#651610] flex flex-col">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <path d="M-50 200 Q100 150 200 200 Q300 250 450 200 Q600 150 700 200 L700 300 Q600 350 450 300 Q300 250 200 300 Q100 350 -50 300Z" fill="#FFC8FF" />
          <path d="M-50 400 Q100 350 200 400 Q300 450 450 400 Q600 350 700 400 L700 500 Q600 550 450 500 Q300 450 200 500 Q100 550 -50 500Z" fill="#FFC8FF" />
          <path d="M-50 600 Q100 550 200 600 Q300 650 450 600 Q600 550 700 600 L700 700 Q600 750 450 700 Q300 650 200 700 Q100 750 -50 700Z" fill="#FFC8FF" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <span className="text-[10px] font-black tracking-widest uppercase text-white/60">arlo. v1</span>
        <h2 className="font-display text-white text-5xl leading-none mb-4 mt-2">welcome to arlo.</h2>
        <p className="text-sm text-white/80 mb-8 font-medium leading-relaxed max-w-xs">
          This is the first version of arlo. — a scanning app for physical shopping.
          Walk into any store, scan garments to save them to your personal bag, then tap any item to find and buy it online.
        </p>
        <Button
          onClick={onStartScanning}
          className="bg-white text-[#651610] hover:bg-white/90 rounded-full px-7 font-black flex gap-2 items-center h-12 shadow-lg"
        >
          Start scanning <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Slide 2: Waitlist ─────────────────────────────────────────────────────────

interface SlideWaitlistProps {
  count: number;
  email: string;
  setEmail: (v: string) => void;
  joined: boolean;
  onJoin: (e: React.FormEvent) => void;
}

function SlideWaitlist({ count, email, setEmail, joined, onJoin }: SlideWaitlistProps) {
  return (
    <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#FFC8FF] flex flex-col">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#651610]/10" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[#651610]/5" />

      <div className="absolute top-6 right-6 z-10">
        <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter bg-[#651610] text-white">
          WAITLIST
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <span className="text-[10px] font-black tracking-widest uppercase text-[#651610]/60">early access</span>
        <h2 className="font-display text-[#651610] text-4xl leading-none mb-3 mt-2">
          join {count} arlo members
        </h2>
        <p className="text-sm text-[#651610]/70 mb-6 font-medium leading-relaxed">
          Be among the first to shop when arlo. launches in your city.
        </p>

        {joined ? (
          <div className="bg-[#651610] rounded-2xl px-6 py-4 text-center">
            <p className="text-white font-black text-sm">You're on the list!</p>
            <p className="text-white/70 text-xs mt-1">We'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={onJoin} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#651610]/40" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-white border-transparent h-12 rounded-2xl pl-9 text-sm shadow-sm placeholder:text-[#651610]/30 text-[#651610]"
              />
            </div>
            <Button
              type="submit"
              className="bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-12 rounded-2xl px-4 shadow-lg shadow-[#651610]/20 whitespace-nowrap text-sm"
            >
              Join Waitlist
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Slide 3: Socials ──────────────────────────────────────────────────────────

function SlideSocials() {
  return (
    <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#0F0F0F] flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#651610] via-[#FFC8FF] to-[#651610]" />

      {/* Organic dark grey shape */}
      <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
        <svg width="360" height="280" viewBox="0 0 360 280" fill="none" className="mt-8 opacity-70">
          <path
            d="M40 60 C0 30, -30 110, 20 170 C70 230, 20 265, 90 272 C160 279, 250 258, 310 232 C370 206, 390 158, 360 100 C330 42, 290 8, 230 5 C170 2, 80 90, 40 60Z"
            fill="#222222"
          />
        </svg>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter bg-[#FFC8FF] text-[#651610]">
          FOLLOW US
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <span className="text-[10px] font-black tracking-widest uppercase text-white/40">stay updated</span>
        <h2 className="font-display text-white text-4xl leading-none mb-3 mt-2">follow us for updates</h2>
        <p className="text-sm text-white/60 mb-8 font-medium leading-relaxed">
          Drops, news, and early access — first on our socials.
        </p>

        <div className="flex flex-col gap-3">
          <a href="#" className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 hover:bg-white/15 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white">
              <InstagramIcon />
            </div>
            <div>
              <p className="text-white font-black text-sm">Instagram</p>
              <p className="text-white/50 text-xs">@arlo.shop</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
          </a>

          <a href="#" className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 hover:bg-white/15 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#010101] border border-white/10 flex items-center justify-center text-white">
              <TikTokIcon />
            </div>
            <div>
              <p className="text-white font-black text-sm">TikTok</p>
              <p className="text-white/50 text-xs">@arlo.shop</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Slide 4: Known Glitches & Feedback ───────────────────────────────────────

function SlideGlitches() {
  return (
    <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#1A1A1A] flex flex-col">
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#651610]/15" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FFC8FF]/5" />

      <div className="absolute top-6 right-6 z-10">
        <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter bg-[#651610] text-white">
          ALPHA
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <span className="text-[10px] font-black tracking-widest uppercase text-white/40">heads up</span>
        <h2 className="font-display text-white text-4xl leading-none mb-4 mt-2">glitches &amp; feedback</h2>

        <div className="space-y-2.5 mb-6">
          {[
            'Barcode scanning is simulated — real scanning coming soon',
            'Prices must be entered manually after each scan',
            'Location accuracy depends on your device permissions',
            'This is early alpha — rough edges expected',
          ].map((issue, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-[#FFC8FF] text-xs mt-0.5 flex-shrink-0 font-black">·</span>
              <p className="text-white/60 text-xs font-medium leading-snug">{issue}</p>
            </div>
          ))}
        </div>

        <a
          href="mailto:davevandonselaar@gmail.com?subject=arlo%20alpha%20feedback"
          className="flex items-center justify-center gap-2 bg-[#651610] rounded-2xl px-6 py-4 text-white font-black text-sm w-full active:bg-[#7d1e17] transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Send Feedback
        </a>
      </div>
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────

export function HomePage({ onStartScanning }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(() => Math.floor(Math.random() * TOTAL_SLIDES));
  const [direction, setDirection]       = useState(1);
  const [waitlistCount, setWaitlistCount] = useState(150);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

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

  const goTo = (index: number, dir: number) => {
    setDirection(dir);
    setCurrentSlide(index);
  };
  const goNext = () => goTo((currentSlide + 1) % TOTAL_SLIDES, 1);
  const goPrev = () => goTo((currentSlide - 1 + TOTAL_SLIDES) % TOTAL_SLIDES, -1);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
    touchStartX.current = null;
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistJoined(true);
    setWaitlistCount(c => c + 1);
    toast.success("You're on the list!");
  };

  return (
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

      {/* Swipeable slides */}
      <div
        className="relative flex-1 min-h-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 px-4 pb-4"
          >
            {currentSlide === 0 && <SlideWelcome onStartScanning={onStartScanning} />}
            {currentSlide === 1 && (
              <SlideWaitlist
                count={waitlistCount}
                email={waitlistEmail}
                setEmail={setWaitlistEmail}
                joined={waitlistJoined}
                onJoin={handleJoinWaitlist}
              />
            )}
            {currentSlide === 2 && <SlideSocials />}
            {currentSlide === 3 && <SlideGlitches />}
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators — white on all slides */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-20">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
