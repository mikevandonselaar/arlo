import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Hardcoded alpha-statistieken (slide 2) ────────────────────────────────────
// TODO: vervang door live Supabase fetch zodra beschikbaar
const MEMBER_COUNT = 233;
const ITEMS_SCANNED = 1840;

const TOTAL_SLIDES = 4;

const DOT_COLORS = [
  { active: '#FFC8FF', inactive: 'rgba(255,255,255,0.3)' },   // slide 1 — bg #651610
  { active: '#651610', inactive: 'rgba(101,22,16,0.25)' },    // slide 2 — bg #FFC8FF
  { active: '#651610', inactive: 'rgba(101,22,16,0.2)' },     // slide 3 — bg #EDF0F5
  { active: '#FFC8FF', inactive: 'rgba(255,255,255,0.2)' },   // slide 4 — bg #1a0a09
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
};

// ── Dot indicators ────────────────────────────────────────────────────────────

function Dots({ index }: { index: number }) {
  const colors = DOT_COLORS[index];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 16 }}>
      {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 5,
            width: i === index ? 16 : 5,
            borderRadius: i === index ? 3 : 99,
            backgroundColor: i === index ? colors.active : colors.inactive,
            transition: 'all 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// ── Slide 1: Welcome — achtergrond #651610 ────────────────────────────────────

function Slide1({ onStartScanning }: { onStartScanning: () => void }) {
  return (
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: '#651610' }}>
      {/* Blobs: #FFC8FF, opacity 0.09 / 0.07 / 0.06 */}
      <div className="absolute rounded-full pointer-events-none" style={{ width: 260, height: 220, top: -70, right: -65, backgroundColor: '#FFC8FF', opacity: 0.09 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 200, height: 170, top: 180, left: -65, backgroundColor: '#FFC8FF', opacity: 0.07 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 180, height: 150, top: 320, right: -40, backgroundColor: '#FFC8FF', opacity: 0.06 }} />
      {/* Fade: transparant → #651610, onderste 70% */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: '70%', background: 'linear-gradient(to bottom, transparent 0%, #651610 55%)' }}
      />
      {/* Content: geankerd onderaan */}
      <div className="absolute bottom-0 left-0 right-0" style={{ padding: '0 28px 36px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#FFC8FF', opacity: 0.7, marginBottom: 10 }}>
          onboarding
        </p>
        <h2 style={{ fontSize: 38, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1.05, letterSpacing: '-0.5px', marginBottom: 14 }}>
          welcome to <span style={{ color: '#FFC8FF' }}>arlo.</span>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, marginBottom: 24 }}>
          Physical shopping, evolved. Walk in, scan what catches your eye, and let arlo handle the rest. Join the people changing how fashion moves.
        </p>
        <button
          onClick={onStartScanning}
          className="active:scale-95 transition-transform"
          style={{ background: '#FFC8FF', color: '#651610', fontSize: 15, fontWeight: 700, padding: '15px 0', borderRadius: 28, textAlign: 'center', width: '100%', border: 'none', cursor: 'pointer', display: 'block' }}
        >
          Start scanning →
        </button>
        <Dots index={0} />
      </div>
    </div>
  );
}

// ── Slide 2: Community Join — achtergrond #FFC8FF ─────────────────────────────

function Slide2({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: '#FFC8FF' }}>
      {/* Blobs: #651610, opacity 0.06 / 0.04 */}
      <div className="absolute rounded-full pointer-events-none" style={{ width: 240, height: 210, top: -80, right: -70, backgroundColor: '#651610', opacity: 0.06 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 140, height: 120, bottom: -45, left: -45, backgroundColor: '#651610', opacity: 0.04 }} />
      {/* Content: vult volledige hoogte, flex-col */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '56px 28px 36px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#651610', opacity: 0.6, marginBottom: 10 }}>
          join the community
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#651610', lineHeight: 1.05, letterSpacing: '-0.5px', marginBottom: 12 }}>
          {MEMBER_COUNT} have already<br />joined.
        </h2>
        {/* Body: flex 1 vult ruimte tussen titel en stats */}
        <p style={{ fontSize: 14, color: 'rgba(101,22,16,0.65)', lineHeight: 1.6, marginBottom: 18, flex: 1 }}>
          Scan any garment. If it's online, arlo. brings it home.
        </p>
        {/* Stats: 2 kolommen — GEEN "delivered" kolom */}
        <div style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 18, padding: '16px 10px', display: 'flex', marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 20, fontWeight: 700, color: '#651610', marginBottom: 3 }}>
              {ITEMS_SCANNED.toLocaleString()}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(101,22,16,0.5)', lineHeight: 1.3 }}>items<br />scanned</span>
          </div>
          <div style={{ width: 1, backgroundColor: 'rgba(101,22,16,0.18)', margin: '4% 0' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: 20, fontWeight: 700, color: '#651610', marginBottom: 3 }}>
              {MEMBER_COUNT}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(101,22,16,0.5)', lineHeight: 1.3 }}>active<br />members</span>
          </div>
        </div>
        {/* CTA: outer wrapper #EDF0F5 radius 28px, knop #651610 tekst #FFC8FF radius 23px */}
        <div style={{ backgroundColor: '#EDF0F5', borderRadius: 28, padding: 5 }}>
          <button
            onClick={onJoin}
            className="active:scale-95 transition-transform"
            style={{ background: '#651610', color: '#FFC8FF', fontSize: 15, fontWeight: 700, padding: '14px 0', borderRadius: 23, textAlign: 'center', width: '100%', border: 'none', cursor: 'pointer', display: 'block' }}
          >
            join arlo. →
          </button>
        </div>
        <Dots index={1} />
      </div>
    </div>
  );
}

