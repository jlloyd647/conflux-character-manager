import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserMenuItems } from '../routes/routeRegistry'

export default function UserMenu({ userType = 'guest' }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const items = getUserMenuItems(userType)
  const label = userType === 'guest' ? 'Guest' : 'Account'

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open && (
        <ul className="user-menu-dropdown" role="menu">
          {items.map((item) => (
            <li key={item.path} role="none">
              <Link
                className="user-menu-item"
                role="menuitem"
                to={item.path}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
