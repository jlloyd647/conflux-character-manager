import { useEffect, useMemo, useState } from 'react'
import { getSession, onAuthStateChange } from '../services/authService'
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

    async function syncAuth(nextSession) {
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
      } else {
        const referenceStore = useReferenceDataStore.getState()
        referenceStore.clearSkills()
        referenceStore.clearBloodlines()
      }
    }

    getSession()
      .then(syncAuth)
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    const { data: { subscription } } = onAuthStateChange((nextSession) => {
      syncAuth(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

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
