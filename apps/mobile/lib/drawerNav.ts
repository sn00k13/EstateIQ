/**
 * Mirrors web `Sidebar.tsx` nav items and role visibility.
 */
export type Role = 'ADMIN' | 'SUPER_ADMIN' | 'SECURITY' | 'RESIDENT'

export interface DrawerNavItem {
  label: string
  /** Expo file route name (`index` for dashboard home). */
  name: string
  /** Ionicons glyph name */
  icon: string
  roles: Role[]
}

export const DRAWER_NAV_ITEMS: DrawerNavItem[] = [
  { label: 'Dashboard', name: 'index', icon: 'home-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY', 'RESIDENT'] },
  { label: 'Residents', name: 'residents', icon: 'people-outline', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Units', name: 'units', icon: 'cube-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY', 'RESIDENT'] },
  { label: 'Announcements', name: 'announcements', icon: 'megaphone-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY', 'RESIDENT'] },
  { label: 'Levies & Dues', name: 'levies', icon: 'card-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'RESIDENT'] },
  { label: 'Visitors', name: 'visitors', icon: 'shield-checkmark-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY', 'RESIDENT'] },
  { label: 'Maintenance', name: 'maintenance', icon: 'construct-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY', 'RESIDENT'] },
  { label: 'Facilities', name: 'facilities', icon: 'calendar-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'RESIDENT'] },
  { label: 'Polls', name: 'polls', icon: 'bar-chart-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'RESIDENT'] },
  { label: 'Incidents', name: 'incidents', icon: 'warning-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY', 'RESIDENT'] },
  { label: 'Vehicles', name: 'vehicles', icon: 'car-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY'] },
  { label: 'Gate scanner', name: 'gate', icon: 'qr-code-outline', roles: ['ADMIN', 'SUPER_ADMIN', 'SECURITY'] },
  { label: 'Subscription', name: 'subscription', icon: 'wallet-outline', roles: ['ADMIN', 'SUPER_ADMIN'] },
]

export function filterNavForRole(role: string | undefined): DrawerNavItem[] {
  const r = (role ?? 'RESIDENT') as Role
  return DRAWER_NAV_ITEMS.filter(item => item.roles.includes(r))
}
