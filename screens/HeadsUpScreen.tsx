import { useState } from 'react';

const WHATS_NEW: string[] = [];

interface Props {
  onBack: () => void;
}

const DISCLAIMERS = [
  'Niet elk kledingstuk is online te vinden.',
  'Prijzen moet je soms zelf aanpassen.',
  'Werkt alleen met winkels die online verkopen.',
  'Betalen kan nog niet in de app.',
  'De winkel verzorgt de bezorging.',
  'Dit is een vroege alpha. Niet alles werkt al goed.',
];

export default function HeadsUpScreen({ onBack }: Props) {
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-bg text-ink overflow-y-auto">
      <div className="p-5 pb-10">

        {/* Back */}
        <button
          onClick={onBack}
          className="mb-4 text-xs text-muted active:opacity-70"
        >
          ← Terug
        </button>

        {/* Eyebrow */}
        <p className="type-data text-muted mb-[6px]">
          Goed om te weten
        </p>

        {/* Heading */}
        <h1 className="text-[22px] font-medium leading-[28px] mb-[10px]">
          Alpha: nog niet alles werkt.
        </h1>

        {/* Subtext */}
        <p className="text-[11px] leading-[17px] text-muted mb-4">
          Er wordt nog gebouwd. Dingen kunnen stukgaan, er vreemd uitzien of niet werken.
        </p>

        {/* Disclaimer block */}
        <div className="border border-line rounded-sm p-3 mb-4">
          {DISCLAIMERS.map((item) => (
            <p key={item} className="text-[10px] leading-[18px] text-muted">
              · {item}
            </p>
          ))}
        </div>

        {/* What's new — collapsible; hidden when empty */}
        {WHATS_NEW.length > 0 && (
          <>
            <button
              onClick={() => setWhatsNewOpen(o => !o)}
              className="w-full text-left border border-line rounded-sm p-[10px] mb-2"
            >
              <span className="text-[11px] font-medium">
                {whatsNewOpen ? '▾' : '▸'} Nieuw
              </span>
            </button>
            {whatsNewOpen && (
              <div className="px-[10px] mb-4">
                {WHATS_NEW.map((item) => (
                  <p key={item} className="text-[11px] text-muted">
                    · {item}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-2">
          <a
            href="mailto:?subject=utan%20feedback"
            /* TODO-VOLGENDE-FASE: koppel aan feedback-formulier of mailto */
            className="flex items-center justify-center rounded-sm bg-accent text-on-accent py-[13px] active:opacity-70"
          >
            <span className="text-[13px] font-medium">
              Stuur feedback
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}
