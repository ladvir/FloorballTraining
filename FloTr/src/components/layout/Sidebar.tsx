import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Dumbbell,
  ActivityIcon,
  Building2,
  UserCircle,
  Calendar,
  Package,
  MapPin,
  Tag,
  Trophy,
  Settings,
  ShieldCheck,
  Pencil,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../store/authStore'
import type { EffectiveRole } from '../../types/domain.types'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  minRole?: EffectiveRole
}

const roleLevels: Record<EffectiveRole, number> = {
  User: 0,
  Coach: 1,
  HeadCoach: 2,
  Admin: 3,
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trainings', icon: Dumbbell, label: 'Tréninky' },
  { to: '/activities', icon: ActivityIcon, label: 'Aktivity' },
  { to: '/drawing', icon: Pencil, label: 'Kreslení' },
  { to: '/appointments', icon: Calendar, label: 'Události' },
  { to: '/teams', icon: Trophy, label: 'Týmy' },
  { to: '/clubs', icon: Building2, label: 'Kluby', minRole: 'Admin' },
  { to: '/members', icon: UserCircle, label: 'Členové', minRole: 'Admin' },
  { to: '/equipment', icon: Package, label: 'Vybavení', minRole: 'Admin' },
  { to: '/places', icon: MapPin, label: 'Místa', minRole: 'Admin' },
  { to: '/seasons', icon: Trophy, label: 'Sezóny', minRole: 'Admin' },
  { to: '/tags', icon: Tag, label: 'Tagy', minRole: 'Admin' },
]

const adminItems: NavItem[] = [
  { to: '/admin/users', icon: ShieldCheck, label: 'Uživatelé' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { isAdmin, effectiveRole } = useAuthStore()
  const userLevel = roleLevels[effectiveRole]

  const visibleItems = navItems.filter(
    (item) => !item.minRole || userLevel >= roleLevels[item.minRole]
  )

  return (
    <aside className="flex h-full w-56 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-14 items-center px-6 border-b border-gray-100">
        <span className="text-lg font-bold text-sky-500">FloTr</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sky-50 text-sky-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>

        {isAdmin && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Administrace
            </p>
            <ul className="space-y-0.5">
              {adminItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sky-50 text-sky-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Settings */}
      <div className="border-t border-gray-100 px-3 py-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sky-50 text-sky-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )
          }
        >
          <Settings className="h-4 w-4" />
          Profil a nastavení
        </NavLink>
      </div>
    </aside>
  )
}
