import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Wordmark } from './Wordmark';

interface HomePageProps {
  onAddToCart: (product: never) => void;
  onStartScanning: () => void;
  onNavigateToHeadsUp: () => void;
}

const KNOWN_ISSUES = [
  'Take a sharp photo of the label. The barcode has to be fully visible.',
  'The price is usually filled in automatically. Sometimes you have to correct it.',
  'utan only works with stores that also sell online. Your scan is matched to their webshop.',
  'Location accuracy depends on your device settings.',
  'Payments are not in the app yet. That comes later.',
  'Delivery is handled by the store.',
  'This is an early alpha. Not everything works yet.',
];

const VERSIONS = [
  { version: 'v0.3', date: '3 May 2026', lines: ['Community screen live', 'Onboarding redesigned', 'Follow slide updated'] },
  { version: 'v0.2', date: 'April 2026', lines: ['Cart added', 'Profile screen live'] },
  { version: 'v0.1', date: 'first alpha', lines: ['App launched internally'] },
];

export function HomePage({ onStartScanning, onNavigateToHeadsUp }: HomePageProps) {
  const [city, setCity] = useState<string | null>(null);
  const expectRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

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

  const scrollToExpect = () => {
    expectRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
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
            {city ?? 'Locating'}
          </span>
        </div>
      </div>

      {/* One scrollable page: welcome first, "what to expect" below the fold */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* Welcome — fills the screen, content anchored to the bottom */}
        <section className="min-h-full flex flex-col justify-end px-6 pt-10 pb-8">
          <h1 className="type-hero mb-5">
            Welcome to utan.
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Walk into a store, scan what you want and utan handles the rest.
          </p>
          <div className="space-y-3">
            <button
              onClick={onStartScanning}
              className="block w-full h-14 rounded-sm bg-accent text-on-accent text-base font-medium active:opacity-70"
            >
              Start scanning
            </button>
            <button
              onClick={scrollToExpect}
              className="block w-full h-14 rounded-sm border border-ink text-ink text-base font-medium active:opacity-70"
            >
              What to expect
            </button>
          </div>
        </section>

        {/* What to expect — known issues and versions */}
        <section ref={expectRef} className="px-6 pt-8 pb-10 border-t border-line">
          <h2 className="text-3xl font-medium leading-[1.1] tracking-[-0.02em] mb-8">
            What to expect
          </h2>

          <p className="type-data text-muted mb-3">Good to know</p>
          <ul className="border-t border-line mb-10">
            {KNOWN_ISSUES.map(item => (
              <li key={item} className="py-3 border-b border-line text-sm leading-normal">
                {item}
              </li>
            ))}
          </ul>

          <p className="type-data text-muted mb-3">Versions</p>
          <ul className="border-t border-line mb-10">
            {VERSIONS.map(note => (
              <li key={note.version} className="py-3 border-b border-line flex gap-4">
                <div className="w-24 flex-shrink-0">
                  <p className="type-data">{note.version}</p>
                  <p className="type-data text-muted">{note.date}</p>
                </div>
                <div className="text-sm leading-normal">
                  {note.lines.map(line => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={onNavigateToHeadsUp}
            className="text-sm text-muted underline active:opacity-70"
          >
            Seen something weird? Send feedback.
          </button>
        </section>

      </div>
    </div>
  );
}
