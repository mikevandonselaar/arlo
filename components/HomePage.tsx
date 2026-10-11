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
  'Maak een scherpe foto van het label. De barcode moet helemaal zichtbaar zijn.',
  'De prijs wordt meestal automatisch ingevuld. Soms moet je hem zelf aanpassen.',
  'utan werkt alleen met winkels die ook online verkopen. Je scan wordt gekoppeld aan hun webshop.',
  'Hoe nauwkeurig je locatie is, hangt af van de instellingen van je toestel.',
  'Betalen kan nog niet in de app. Dat komt later.',
  'De winkel verzorgt de bezorging.',
  'Dit is een vroege alpha. Niet alles werkt al goed.',
];

const VERSIONS = [
  { version: 'v0.3', date: '3 mei 2026', lines: ['Community-scherm live', 'Onboarding vernieuwd', 'Volg-slide bijgewerkt'] },
  { version: 'v0.2', date: 'april 2026', lines: ['Winkelmand toegevoegd', 'Profielscherm live'] },
  { version: 'v0.1', date: 'eerste alpha', lines: ['App intern gelanceerd'] },
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
            {city ?? 'Zoeken'}
          </span>
        </div>
      </div>

      {/* One scrollable page: welcome first, "what to expect" below the fold */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* Welcome — fills the screen, content anchored to the bottom */}
        <section className="min-h-full flex flex-col justify-end px-6 pt-10 pb-8">
          <h1 className="type-hero mb-5">
            Welkom bij utan.
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Loop een winkel in, scan wat je wilt hebben en utan regelt de rest.
          </p>
          <div className="space-y-3">
            <button
              onClick={onStartScanning}
              className="block w-full h-14 rounded-sm bg-accent text-on-accent text-base font-medium active:opacity-70"
            >
              Start met scannen
            </button>
            <button
              onClick={scrollToExpect}
              className="block w-full h-14 rounded-sm border border-ink text-ink text-base font-medium active:opacity-70"
            >
              Wat je kunt verwachten
            </button>
          </div>
        </section>

        {/* What to expect — known issues and versions */}
        <section ref={expectRef} className="px-6 pt-8 pb-10 border-t border-line">
          <h2 className="text-3xl font-medium leading-[1.1] tracking-[-0.02em] mb-8">
            Wat je kunt verwachten
          </h2>

          <p className="type-data text-muted mb-3">Goed om te weten</p>
          <ul className="border-t border-line mb-10">
            {KNOWN_ISSUES.map(item => (
              <li key={item} className="py-3 border-b border-line text-sm leading-normal">
                {item}
              </li>
            ))}
          </ul>

          <p className="type-data text-muted mb-3">Versies</p>
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
            Iets vreemds gezien? Stuur feedback.
          </button>
        </section>

      </div>
    </div>
  );
}
