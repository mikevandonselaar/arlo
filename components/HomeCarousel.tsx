import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wordmark } from './Wordmark';

// ── Hardcoded alpha-statistieken (slide 2) ────────────────────────────────────
// TODO: vervang door live Supabase fetch zodra beschikbaar
const MEMBER_COUNT = 233;
const ITEMS_SCANNED = 1840;

const TOTAL_SLIDES = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
};

// ── Dot indicators — the current slide is the selected state, so it gets accent ─

function Dots({ index }: { index: number }) {
  return (
    <div className="flex justify-center items-center gap-[5px] mt-4">
      {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
        <div
          key={i}
          className={`h-[5px] rounded-full transition-all duration-300 ${
            i === index ? 'w-4 bg-accent' : 'w-[5px] bg-ink/20'
          }`}
        />
      ))}
    </div>
  );
}

const eyebrow = 'type-data text-muted mb-2.5';
const primaryButton = 'block w-full h-[52px] rounded-sm bg-accent text-on-accent text-[15px] font-medium active:opacity-70';
const secondaryButton = 'block w-full h-[52px] rounded-sm border border-ink text-ink text-[15px] font-medium active:opacity-70';

// ── Slide 1: Welcome ──────────────────────────────────────────────────────────

function Slide1({ onStartScanning }: { onStartScanning: () => void }) {
  return (
    <div className="relative h-full overflow-hidden bg-bg text-ink">
      {/* Content: geankerd onderaan */}
      <div className="absolute bottom-0 left-0 right-0 px-7 pb-9">
        <p className={eyebrow}>Onboarding</p>
        <h2 className="type-hero mb-5">
          Welkom bij utan.
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Loop een winkel in, scan wat je wilt hebben en utan regelt de rest.
        </p>
        <button onClick={onStartScanning} className={primaryButton}>
          Start met scannen
        </button>
        <Dots index={0} />
      </div>
    </div>
  );
}

// ── Slide 2: Community Join ───────────────────────────────────────────────────

function Slide2({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="relative h-full overflow-hidden bg-bg text-ink">
      {/* Content: vult volledige hoogte, flex-col */}
      <div className="absolute inset-0 flex flex-col px-7 pt-14 pb-9">
        <p className={eyebrow}>Community</p>
        <h2 className="type-hero tabular-nums mb-4">
          {MEMBER_COUNT} doen<br />al mee.
        </h2>
        {/* Body: flex 1 vult ruimte tussen titel en stats */}
        <p className="text-sm text-muted leading-relaxed mb-4 flex-1">
          Scan een kledingstuk. Staat het online, dan brengt utan het thuis.
        </p>
        {/* Stats: 2 kolommen — GEEN "delivered" kolom */}
        <div className="flex border border-line rounded-sm py-4 px-2.5 mb-5">
          <div className="flex-1 text-center">
            <span className="block text-xl font-medium tabular-nums mb-0.5">
              {ITEMS_SCANNED.toLocaleString('nl-NL')}
            </span>
            <span className="type-data text-muted">items<br />gescand</span>
          </div>
          <div className="w-px bg-line" />
          <div className="flex-1 text-center">
            <span className="block text-xl font-medium tabular-nums mb-0.5">
              {MEMBER_COUNT}
            </span>
            <span className="type-data text-muted">actieve<br />leden</span>
          </div>
        </div>
        <button onClick={onJoin} className={primaryButton}>
          Meedoen
        </button>
        <Dots index={1} />
      </div>
    </div>
  );
}

// ── Slide 3: Follow ───────────────────────────────────────────────────────────

function SocialCard({ href, name, handle, children }: {
  href: string;
  name: string;
  handle: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border border-line rounded-sm px-4 py-[15px] mb-2.5 text-ink no-underline active:opacity-70"
    >
      <div className="w-[42px] h-[42px] rounded-sm border border-line flex items-center justify-center flex-shrink-0">
        {children}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium mb-0.5">{name}</div>
        <div className="font-mono text-[11px] text-muted">{handle}</div>
      </div>
    </a>
  );
}

