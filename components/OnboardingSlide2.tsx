// components/onboarding/OnboardingSlide2.tsx
// Slide 2 — Community Join screen
// Vervangt het huidige "Join Waitlist" scherm volledig
// Roze basis (#FFC8FF) + deep red ellips-accenten
// Specs: Creative Direction Confluence v7, goedgekeurd 3 mei 2026

import React from 'react'

// ---------------------------------------------------------------------------
// HARDCODED CONSTANTEN — aanpassen bij elke release, niet dynamisch ophalen
// ---------------------------------------------------------------------------
const MEMBER_COUNT = 233
const ITEMS_SCANNED = 1840
const ITEMS_DELIVERED = 47

interface OnboardingSlide2Props {
  onJoin: () => void // 1 tap = direct lid + navigeer naar hoofdscherm
}

export default function OnboardingSlide2({ onJoin }: OnboardingSlide2Props) {
  return (
    <div style={styles.container}>
      {/* SVG achtergrond
          Ellips-posities uit Creative Direction (Confluence v7):
          - Rechtsboven:  cx=165, cy=38,  rx=95, ry=78,  op=0.10
          - Linksmidden:  cx=18,  cy=135, rx=72, ry=55,  op=0.07
          - Rechtsonder:  cx=172, cy=175, rx=60, ry=50,  op=0.06
      */}
      <svg
        style={styles.backgroundSvg}
        viewBox="0 0 190 230"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="190" height="230" fill="#FFC8FF" />
        <ellipse cx="165" cy="38"  rx="95" ry="78" fill="#651610" fillOpacity="0.10" />
        <ellipse cx="18"  cy="135" rx="72" ry="55" fill="#651610" fillOpacity="0.07" />
        <ellipse cx="172" cy="175" rx="60" ry="50" fill="#651610" fillOpacity="0.06" />
      </svg>

      {/* Content */}
      <div style={styles.content}>
        {/* Eyebrow */}
        <p style={styles.eyebrow}>join the community</p>

        {/* Hoofdkop — MEMBER_COUNT is constante */}
        <h1 style={styles.heading}>{MEMBER_COUNT} have already joined.</h1>

        {/* Subtekst */}
        <p style={styles.subtext}>
          Scan any garment. If it's online, arlo. brings it home.
        </p>

        {/* Stats-balk
            Opmaak per spec: rgba(101,22,16,0.08) bg, border-radius 12, padding 10 12
            Flex gelijke kolommen, verticale divider rgba(101,22,16,0.18)
        */}
        <div style={styles.statsBar}>
          <div style={styles.statCol}>
            <span style={styles.statNumber}>{ITEMS_SCANNED.toLocaleString('en-US')}</span>
            <span style={styles.statLabel}>items scanned</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCol}>
            <span style={styles.statNumber}>{MEMBER_COUNT}</span>
            <span style={styles.statLabel}>active members</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCol}>
            <span style={styles.statNumber}>{ITEMS_DELIVERED}</span>
            <span style={styles.statLabel}>items delivered</span>
          </div>
        </div>

        {/* CTA knop gewrapped in #EDF0F5 pill
            ⚠️ Kleuren ALTIJD expliciet — nooit via inheritance */}
        <div style={styles.btnWrapper}>
          <button
            style={styles.joinBtn}
            onClick={onJoin}
          >
            join arlo. →
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#FFC8FF',
  },
  backgroundSvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    padding: '0 28px 52px',
    gap: 16,
  },
  eyebrow: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: '#651610',
    opacity: 0.6,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  },
  heading: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 34,
    fontWeight: 700,
    color: '#651610',
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.3px',
  },
  subtext: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    fontWeight: 400,
    color: 'rgba(101,22,16,0.75)',
    margin: 0,
    lineHeight: 1.5,
  },
  statsBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(101,22,16,0.08)',
    borderRadius: 12,
    padding: '10px 12px',
  },
  statCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#651610',
  },
  statLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 9,
    fontWeight: 500,
    color: 'rgba(101,22,16,0.55)',
    textAlign: 'center',
    letterSpacing: '0.03em',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(101,22,16,0.18)',
    margin: '0 4px',
  },
  // Outer pill wrapper — #EDF0F5
  btnWrapper: {
    backgroundColor: '#EDF0F5',
    borderRadius: 22,
    padding: 3,
    marginTop: 4,
  },
  // ⚠️ Expliciete kleuren — backgroundColor en color NOOIT via inheritance
  joinBtn: {
    backgroundColor: '#651610',
    color: '#FFC8FF',
    border: 'none',
    borderRadius: 20,
    paddingTop: 11,
    paddingBottom: 11,
    width: '100%',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.2px',
    alignItems: 'center',
    display: 'block',
    textAlign: 'center',
  },
}
