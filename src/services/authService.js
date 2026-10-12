import { supabase } from './supabaseClient'

const AUTH_ERROR_MESSAGES = {
  invalid_credentials: 'Incorrect email or password. Please try again.',
  email_not_confirmed: 'Please confirm your email address before signing in.',
  user_already_registered: 'An account with this email already exists.',
  weak_password: 'Password must be at least 6 characters.',
  invalid_email: 'Please enter a valid email address.',
}

export const INACTIVITY_TIMEOUT_MS = 4 * 60 * 60 * 1000

const LAST_ACTIVITY_KEY = 'conflux:lastActivityAt'

export function recordActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

export function getLastActivity() {
  const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

function clearActivity() {
  localStorage.removeItem(LAST_ACTIVITY_KEY)
}

/**
 * A missing timestamp is treated as active so sessions that predate
 * activity tracking are not signed out on first load.
 */
export function isInactivityExpired() {
  const lastActivity = getLastActivity()
  return lastActivity !== null && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS
}

export async function expireSession() {
  clearActivity()

  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Local sign-out only clears browser storage; nothing to recover.
  }
}

function toAuthError(error) {
  const message =
    AUTH_ERROR_MESSAGES[error.code] ??
    error.message ??
    'Something went wrong. Please try again.'

  return new Error(message)
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw toAuthError(error)
  }

  recordActivity()
  return data
}

export async function register({ email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw toAuthError(error)
  }

  return data
}

export async function requestPasswordReset({ email }) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    throw toAuthError(error)
  }
}

export async function updatePassword({ password }) {
  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw toAuthError(error)
  }

  return data
}

export async function logout() {
  clearActivity()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw toAuthError(error)
  }
}

export async function forceLogout() {
  clearActivity()

  try {
    await supabase.auth.signOut({ scope: 'global' })
  } catch {
    // Continue clearing local session even if remote sign-out fails.
  }

  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Continue clearing local storage below.
  }

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.includes('auth')) {
      localStorage.removeItem(key)
    }
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw toAuthError(error)
  }

  return data.session
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}
