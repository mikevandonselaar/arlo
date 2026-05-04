import { useState } from 'react';

interface Props {
  onBack: () => void;
}

const DISCLAIMERS = [
  'Not all garments can be found online.',
  'Prices may need manual correction.',
  'Works with retailers that sell online only.',
  'Payments not in app yet — coming soon.',
  'Delivery handled by retailer directly.',
];

export default function HeadsUpScreen({ onBack }: Props) {
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-[#EDF0F5] overflow-y-auto">
      <div className="p-5 pb-10">

        {/* Back */}
        <button
          onClick={onBack}
          className="mb-4 text-[12px] active:opacity-50 transition-opacity"
          style={{ color: 'rgba(101,22,16,0.5)' }}
        >
          ← back
        </button>

        {/* Eyebrow */}
        <p
          className="text-[9px] font-bold lowercase mb-[6px]"
          style={{ color: 'rgba(101,22,16,0.5)', letterSpacing: '0.72px' }}
        >
          heads up.
        </p>

        {/* Heading */}
        <h1 className="text-[22px] font-black leading-[28px] mb-[10px]" style={{ color: '#651610' }}>
          alpha means rough edges.
        </h1>

        {/* Subtext */}
        <p
          className="text-[11px] leading-[17px] mb-4"
          style={{ color: 'rgba(101,22,16,0.65)' }}
        >
          We're still building. Things might break, look weird, or not work at all.
        </p>

        {/* Disclaimer block */}
        <div
          className="rounded-[10px] p-3 mb-4"
          style={{ backgroundColor: 'rgba(101,22,16,0.04)' }}
        >
          {DISCLAIMERS.map((item) => (
            <p
              key={item}
              className="text-[10px] leading-[18px]"
              style={{ color: 'rgba(101,22,16,0.72)' }}
            >
              · {item}
            </p>
          ))}
          <p
            className="text-[10px] leading-[18px] italic mt-1"
            style={{ color: 'rgba(101,22,16,0.55)' }}
          >
            · This is early alpha — rough edges expected.
          </p>
        </div>

        {/* What's new — collapsible */}
        <button
          onClick={() => setWhatsNewOpen(o => !o)}
          className="w-full text-left rounded-[8px] p-[10px] mb-2 bg-[#F5F6F8]"
        >
          <span className="text-[11px] font-semibold" style={{ color: '#651610' }}>
            {whatsNewOpen ? '▾' : '▸'} what's new
          </span>
        </button>
        {whatsNewOpen && (
          <div className="px-[10px] mb-4">
            {/* TODO-VOLGENDE-FASE: vul met changelog data */}
            <p className="text-[11px]" style={{ color: 'rgba(101,22,16,0.5)' }}>
              Geen updates beschikbaar.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-[12px] p-3 mt-2 bg-[#EDF0F5]">
          <a
            href="mailto:?subject=Arlo%20feedback"
            /* TODO-VOLGENDE-FASE: koppel aan feedback-formulier of mailto */
            className="flex items-center justify-center rounded-[10px] py-[13px] active:opacity-80 transition-opacity"
            style={{ backgroundColor: '#651610' }}
          >
            <span className="text-[13px] font-bold" style={{ color: '#FFC8FF' }}>
              Send Feedback →
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}