// ── Slide 3: Follow — achtergrond #EDF0F5 ────────────────────────────────────

function Slide3() {
  return (
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: '#EDF0F5' }}>
      {/* Blob 1: #FFC8FF, opacity 0.6 — groot en prominent rechtsboven */}
      <div className="absolute rounded-full pointer-events-none" style={{ width: 240, height: 210, top: -60, right: -55, backgroundColor: '#FFC8FF', opacity: 0.6 }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 110, height: 95, top: 220, left: -40, backgroundColor: '#651610', opacity: 0.04 }} />
      {/* Content: vult volledige hoogte, flex-col */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '56px 28px 36px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#651610', opacity: 0.6, marginBottom: 10 }}>
          we're just getting started
        </p>
        <h2 style={{ fontSize: 36, fontWeight: 700, fontStyle: 'italic', color: '#651610', lineHeight: 1.05, letterSpacing: '-0.5px', marginBottom: 12 }}>
          watch arlo.<br />grow.
        </h2>
        {/* Body: flex 1 vult ruimte tussen titel en social cards */}
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
          Updates, mess-ups and milestones — follow along.
        </p>
        {/* Social cards: bg #ffffff, border rgba(0,0,0,0.07), radius 18px */}
        {/* Icon box: bg #FFC8FF, 42×42px, radius 12px — handle IDENTIEK op beide */}
        <a
          href="https://instagram.com/arlo.shopping"
          target="_blank"
          rel="noopener noreferrer"
          className="active:opacity-75 transition-opacity"
          style={{ background: '#ffffff', borderRadius: 18, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10, border: '0.5px solid rgba(0,0,0,0.07)', textDecoration: 'none' }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFC8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#651610' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#651610', marginBottom: 2 }}>Instagram</div>
            <div style={{ fontSize: 11, color: 'rgba(101,22,16,0.5)' }}>@arlo.shopping</div>
          </div>
          <span style={{ fontSize: 14, color: 'rgba(101,22,16,0.3)' }}>→</span>
        </a>
        <a
          href="https://tiktok.com/@arlo.shopping"
          target="_blank"
          rel="noopener noreferrer"
          className="active:opacity-75 transition-opacity"
          style={{ background: '#ffffff', borderRadius: 18, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10, border: '0.5px solid rgba(0,0,0,0.07)', textDecoration: 'none' }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFC8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#651610' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.8a8.18 8.18 0 004.78 1.52V6.87a4.85 4.85 0 01-1.01-.18z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#651610', marginBottom: 2 }}>TikTok</div>
            <div style={{ fontSize: 11, color: 'rgba(101,22,16,0.5)' }}>@arlo.shopping</div>
          </div>
          <span style={{ fontSize: 14, color: 'rgba(101,22,16,0.3)' }}>→</span>
        </a>
        {/* GEEN skip-knop — bewust weggelaten */}
        <Dots index={2} />
      </div>
    </div>
  );
}

// ── Slide 4: Heads Up — achtergrond #1a0a09 ──────────────────────────────────

const USING_ARLO_TIPS = [
  'Take a clear photo of the label — make sure the barcode is fully visible.',
  'Prices are usually pulled automatically, but may occasionally need a manual correction.',
  'arlo. only works with retailers that sell online — we match your scan to their webshop.',
  'Location accuracy depends on your device permissions.',
  "Payments aren't in the app yet — coming soon.",
  'Delivery is handled by the retailer directly.',
  'This is early alpha — rough edges expected.',
];