function Slide3() {
  return (
    <div className="relative h-full overflow-hidden bg-bg text-ink">
      {/* Content: vult volledige hoogte, flex-col */}
      <div className="absolute inset-0 flex flex-col px-7 pt-14 pb-9">
        <p className={eyebrow}>Net begonnen</p>
        <h2 className="type-hero mb-4">
          Volg utan.
        </h2>
        {/* Body: flex 1 vult ruimte tussen titel en social cards */}
        <p className="text-sm text-muted leading-relaxed mb-5 flex-1">
          Updates, missers en mijlpalen. Volg mee.
        </p>
        <SocialCard href="https://instagram.com/arlo.shopping" name="Instagram" handle="@arlo.shopping">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </SocialCard>
        <SocialCard href="https://tiktok.com/@arlo.shopping" name="TikTok" handle="@arlo.shopping">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.8a8.18 8.18 0 004.78 1.52V6.87a4.85 4.85 0 01-1.01-.18z"/></svg>
        </SocialCard>
        {/* GEEN skip-knop — bewust weggelaten */}
        <Dots index={2} />
      </div>
    </div>
  );
}

// ── Slide 4: Heads Up ─────────────────────────────────────────────────────────

const USAGE_TIPS = [
  'Maak een scherpe foto van het label. De barcode moet helemaal zichtbaar zijn.',
  'De prijs wordt meestal automatisch ingevuld. Soms moet je hem zelf aanpassen.',
  'utan werkt alleen met winkels die ook online verkopen. Je scan wordt gekoppeld aan hun webshop.',
  'Hoe nauwkeurig je locatie is, hangt af van de instellingen van je toestel.',
  'Betalen kan nog niet in de app. Dat komt later.',
  'De winkel verzorgt de bezorging.',
  'Dit is een vroege alpha. Niet alles werkt al goed.',
];

const PATCH_NOTES = [
  { version: 'v0.3', date: '3 mei 2026', lines: ['+ Community-scherm live', '+ Onboarding vernieuwd', '+ Volg-slide bijgewerkt'] },
  { version: 'v0.2', date: 'april 2026', lines: ['+ Winkelmand toegevoegd', '+ Profielscherm live'] },
  { version: 'v0.1', date: 'eerste alpha', lines: ['+ App intern gelanceerd'] },
];

function HeadsUpBlock({ label, defaultOpen, items, patchNotes }: {
  label: string;
  defaultOpen: boolean;
  items?: string[];
  patchNotes?: typeof PATCH_NOTES;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line rounded-sm mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex justify-between items-center w-full px-[15px] py-[13px] active:opacity-70"
      >
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-xs text-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2.5 px-[15px] pb-3.5">
          {items && items.map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="w-1 h-1 rounded-full bg-ink mt-[7px] flex-shrink-0" />
              <span className="text-xs text-muted leading-normal">{item}</span>
            </div>
          ))}
          {patchNotes && patchNotes.map((note, i) => (
            <div
              key={i}
              className={i > 0 ? 'pt-2.5 mt-1.5 border-t border-line' : ''}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="type-data">{note.version}</span>
                <span className="type-data text-muted">{note.date}</span>
              </div>
              {note.lines.map((line, j) => (
                <p key={j} className="text-[11px] text-muted leading-relaxed">{line}</p>
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
    <div className="relative h-full overflow-hidden bg-bg text-ink">
      {/* Content: scrollbaar */}
      <div className="absolute inset-0 overflow-y-auto flex flex-col px-[18px] pt-5 pb-7">
        {/* Header: wordmark links + ALPHA rechts */}
        <div className="flex items-center justify-between mb-5">
          <Wordmark className="text-base" />
          <span className="type-data text-muted border border-line rounded-sm px-1.5">
            alpha
          </span>
        </div>
        <p className={eyebrow}>Goed om te weten</p>
        <h2 className="text-3xl font-medium leading-[1.1] tracking-[-0.02em] mb-4">
          Wat je kunt<br />verwachten
        </h2>
        {/* "Zo werkt utan" — standaard OPEN */}
        <HeadsUpBlock label="Zo werkt utan" defaultOpen={true} items={USAGE_TIPS} />
        {/* "Nieuw" — standaard DICHT */}
        <HeadsUpBlock label="Nieuw" defaultOpen={false} patchNotes={PATCH_NOTES} />
        <div className="mt-auto pt-2">
          <button onClick={onFeedback} className={secondaryButton}>
            Stuur feedback
          </button>
        </div>
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
