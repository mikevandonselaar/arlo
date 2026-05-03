// components/HeadsUpScreen.tsx
// Vervangt het bestaande "glitches & feedback" scherm
// Twee uitklapbare blokken: "using arlo." (standaard open) + "what's new" (standaard dicht)
// Backlog ref: M1 | Status: Wacht op GM-akkoord | Fase: Alpha

'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// DATA — copy goedgekeurd Marketing sessie 3 mei 2026
// ---------------------------------------------------------------------------
const DISCLAIMERS = [
  'For best results, take a clear photo of the label — make sure the barcode is fully visible.',
  'Prices are usually pulled automatically, but may occasionally need a manual correction.',
  'arlo. only works with retailers that sell online — we match your scan to their webshop.',
  'Location accuracy depends on your device permissions.',
  "Payments aren't in the app yet — coming soon.",
  'Delivery is handled by the retailer directly.',
  'This is early alpha — rough edges expected.',
]

// Wordt gevuld bij elke release — patch notes chronologisch (meest recent bovenaan)
// Format per item: { version: string, date: string, notes: string[] }
const PATCH_NOTES: { version: string; date: string; notes: string[] }[] = []
// Voorbeeld voor volgende release:
// { version: 'v0.2', date: '10 mei 2026', notes: ['Fixed barcode scanner crash on iOS 17', 'Improved price accuracy'] }

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function HeadsUpScreen() {
  const [disclaimersOpen, setDisclaimersOpen] = useState(true)   // standaard open
  const [patchNotesOpen, setPatchNotesOpen] = useState(false)    // standaard dicht

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>heads up.</h1>
        <p style={styles.headerSub}>Good to know before you dive in.</p>
      </div>

      {/* Blok 1 — "using arlo." — standaard open */}
      <AccordionBlock
        title="using arlo."
        isOpen={disclaimersOpen}
        onToggle={() => setDisclaimersOpen((v) => !v)}
      >
        <ul style={styles.list}>
          {DISCLAIMERS.map((item, i) => (
            <li key={i} style={styles.listItem}>
              <span style={styles.bullet}>·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </AccordionBlock>

      {/* Blok 2 — "what's new" — standaard dicht */}
      <AccordionBlock
        title="what's new"
        isOpen={patchNotesOpen}
        onToggle={() => setPatchNotesOpen((v) => !v)}
      >
        {PATCH_NOTES.length === 0 ? (
          <p style={styles.emptyState}>no updates yet — check back soon.</p>
        ) : (
          PATCH_NOTES.map((release) => (
            <div key={release.version} style={styles.releaseBlock}>
              <p style={styles.releaseHeader}>
                {release.version} · {release.date}
              </p>
              <ul style={styles.list}>
                {release.notes.map((note, i) => (
                  <li key={i} style={styles.listItem}>
                    <span style={styles.bullet}>·</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </AccordionBlock>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ACCORDION BLOCK
// ---------------------------------------------------------------------------
function AccordionBlock({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={styles.accordionBlock}>
      <button style={styles.accordionHeader} onClick={onToggle} type="button">
        <span style={styles.accordionTitle}>{title}</span>
        <span style={{ ...styles.accordionChevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ↓
        </span>
      </button>

      {isOpen && (
        <div style={styles.accordionBody}>
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#EDF0F5',
    padding: '48px 24px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 36,
    fontWeight: 700,
    color: '#651610',
    margin: '0 0 6px',
    letterSpacing: '-0.3px',
  },
  headerSub: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: 'rgba(101,22,16,0.55)',
    margin: 0,
  },
  accordionBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    border: '0.5px solid rgba(101,22,16,0.08)',
  },
  accordionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 18px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  accordionTitle: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#651610',
    letterSpacing: '-0.1px',
  },
  accordionChevron: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: '#651610',
    opacity: 0.5,
    transition: 'transform 0.2s ease',
    display: 'inline-block',
  },
  accordionBody: {
    padding: '0 18px 18px',
    borderTop: '0.5px solid rgba(101,22,16,0.06)',
  },
  list: {
    listStyle: 'none',
    margin: '12px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  listItem: {
    display: 'flex',
    gap: 10,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: 'rgba(101,22,16,0.75)',
    lineHeight: 1.5,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#651610',
    opacity: 0.4,
    flexShrink: 0,
    marginTop: 1,
    fontWeight: 700,
  },
  emptyState: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    color: 'rgba(101,22,16,0.4)',
    margin: '12px 0 0',
    fontStyle: 'italic',
  },
  releaseBlock: {
    marginTop: 14,
  },
  releaseHeader: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: '#651610',
    opacity: 0.5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: '0 0 6px',
  },
}