const PATCH_NOTES = [
  { version: 'v0.3', date: '3 mei 2026', lines: ['+ Community join screen live', '+ Onboarding flow redesigned', '+ Follow slide updated'] },
  { version: 'v0.2', date: 'april 2026', lines: ['+ Bag functionality added', '+ Profile screen live'] },
  { version: 'v0.1', date: 'eerste alpha', lines: ['+ App launched internally'] },
];

function HeadsUpBlock({ label, defaultOpen, items, patchNotes }: {
  label: string;
  defaultOpen: boolean;
  items?: string[];
  patchNotes?: typeof PATCH_NOTES;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding: '13px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#FFC8FF', fontSize: 12 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 15px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items && items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#FFC8FF', fontSize: 11, marginTop: 1, flexShrink: 0 }}>◎</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
          {patchNotes && patchNotes.map((note, i) => (
            <div
              key={i}
              style={{
                paddingTop: i > 0 ? 10 : 0,
                marginTop: i > 0 ? 6 : 0,
                borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ backgroundColor: '#651610', borderRadius: 5, padding: '1px 6px', color: '#FFC8FF', fontSize: 8, fontWeight: 700, opacity: i === 0 ? 1 : i === 1 ? 0.6 : 0.35 }}>
                  {note.version}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{note.date}</span>
              </div>
              {note.lines.map((line, j) => (
                <p key={j} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.6, opacity: i === 0 ? 0.7 : i === 1 ? 0.5 : 0.35 }}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Slide4({ onFeedback }: { onFeedback: () => void }) {
  return (
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: '#1a0a09' }}>
      {/* Blob: #FFC8FF, opacity 0.05, linksboven */}
      <div className="absolute rounded-full pointer-events-none" style={{ width: 200, height: 180, top: -70, left: -60, backgroundColor: '#FFC8FF', opacity: 0.05 }} />
      {/* Content: scrollbaar */}
      <div className="absolute inset-0 overflow-y-auto flex flex-col" style={{ padding: '20px 18px 28px' }}>
        {/* Header: "arlo." wit links + ALPHA badge bg #651610 tekst #FFC8FF rechts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px' }}>arlo.</span>
          <span style={{ backgroundColor: '#651610', color: '#FFC8FF', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 7, letterSpacing: '0.5px' }}>
            ALPHA
          </span>
        </div>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#FFC8FF', opacity: 0.7, marginBottom: 6 }}>
          heads up
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 16 }}>
          what to<br />expect
        </h2>
        {/* "using arlo." — standaard OPEN */}
        <HeadsUpBlock label="using arlo." defaultOpen={true} items={USING_ARLO_TIPS} />
        {/* "what's new" — standaard DICHT */}
        <HeadsUpBlock label="what's new" defaultOpen={false} patchNotes={PATCH_NOTES} />
        {/* Feedback: bg #651610, tekst #FFC8FF, radius 13px */}
        <button
          onClick={onFeedback}
          className="active:scale-95 transition-transform"
          style={{ backgroundColor: '#651610', color: '#FFC8FF', fontSize: 13, fontWeight: 600, padding: '14px 0', borderRadius: 13, textAlign: 'center', marginTop: 'auto', border: 'none', cursor: 'pointer', width: '100%', display: 'block' }}
        >
          Send Feedback
        </button>
        <Dots index={3} />
      </div>
    </div>
  );
}

// ── HomeCarousel ──────────────────────────────────────────────────────────────

export interface HomeCarouselProps {
  availableHeight: number;
  onJoin: () => void;
  onFeedback: () => void;
  onStartScanning: () => void;
}

export default function HomeCarousel({ onJoin, onFeedback, onStartScanning }: HomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection]       = useState(1);
  const touchStartX = useRef<number | null>(null);

  const goTo = (index: number, dir: number) => { setDirection(dir); setCurrentSlide(index); };
  const goNext = () => goTo((currentSlide + 1) % TOTAL_SLIDES,  1);
  const goPrev = () => goTo((currentSlide - 1 + TOTAL_SLIDES) % TOTAL_SLIDES, -1);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
    touchStartX.current = null;
  };

  return (
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
          className="absolute inset-0"
        >
          {currentSlide === 0 && <Slide1 onStartScanning={onStartScanning} />}
          {currentSlide === 1 && <Slide2 onJoin={onJoin} />}
          {currentSlide === 2 && <Slide3 />}
          {currentSlide === 3 && <Slide4 onFeedback={onFeedback} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
