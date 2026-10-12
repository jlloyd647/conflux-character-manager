import { useEffect } from 'react'
import { expireSession, getLastActivity, isInactivityExpired, recordActivity } from '../services/authService'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']
const ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000
const EXPIRY_CHECK_INTERVAL_MS = 60 * 1000

export function useInactivityLogout(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    if (getLastActivity() === null) {
      recordActivity()
    }

    function checkExpiry() {
      if (isInactivityExpired()) {
        expireSession()
        return true
      }
      return false
    }

    function handleActivity() {
      // Check first: a tab left open in the background must not be revived by the first click.
      if (checkExpiry()) {
        return
      }

      const lastActivity = getLastActivity() ?? 0
      if (Date.now() - lastActivity > ACTIVITY_WRITE_THROTTLE_MS) {
        recordActivity()
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        handleActivity()
      }
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const intervalId = window.setInterval(checkExpiry, EXPIRY_CHECK_INTERVAL_MS)

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [isAuthenticated])
}
