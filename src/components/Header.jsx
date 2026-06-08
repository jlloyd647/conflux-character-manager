import { Link, NavLink } from 'react-router-dom'
import { getNavLinks } from '../routes/routeRegistry'
import UserMenu from './UserMenu'

export default function Header({ userType = 'guest' }) {
  const navLinks = getNavLinks(userType)

  return (
    <header className="header">
      <Link className="header-logo" to="/" aria-label="Home">
        <img src="/favicon.svg" alt="" className="header-logo-image" />
        <span className="header-logo-text">Conflux</span>
      </Link>

      <nav className="header-nav" aria-label="Main">
        <ul className="header-nav-list">
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'header-nav-link header-nav-link-active' : 'header-nav-link'
                }
                to={link.path}
                end={link.path === '/'}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <UserMenu userType={userType} />
    </header>
  )
}
