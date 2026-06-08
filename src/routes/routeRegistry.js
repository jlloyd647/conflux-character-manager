/**
 * Application route registry.
 * Keep in sync with specs/route-registry.md
 */

export const routeRegistry = [
  {
    path: '/',
    page: 'HomePage',
    layout: 'public',
    access: 'anyone',
    showInNav: ['guest'],
    navLabel: 'Home',
  },
  {
    path: '/login',
    page: 'LoginPage',
    layout: 'public',
    access: 'logged-out',
    showInNav: ['guest'],
    navLabel: 'Login',
  },
  {
    path: '/dashboard',
    page: 'DashboardPage',
    layout: 'app',
    access: 'logged-in',
    showInNav: ['user', 'staff', 'admin'],
    navLabel: 'Dashboard',
  },
  {
    path: '/characters/create',
    page: 'CharacterCreatePage',
    layout: 'app',
    access: 'logged-in',
    showInNav: ['user', 'staff', 'admin'],
    navLabel: 'Create Character',
  },
  {
    path: '/characters/:characterId/edit',
    page: 'CharacterEditPage',
    layout: 'app',
    access: 'logged-in',
  },
  {
    path: '/characters/:characterId',
    page: 'CharacterDetailPage',
    layout: 'app',
    access: 'logged-in',
  },
  {
    path: '/staff',
    page: 'StaffDashboardPage',
    layout: 'app',
    access: 'staff',
    showInNav: ['staff', 'admin'],
    navLabel: 'Staff',
  },
  {
    path: '/staff/characters',
    page: 'StaffCharacterListPage',
    layout: 'app',
    access: 'staff',
    showInNav: ['staff', 'admin'],
    navLabel: 'Staff Characters',
  },
  {
    path: '/staff/characters/:characterId',
    page: 'StaffCharacterDetailPage',
    layout: 'app',
    access: 'staff',
  },
  {
    path: '/staff/players',
    page: 'StaffPlayerListPage',
    layout: 'app',
    access: 'staff',
    showInNav: ['staff', 'admin'],
    navLabel: 'Players',
  },
  {
    path: '/admin',
    page: 'AdminDashboardPage',
    layout: 'app',
    access: 'admin',
    showInNav: ['admin'],
    navLabel: 'Admin',
  },
  {
    path: '/admin/skills',
    page: 'SkillManagementPage',
    layout: 'app',
    access: 'admin',
    showInNav: ['admin'],
    navLabel: 'Skills',
  },
  {
    path: '/admin/items',
    page: 'ItemManagementPage',
    layout: 'app',
    access: 'admin',
    showInNav: ['admin'],
    navLabel: 'Items',
  },
  {
    path: '/admin/settings',
    page: 'GameSettingsPage',
    layout: 'app',
    access: 'admin',
    showInNav: ['admin'],
    navLabel: 'Settings',
  },
]

export function getRoutesByLayout(layout) {
  return routeRegistry.filter((route) => route.layout === layout)
}

export function getNavLinks(userType) {
  return routeRegistry
    .filter((route) => route.showInNav?.includes(userType))
    .map((route) => ({
      label: route.navLabel,
      path: route.path,
    }))
}

export function getUserMenuItems(userType) {
  if (userType === 'guest') {
    return [{ label: 'Login', path: '/login' }]
  }

  return [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Logout', path: '/login' },
  ]
}

export function toRoutePath(path) {
  return path === '/' ? undefined : path.slice(1)
}
