import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { forceLogout, logout } from '../services/authService'
import { getUserMenuItems } from '../routes/routeRegistry'

export default function UserMenu({ userType = 'guest' }) {
  const navigate = useNavigate()
  const { user, role, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef(null)
  const items = getUserMenuItems(userType)
  const accountName = user?.email ?? 'Account'
  const label = !isAuthenticated ? 'Guest' : role ? `${accountName} | ${role}` : accountName

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setSigningOut(true)

    try {
      await logout()
      setOpen(false)
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  async function handleForceLogout() {
    setSigningOut(true)

    try {
      await forceLogout()
      setOpen(false)
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  function handleMenuAction(item) {
    if (item.action === 'logout') {
      handleLogout()
      return
    }

    if (item.action === 'force-logout') {
      handleForceLogout()
      return
    }

    setOpen(false)
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={!isAuthenticated ? 'Guest menu' : `Account menu for ${label}`}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        {!isAuthenticated ? (
          'Guest'
        ) : (
          <>
            {accountName}
            {role ? (
              <>
                {' | '}
                <span className="user-menu-trigger-role">{role}</span>
              </>
            ) : null}
          </>
        )}
      </button>
      {open && (
        <ul className="user-menu-dropdown" role="menu">
          {items.map((item) => (
            <li key={item.label} role="none">
              {item.action ? (
                <button
                  type="button"
                  className={
                    item.action === 'force-logout'
                      ? 'user-menu-item user-menu-action user-menu-action-force'
                      : 'user-menu-item user-menu-action'
                  }
                  role="menuitem"
                  disabled={signingOut}
                  onClick={() => handleMenuAction(item)}
                >
                  {signingOut && item.action === 'logout'
                    ? 'Signing out…'
                    : signingOut && item.action === 'force-logout'
                      ? 'Force signing out…'
                      : item.label}
                </button>
              ) : (
                <Link
                  className="user-menu-item"
                  role="menuitem"
                  to={item.path}
                  onClick={() => handleMenuAction(item)}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
