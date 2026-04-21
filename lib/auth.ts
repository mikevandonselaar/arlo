import { supabase } from './supabase';

// ─── Username localStorage ────────────────────────────────────────────────────

const USERNAME_KEY = 'arlo-username';

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function setStoredUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearStoredUsername(): void {
  localStorage.removeItem(USERNAME_KEY);
}

// ─── Username validation + availability ───────────────────────────────────────

/** 3–20 chars: lowercase letters, digits, underscores. */
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/**
 * Returns true when the username passes the format rule AND is not already
 * in the profiles table.  The profiles table has a public-read RLS policy
 * so this query works before the user has a session.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!USERNAME_REGEX.test(username)) return false;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  return data === null;
}

// ─── Account creation (first launch) ─────────────────────────────────────────

/**
 * Creates a new anonymous Supabase session, inserts a profile row with the
 * chosen username, and caches the username in localStorage.
 * Called when there is no existing session (brand-new user).
 */
export async function createAccountWithUsername(username: string): Promise<void> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, username });

  if (profileError) {
    await supabase.auth.signOut();
    throw new Error(`Could not save username: ${profileError.message}`);
  }

  setStoredUsername(username);
}

/**
 * Saves a username for a user who already has a session (e.g. after Google
 * OAuth first sign-in, where no profile row exists yet).
 */
export async function addUsernameToExistingSession(username: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No active session');

  const { error } = await supabase
    .from('profiles')
    .insert({ id: user.id, username });

  if (error) throw new Error(`Could not save username: ${error.message}`);
  setStoredUsername(username);
}

// ─── Sign in (returning users) ────────────────────────────────────────────────

/**
 * Signs in with email + password.  Loads the username from the profiles table
 * and caches it in localStorage so the app doesn't need to re-fetch it.
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message ?? 'Sign-in failed');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profile?.username) setStoredUsername(profile.username as string);
}

/**
 * Kicks off Google OAuth.  The browser is redirected to Google and then back
 * to window.location.origin — no further action needed in this function.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

// ─── Account linking (profile tab, anonymous → real) ─────────────────────────

/**
 * Attaches an email + password to an existing anonymous session.
 * Supabase sends a confirmation email before the email change takes effect;
 * the password is set immediately.
 * Also writes the email to the profiles table.
 */
export async function linkEmailPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw new Error(error.message);

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').update({ email }).eq('id', user.id);
  }
}

/**
 * Initiates Google identity linking for an anonymous account.
 * Redirects to Google; on return the same user id is preserved, so all
 * cart data remains intact.
 */
export async function linkGoogle(): Promise<void> {
  const { error } = await supabase.auth.linkIdentity({ provider: 'google' });
  if (error) throw new Error(error.message);
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export interface SessionProfile {
  userId: string;
  username: string | null;
  isAnonymous: boolean;
}

/**
 * Checks for an active Supabase session and, if one exists, loads the matching
 * profile row.  Returns null when there is no session.
 * Used by App.tsx on startup to decide which screen to show.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const user = session.user;
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  const username = (profile?.username as string) ?? null;
  if (username) setStoredUsername(username);

  return {
    userId: user.id,
    username,
    isAnonymous: user.is_anonymous ?? false,
  };
}

export async function isCurrentUserAnonymous(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.is_anonymous ?? false;
}

export async function signOut(): Promise<void> {
  clearStoredUsername();
  await supabase.auth.signOut();
}
