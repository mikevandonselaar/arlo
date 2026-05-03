'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // pas aan naar jouw supabase client pad
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const supabase = createClient()

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type AuthView = 'login' | 'signup' | 'forgot-password' | 'check-email'

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const router = useRouter()

  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  const clearMessages = () => {
    setError(null)
    setMessage(null)
  }

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  // --- Email/password login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Supabase stuurt "Email not confirmed" terug als de email niet bevestigd is
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Your email address has not been confirmed yet.')
        // Toon optie om bevestigingsmail opnieuw te sturen (zie JSX hieronder)
      } else {
        setError(error.message)
      }
    } else {
      router.push('/') // pas aan naar jouw post-login route
    }

    setLoading(false)
  }

  // --- Sign up (geen username) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      // Geen user_metadata.username — username is verwijderd uit de flow
    })

    if (error) {
      setError(error.message)
    } else {
      setView('check-email')
    }

    setLoading(false)
  }

  // --- Google OAuth ---
  // Vereiste Supabase-stap (eenmalig in dashboard):
  //   Authentication → Providers → Google → Enable
  //   Redirect URL toevoegen: https://<jouw-vercel-domein>/auth/callback
  //   Lokaal: http://localhost:5173/auth/callback
  const handleGoogleLogin = async () => {
    clearMessages()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
    // bij succes redirect Supabase zelf naar redirectTo
    setLoading(false)
  }

  // --- Resend bevestigingsmail ---
  const handleResendConfirmation = async () => {
    clearMessages()
    setLoading(true)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Confirmation email sent — check your inbox.')
    }

    setLoading(false)
  }

  // --- Forgot password ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Reset link sent — check your inbox.')
    }

    setLoading(false)
  }

  // -------------------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------------------
  const isEmailNotConfirmedError =
    error?.toLowerCase().includes('email not confirmed') ||
    error?.toLowerCase().includes('not confirmed')

  // -------------------------------------------------------------------------
  // VIEWS
  // -------------------------------------------------------------------------

  if (view === 'check-email') {
    return (
      <div style={styles.container}>
        <h1 style={styles.logo}>arlo.</h1>
        <p style={styles.body}>Check your inbox to confirm your email address.</p>
        <button style={styles.linkBtn} onClick={() => setView('login')}>
          Back to login
        </button>
      </div>
    )
  }

  if (view === 'forgot-password') {
    return (
      <div style={styles.container}>
        <h1 style={styles.logo}>arlo.</h1>
        <h2 style={styles.heading}>Reset password</h2>

        <form onSubmit={handleForgotPassword} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <button style={styles.primaryBtn} type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link →'}
          </button>
        </form>

        <button style={styles.linkBtn} onClick={() => { clearMessages(); setView('login') }}>
          Back to login
        </button>
      </div>
    )
  }

  // Login / Signup (gedeeld formulier, view bepaalt gedrag)
  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>arlo.</h1>

      {/* Tab toggle */}
      <div style={styles.tabRow}>
        <button
          style={{ ...styles.tab, ...(view === 'login' ? styles.tabActive : {}) }}
          onClick={() => { clearMessages(); setView('login') }}
        >
          log in
        </button>
        <button
          style={{ ...styles.tab, ...(view === 'signup' ? styles.tabActive : {}) }}
          onClick={() => { clearMessages(); setView('signup') }}
        >
          sign up
        </button>
      </div>

      <form onSubmit={view === 'login' ? handleLogin : handleSignUp} style={styles.form}>
        {/* Email */}
        <input
          style={styles.input}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        {/* Password */}
        <input
          style={styles.input}
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={view === 'login' ? 'current-password' : 'new-password'}
        />

        {/* Foutmelding */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Resend bevestigingsmail — alleen tonen als het die specifieke fout is */}
        {isEmailNotConfirmedError && (
          <button
            type="button"
            style={styles.linkBtn}
            onClick={handleResendConfirmation}
            disabled={loading}
          >
            Resend confirmation email
          </button>
        )}

        {message && <p style={styles.success}>{message}</p>}

        {/* Primary CTA */}
        <button style={styles.primaryBtn} type="submit" disabled={loading}>
          {loading ? '…' : view === 'login' ? 'log in →' : 'sign up →'}
        </button>
      </form>

      {/* Forgot password — alleen bij login */}
      {view === 'login' && (
        <button
          style={styles.linkBtn}
          onClick={() => { clearMessages(); setView('forgot-password') }}
        >
          Forgot password?
        </button>
      )}

      {/* Divider */}
      <div style={styles.divider}>
        <span style={styles.dividerLine} />
        <span style={styles.dividerText}>or</span>
        <span style={styles.dividerLine} />
      </div>

      {/* Google OAuth */}
      {/* TODO-SETUP: Google provider moet enabled zijn in Supabase dashboard
          Authentication → Providers → Google → Enable
          Redirect URLs: https://<domein>/auth/callback en http://localhost:5173/auth/callback */}
      <button
        style={styles.googleBtn}
        onClick={handleGoogleLogin}
        disabled={loading}
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginRight: 8 }}>
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// STYLES — inline zodat het bestand standalone werkt zonder extra CSS
// Vervang door jouw Tailwind/CSS-modules patronen als dat de huidige aanpak is
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#651610',
    padding: '24px',
    gap: '12px',
  },
  logo: {
    fontFamily: "'Sugo Pro Display', serif",
    fontSize: 40,
    fontWeight: 700,
    color: '#FFC8FF',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
  },
  heading: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: '#FFC8FF',
    margin: 0,
  },
  tabRow: {
    display: 'flex',
    gap: 0,
    backgroundColor: 'rgba(255,200,255,0.12)',
    borderRadius: 12,
    padding: 3,
    width: '100%',
    maxWidth: 360,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: 9,
    backgroundColor: 'transparent',
    color: 'rgba(255,200,255,0.5)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    backgroundColor: '#FFC8FF',
    color: '#651610',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    maxWidth: 360,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,200,255,0.2)',
    backgroundColor: 'rgba(255,200,255,0.08)',
    color: '#FFC8FF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%',
    padding: '13px 0',
    borderRadius: 20,
    border: 'none',
    backgroundColor: '#FFC8FF',
    color: '#651610',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 4,
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
    padding: '12px 0',
    borderRadius: 20,
    border: '1px solid rgba(255,200,255,0.25)',
    backgroundColor: 'rgba(255,200,255,0.06)',
    color: '#FFC8FF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,200,255,0.6)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 0',
    textDecoration: 'underline',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 360,
    margin: '4px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,200,255,0.15)',
  },
  dividerText: {
    color: 'rgba(255,200,255,0.4)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 12,
  },
  error: {
    color: '#ffaaaa',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    margin: 0,
  },
  success: {
    color: '#aaffcc',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    margin: 0,
  },
  body: {
    color: '#FFC8FF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    textAlign: 'center',
    margin: 0,
  },
}
