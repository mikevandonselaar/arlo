// components/ProfilePage.tsx
// Profile pagina — alpha aanpassingen 3 mei 2026
//
// VERWIJDERD:
//   - Your Closet (komt terug post-alpha, zie F3)
//   - Username veld
//   - Theme toggle (Light / Dark)
//   - My Orders sectie (komt terug post-alpha, zie F4)
//
// BEHOUDEN:
//   - Currency selector (GBP / EUR / USD)
//   - Email + wachtwoord velden
//   - Set Email & Password knop
//   - Link Google Account knop
//
// TOEGEVOEGD:
//   - Header "hey, you." — Sugo Pro Display, #651610
//   - Sub-header "arlo. alpha · v0.1"
//   - Section label "settings" (was: "Preferences")
//   - Footer link "seen something weird? tell us." → linkt naar HeadsUp scherm

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // pas aan naar jouw pad
import { useRouter } from 'next/navigation'

const supabase = createClient()

type Currency = 'GBP' | 'EUR' | 'USD'

interface ProfilePageProps {
  onNavigateToHeadsUp: () => void // navigeert naar HeadsUpScreen
}

export default function ProfilePage({ onNavigateToHeadsUp }: ProfilePageProps) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // --- Set email & password ---
  const handleSetCredentials = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)

    const updates: { email?: string; password?: string } = {}
    if (email) updates.email = email
    if (password) updates.password = password

    if (Object.keys(updates).length === 0) {
      setError('Fill in at least one field.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Updated successfully.')
      setEmail('')
      setPassword('')
    }

    setLoading(false)
  }

  // --- Link Google account ---
  const handleLinkGoogle = async () => {
    setLoading(true)
    setError(null)

    // TODO-SETUP: Google provider moet enabled zijn in Supabase dashboard
    const { error } = await supabase.auth.linkIdentity({ provider: 'google' })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      {/* Header — "hey, you." */}
      <div style={styles.headerBlock}>
        <h1 style={styles.greeting}>hey, you.</h1>
        <p style={styles.versionTag}>arlo. alpha · v0.1</p>
      </div>

      {/* Section — settings (lowercase, was: Preferences) */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>settings</p>

        {/* Currency selector */}
        <div style={styles.settingRow}>
          <span style={styles.settingName}>Currency</span>
          <div style={styles.currencyToggle}>
            {(['GBP', 'EUR', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                style={{
                  ...styles.currencyBtn,
                  ...(currency === c ? styles.currencyBtnActive : {}),
                }}
                onClick={() => setCurrency(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section — account */}
      <div style={styles.section}>
        <p style={styles.sectionLabel}>account</p>

        <input
          style={styles.input}
          type="email"
          placeholder="new email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          style={styles.input}
          type="password"
          placeholder="new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        {/* Set Email & Password */}
        <button
          style={styles.primaryBtn}
          onClick={handleSetCredentials}
          disabled={loading}
          type="button"
        >
          {loading ? 'Saving…' : 'Set Email & Password'}
        </button>

        {/* Link Google Account */}
        <button
          style={styles.secondaryBtn}
          onClick={handleLinkGoogle}
          disabled={loading}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ marginRight: 8 }}>
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Link Google Account
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer link — "seen something weird? tell us." */}
      <button
        style={styles.footerLink}
        onClick={onNavigateToHeadsUp}
        type="button"
      >
        seen something weird? tell us.
      </button>
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
    padding: '52px 24px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  headerBlock: {
    marginBottom: 4,
  },
  // "hey, you." — Sugo Pro Display, #651610
  greeting: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 40,
    fontWeight: 700,
    color: '#651610',
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
  },
  // "arlo. alpha · v0.1" — klein, muted
  versionTag: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 12,
    color: 'rgba(101,22,16,0.4)',
    margin: 0,
    letterSpacing: '0.02em',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  // "settings" — lowercase section label
  sectionLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(101,22,16,0.45)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '14px 16px',
    border: '0.5px solid rgba(101,22,16,0.08)',
  },
  settingName: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: '#651610',
    fontWeight: 500,
  },
  currencyToggle: {
    display: 'flex',
    gap: 4,
    backgroundColor: 'rgba(101,22,16,0.06)',
    borderRadius: 8,
    padding: 3,
  },
  currencyBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'rgba(101,22,16,0.45)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  currencyBtnActive: {
    backgroundColor: '#651610',
    color: '#FFC8FF',
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: 10,
    border: '0.5px solid rgba(101,22,16,0.15)',
    backgroundColor: '#ffffff',
    color: '#651610',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%',
    padding: '13px 0',
    borderRadius: 20,
    border: 'none',
    backgroundColor: '#651610',
    color: '#FFC8FF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px 0',
    borderRadius: 20,
    border: '0.5px solid rgba(101,22,16,0.2)',
    backgroundColor: 'transparent',
    color: '#651610',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  // Footer link — #651610
  footerLink: {
    background: 'none',
    border: 'none',
    color: '#651610',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 0',
    textDecoration: 'underline',
    alignSelf: 'center',
    opacity: 0.7,
  },
  error: {
    color: '#b91c1c',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    margin: 0,
  },
  success: {
    color: '#166534',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    margin: 0,
  },
}
