import { useEffect, useMemo, useState } from 'react'
import { useInactivityLogout } from '../hooks/useInactivityLogout'
import {
  expireSession,
  getSession,
  isInactivityExpired,
  onAuthStateChange,
} from '../services/authService'
import { getProfileById } from '../services/profileService'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import { AuthContext } from './authContext'

async function loadProfileForSession(session) {
  if (!session?.user?.id) {
    return null
  }

  try {
    return await getProfileById()
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function syncAuth(incomingSession) {
      let nextSession = incomingSession

      if (nextSession && isInactivityExpired()) {
        await expireSession()
        nextSession = null
      }

      const nextProfile = await loadProfileForSession(nextSession)

      if (!active) {
        return
      }

      setSession(nextSession)
      setProfile(nextProfile)

      if (nextSession?.user?.id) {
        const referenceStore = useReferenceDataStore.getState()
        referenceStore.loadSkills().catch(() => {})
        referenceStore.loadBloodlines().catch(() => {})
        referenceStore.loadKingroups().catch(() => {})
        referenceStore.loadBanes().catch(() => {})
        referenceStore.loadGifts().catch(() => {})
        referenceStore.loadCurses().catch(() => {})
        referenceStore.loadStatProgressions().catch(() => {})
        referenceStore.loadStats().catch(() => {})
        referenceStore.loadTalents().catch(() => {})
        referenceStore.loadPrereqs().catch(() => {})
        referenceStore.loadRowStatuses().catch(() => {})
        referenceStore.loadLores().catch(() => {})
        referenceStore.loadFormats().catch(() => {})
      } else {
        const referenceStore = useReferenceDataStore.getState()
        referenceStore.clearSkills()
        referenceStore.clearBloodlines()
        referenceStore.clearKingroups()
        referenceStore.clearBanes()
        referenceStore.clearGifts()
        referenceStore.clearCurses()
        referenceStore.clearStatProgressions()
        referenceStore.clearStats()
        referenceStore.clearTalents()
        referenceStore.clearPrereqs()
        referenceStore.clearRowStatuses()
        referenceStore.clearLores()
        referenceStore.clearFormats()
      }
    }

    getSession()
      .then(syncAuth)
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    // Supabase holds an auth lock while this callback runs; awaiting other
    // supabase calls inside it deadlocks, so defer the work.
    const { data: { subscription } } = onAuthStateChange((nextSession) => {
      setTimeout(() => syncAuth(nextSession), 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useInactivityLogout(Boolean(session))

  const role = profile?.role ?? null
  const userType = session ? role : 'guest'

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      userType,
      loading,
      isAuthenticated: Boolean(session),
    }),
    [session, profile, role, userType, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
