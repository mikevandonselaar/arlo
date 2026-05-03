// components/onboarding/OnboardingSlide1.tsx
// Slide 1 — Welcome screen
// Achtergrond: Concept C — Deep Red basis (#651610) + zachte #FFC8FF ellips-accenten
// Copy: Variant B (goedgekeurd Marketing 3 mei 2026)

import React from 'react'

interface OnboardingSlide1Props {
  onNext: () => void
}

export default function OnboardingSlide1({ onNext }: OnboardingSlide1Props) {
  return (
    <div style={styles.container}>
      {/* SVG achtergrond — Concept C
          Ellips-posities uit Creative Direction (Confluence v7):
          - Rechtsboven: cx=120, cy=40, rx=90, ry=75
          - Linksmidden: cx=30, cy=130, rx=70, ry=55
          - Rechtsonder: cx=140, cy=170, rx=60, ry=50
          Fade: onderste 40% volledig naar #651610 via linearGradient
      */}
      <svg
        style={styles.backgroundSvg}
        viewBox="0 0 180 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Verticale fade — onderste 40% naar solid #651610 */}
          <linearGradient id="slide1-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="60%" stopColor="#651610" stopOpacity="0" />
            <stop offset="100%" stopColor="#651610" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Basis achtergrond */}
        <rect width="180" height="220" fill="#651610" />

        {/* Ellips rechtsboven — 10% opacity */}
        <ellipse cx="120" cy="40" rx="90" ry="75" fill="#FFC8FF" fillOpacity="0.10" />

        {/* Ellips linksmidden — 8% opacity */}
        <ellipse cx="30" cy="130" rx="70" ry="55" fill="#FFC8FF" fillOpacity="0.08" />

        {/* Ellips rechtsonder — 7% opacity */}
        <ellipse cx="140" cy="170" rx="60" ry="50" fill="#FFC8FF" fillOpacity="0.07" />

        {/* Fade overlay */}
        <rect width="180" height="220" fill="url(#slide1-fade)" />
      </svg>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.logoMark}>
          <span style={styles.logoText}>arlo.</span>
        </div>

        <div style={styles.copyBlock}>
          {/* Titel — Variant B */}
          <h1 style={styles.title}>welcome to arlo.</h1>

          {/* Subtekst — Variant B (goedgekeurd) */}
          <p style={styles.subtitle}>
            Physical shopping, evolved. Walk in, scan what catches your eye, and let arlo handle the rest. Join the people changing how fashion moves.
          </p>
        </div>

        {/* CTA — ongewijzigd per spec */}
        <button style={styles.cta} onClick={onNext}>
          Start scanning →
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
    backgroundColor: '#651610',
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
    gap: 24,
  },
  logoMark: {
    marginBottom: 'auto',
    paddingTop: 60,
  },
  logoText: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: '#FFC8FF',
  },
  copyBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  title: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 36,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.75)',
    margin: 0,
    lineHeight: 1.55,
    // Max 2 regels zichtbaar zonder scrollen — gebruik WebkitLineClamp in productie
    // als de tekst container smaller is
  },
  cta: {
    // Expliciete kleuren — nooit via inheritance
    backgroundColor: '#FFC8FF',
    color: '#651610',
    border: 'none',
    borderRadius: 20,
    padding: '14px 0',
    width: '100%',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.2px',
  },
}
