import { useState } from 'react';

const WHATS_NEW: string[] = [];

interface Props {
  onBack: () => void;
}

const DISCLAIMERS = [
  'Not all garments can be found online.',
  'Prices may need manual correction.',
  'Works with stores that sell online only.',
  'Payments are not in the app yet.',
  'Delivery is handled by the store.',
  'This is an early alpha. Not everything works yet.',
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
          ← Back
        </button>

        {/* Eyebrow */}
        <p className="type-data text-muted mb-[6px]">
          Heads up
        </p>

        {/* Heading */}
        <h1 className="text-[22px] font-medium leading-[28px] mb-[10px]">
          Alpha means rough edges.
        </h1>

        {/* Subtext */}
        <p className="text-[11px] leading-[17px] text-muted mb-4">
          Still being built. Things might break, look weird or not work at all.
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
                {whatsNewOpen ? '▾' : '▸'} What's new
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
              Send feedback
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}
