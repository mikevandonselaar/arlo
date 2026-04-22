import { useState, useRef } from 'react';
import { Zap, ArrowRight, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Product } from './MainApp';
import { toast } from 'sonner';

// Hardcoded waitlist count — replace with live backend counter (PL2)
const WAITLIST_COUNT = 147;

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

export function HomePage({ onStartScanning }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    setCurrentSlide(Math.round(scrollLeft / clientWidth));
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistJoined(true);
    toast.success("You're on the list!");
  };

  return (
    <div className="h-full bg-[#EDF0F5] dark:bg-[#0F0F0F] flex flex-col">

      {/* Header — H1: arlo. wordmark replaces geo header */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <span className="font-display text-[#651610] text-2xl leading-none">arlo.</span>
        {/* Notification bell placeholder — H6: colour #651610 */}
        <button className="w-10 h-10 bg-white dark:bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-sm">
          <Zap className="w-5 h-5 text-[#651610]" />
        </button>
      </div>

      {/* Swipeable slides — H2: same UI pattern, new alpha-intro content */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >

          {/* ── Slide 1: Welcome ── */}
          <div className="min-w-full snap-start h-full px-4 pb-4">
            <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#651610] flex flex-col">

              {/* Decorative wave pattern area */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
                  <path d="M-50 200 Q100 150 200 200 Q300 250 450 200 Q600 150 700 200 L700 300 Q600 350 450 300 Q300 250 200 300 Q100 350 -50 300Z" fill="#FFC8FF" />
                  <path d="M-50 400 Q100 350 200 400 Q300 450 450 400 Q600 350 700 400 L700 500 Q600 550 450 500 Q300 450 200 500 Q100 550 -50 500Z" fill="#FFC8FF" />
                  <path d="M-50 600 Q100 550 200 600 Q300 650 450 600 Q600 550 700 600 L700 700 Q600 750 450 700 Q300 650 200 700 Q100 750 -50 700Z" fill="#FFC8FF" />
                </svg>
              </div>

              {/* Badge */}
              <div className="absolute top-6 right-6 z-10">
                <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter bg-[#FFC8FF] text-[#651610]">
                  ALPHA
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <span className="text-[10px] font-black tracking-widest uppercase text-white/60">
                  arlo.
                </span>
                <h2 className="font-display text-white text-5xl leading-none mb-4 mt-2">
                  welcome to arlo. alpha
                </h2>
                <p className="text-sm text-white/80 mb-8 font-medium leading-relaxed max-w-xs">
                  Walk into any store. Scan garment labels. We ship everything straight to your door — no bags, no queues.
                </p>
                <Button
                  onClick={onStartScanning}
                  className="bg-white text-[#651610] hover:bg-white/90 rounded-full px-7 font-black flex gap-2 items-center h-12 shadow-lg"
                >
                  Start scanning <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Slide 2: Waitlist ── */}
          <div className="min-w-full snap-start h-full px-4 pb-4">
            <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#FFC8FF] flex flex-col">

              {/* Decorative circles */}
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#651610]/10" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[#651610]/5" />

              {/* Badge */}
              <div className="absolute top-6 right-6 z-10">
                <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter bg-[#651610] text-white">
                  WAITLIST
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <span className="text-[10px] font-black tracking-widest uppercase text-[#651610]/60">
                  early access
                </span>
                <h2 className="font-display text-[#651610] text-4xl leading-none mb-3 mt-2">
                  join {WAITLIST_COUNT} others on the waitlist
                </h2>
                <p className="text-sm text-[#651610]/70 mb-6 font-medium leading-relaxed">
                  Be first to shop when arlo. launches in your city.
                </p>

                {waitlistJoined ? (
                  <div className="bg-[#651610] rounded-2xl px-6 py-4 text-center">
                    <p className="text-white font-black text-sm">You're on the list!</p>
                    <p className="text-white/70 text-xs mt-1">We'll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#651610]/40" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={waitlistEmail}
                        onChange={e => setWaitlistEmail(e.target.value)}
                        required
                        className="bg-white border-transparent h-12 rounded-2xl pl-9 text-sm shadow-sm placeholder:text-[#651610]/30 text-[#651610]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-12 rounded-2xl px-5 shadow-lg shadow-[#651610]/20 whitespace-nowrap"
                    >
                      Join
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ── Slide 3: Socials ── */}
          <div className="min-w-full snap-start h-full px-4 pb-4">
            <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl bg-[#0F0F0F] flex flex-col">

              {/* Decorative accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#651610] via-[#FFC8FF] to-[#651610]" />

              {/* Badge */}
              <div className="absolute top-6 right-6 z-10">
                <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter bg-[#FFC8FF] text-[#651610]">
                  FOLLOW US
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <span className="text-[10px] font-black tracking-widest uppercase text-white/40">
                  stay updated
                </span>
                <h2 className="font-display text-white text-4xl leading-none mb-3 mt-2">
                  follow us for updates
                </h2>
                <p className="text-sm text-white/60 mb-8 font-medium leading-relaxed">
                  Drops, news, and early access — first on our socials.
                </p>

                <div className="flex flex-col gap-3">
                  {/* TODO: replace href="#" with real Instagram URL (PL3) */}
                  <a
                    href="#"
                    className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white">
                      <InstagramIcon />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">Instagram</p>
                      <p className="text-white/50 text-xs">@arlo.shop</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
                  </a>

                  {/* TODO: replace href="#" with real TikTok URL (PL4) */}
                  <a
                    href="#"
                    className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 hover:bg-white/15 transition-colors"
                  >
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
          </div>

        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 bg-[#651610]' : 'w-1.5 bg-[#651610]/25'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
