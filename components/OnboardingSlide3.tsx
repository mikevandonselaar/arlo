// components/onboarding/OnboardingSlide3.tsx
// Slide 3 — Follow slide
// Vervangt het huidige "follow us for updates" scherm
// Basis: #EDF0F5 (Greyish Blue) + grote soft pink ellips rechtsboven
// Specs: Creative Direction Confluence v7, goedgekeurd 3 mei 2026

import React from 'react'

interface OnboardingSlide3Props {
  onSkip: () => void // navigeert naar hoofdscherm
}

// Social card data
const SOCIAL_CARDS = [
  {
    platform: 'Instagram',
    handle: '@arlo.shop',
    url: 'https://instagram.com/arlo.shop',
    icon: (
      // Instagram SVG icon — simpel outline variant
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#651610" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="#651610" stroke="none"/>
      </svg>
    ),
  },
  {
    platform: 'TikTok',
    handle: '@arlo.shop',
    url: 'https://tiktok.com/@arlo.shop',
    icon: (
      // TikTok SVG icon
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#651610">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/>
      </svg>
    ),
  },
]

export default function OnboardingSlide3({ onSkip }: OnboardingSlide3Props) {
  const handleCardPress = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={styles.container}>
      {/* SVG achtergrond
          - Grote soft pink ellips rechtsboven: #FFC8FF, opacity 0.6 — prominent
          - Kleine deep red ellips linksmidden: #651610, opacity 0.04
          - Fade onderste helft naar #EDF0F5
      */}
      <svg
        style={styles.backgroundSvg}
        viewBox="0 0 190 230"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="slide3-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="50%" stopColor="#EDF0F5" stopOpacity="0" />
            <stop offset="100%" stopColor="#EDF0F5" stopOpacity="1" />
          </linearGradient>
        </defs>

        <rect width="190" height="230" fill="#EDF0F5" />

        {/* Grote soft pink ellips rechtsboven — prominent (opacity 0.6) */}
        <ellipse cx="170" cy="30" rx="110" ry="90" fill="#FFC8FF" fillOpacity="0.6" />

        {/* Kleine deep red ellips linksmidden — subtiel (opacity 0.04) */}
        <ellipse cx="20" cy="130" rx="60" ry="45" fill="#651610" fillOpacity="0.04" />

        {/* Fade overlay onderste helft */}
        <rect width="190" height="230" fill="url(#slide3-fade)" />
      </svg>

      {/* Content */}
      <div style={styles.content}>
        {/* Eyebrow */}
        <p style={styles.eyebrow}>we're just getting started</p>

        {/* Hoofdkop */}
        <h1 style={styles.heading}>watch arlo. grow.</h1>

        {/* Subtekst */}
        <p style={styles.subtext}>Updates, mess-ups and milestones — follow along.</p>

        {/* Social cards */}
        <div style={styles.cardsContainer}>
          {SOCIAL_CARDS.map((card) => (
            <button
              key={card.platform}
              style={styles.card}
              onClick={() => handleCardPress(card.url)}
              type="button"
            >
              {/* Icon vlak — 26x26px, #FFC8FF achtergrond, border-radius 8 */}
              <div style={styles.iconWrap}>
                {card.icon}
              </div>

              {/* Tekst */}
              <div style={styles.cardText}>
                <span style={styles.cardName}>{card.platform}</span>
                <span style={styles.cardHandle}>{card.handle}</span>
              </div>

              {/* Pijl rechts */}
              <span style={styles.arrow}>→</span>
            </button>
          ))}
        </div>

        {/* Skip link — klein, 40% opacity, geen knop */}
        <button style={styles.skipLink} onClick={onSkip} type="button">
          skip →
        </button>
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
    backgroundColor: '#EDF0F5',
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
    padding: '0 28px 48px',
    gap: 14,
  },
  eyebrow: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: '#651610',
    opacity: 0.55,
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
    color: 'rgba(101,22,16,0.65)',
    margin: '0 0 6px',
    lineHeight: 1.5,
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  // Card opmaak per spec: wit, 0.5px border, border-radius 12, padding 9 11
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    border: '0.5px solid rgba(101,22,16,0.10)',
    borderRadius: 12,
    padding: '9px 11px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  // Icon vlak: 26x26, border-radius 8, #FFC8FF achtergrond
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFC8FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    flex: 1,
  },
  cardName: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    color: '#651610',
    letterSpacing: '0.01em',
  },
  cardHandle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 8,
    fontWeight: 400,
    color: '#651610',
    opacity: 0.5,
  },
  arrow: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: '#651610',
    opacity: 0.35,
    flexShrink: 0,
  },
  // Skip link — 8-9px, #651610, opacity 40%
  skipLink: {
    background: 'none',
    border: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 9,
    fontWeight: 600,
    color: '#651610',
    opacity: 0.4,
    cursor: 'pointer',
    padding: '4px 0',
    alignSelf: 'center',
    letterSpacing: '0.03em',
  },
}
