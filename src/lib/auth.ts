// auth.ts — staff sign-in seam.
//
// When Supabase is configured it uses real email/password auth against the
// shared project. Otherwise it falls back to a local mock: any non-empty
// email + password signs in, persisted to localStorage. Runners never
// self-register — there is no sign-up flow, by design.
import type { RunnerSession } from '../types'
import { getSupabase, hasSupabase } from './supabase'

const KEY = 'rowrunner.runner.session'

/** Turn an email into a display name: "sarah.lee@venue.com" → "Sarah Lee". */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'Runner'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ')
}

export async function signIn(email: string, password: string): Promise<RunnerSession> {
  const e = email.trim()
  if (!e || !password) throw new Error('Enter your email and password.')

  if (hasSupabase) {
    const sb = getSupabase()
    const { data, error } = await sb.auth.signInWithPassword({ email: e, password })
    if (error || !data.user) throw new Error(error?.message ?? 'Sign-in failed.')
    const u = data.user
    return {
      id: u.id,
      email: u.email ?? e,
      name: (u.user_metadata?.name as string) || nameFromEmail(u.email ?? e),
    }
  }

  // mock fallback
  const session: RunnerSession = {
    id: 'rnr_' + (e.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'),
    name: nameFromEmail(e),
    email: e,
  }
  localStorage.setItem(KEY, JSON.stringify(session))
  return session
}

/** Restore a persisted session on app load, or null if none. */
export async function restore(): Promise<RunnerSession | null> {
  if (hasSupabase) {
    const sb = getSupabase()
    const { data } = await sb.auth.getSession()
    const u = data.session?.user
    if (!u) return null
    return {
      id: u.id,
      email: u.email ?? '',
      name: (u.user_metadata?.name as string) || nameFromEmail(u.email ?? 'Runner'),
    }
  }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RunnerSession) : null
  } catch {
    return null
  }
}

export async function signOut(): Promise<void> {
  if (hasSupabase) {
    await getSupabase().auth.signOut()
    return
  }
  localStorage.removeItem(KEY)
}
