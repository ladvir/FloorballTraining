import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  Dumbbell,
  ActivityIcon,
  Building2,
  UserCircle,
  Calendar,
  CalendarRange,
  Star,
  Package,
  MapPin,
  Tag,
  Trophy,
  Settings,
  ShieldCheck,
  Pencil,
  ClipboardCheck,
  Copy,
  LayoutGrid,
  ScrollText,
  Gauge,
  Languages,
  Sparkles,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../store/authStore'
import type { EffectiveRole } from '../../types/domain.types'

interface NavItem {
  to?: string
  /** Full-page navigation (non-SPA link, e.g. /hangfire). Opens in a new tab. */
  href?: string
  icon: React.ElementType
  label: string
  minRole?: EffectiveRole
}

const roleLevels: Record<EffectiveRole, number> = {
  User: 0,
  Coach: 1,
  HeadCoach: 2,
  ClubAdmin: 3,
  Admin: 4,
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { effectiveRole } = useAuthStore()
  const { t } = useTranslation()
  const userLevel = roleLevels[effectiveRole]

  const navItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/kpi', icon: BarChart2, label: t('nav.kpi'), minRole: 'Coach' },
    { to: '/trainings', icon: Dumbbell, label: t('nav.trainings') },
    { to: '/activities', icon: ActivityIcon, label: t('nav.activities') },
    { to: '/drawing', icon: Pencil, label: t('nav.drawing') },
    { to: '/appointments', icon: Calendar, label: t('nav.appointments') },
    { to: '/plan', icon: CalendarRange, label: t('nav.seasonPlan') },
    { to: '/ratings', icon: Star, label: t('nav.ratings') },
    { to: '/testing', icon: ClipboardCheck, label: t('nav.testing'), minRole: 'Coach' },
    { to: '/teams', icon: Trophy, label: t('nav.teams'), minRole: 'Coach' },
    { to: '/lineups', icon: LayoutGrid, label: t('nav.lineups'), minRole: 'Coach' },
    { to: '/tournaments', icon: Trophy, label: t('nav.tournaments'), minRole: 'Coach' },
    { to: '/ai/usage', icon: Sparkles, label: t('nav.aiUsage'), minRole: 'HeadCoach' },
    { to: '/users', icon: ShieldCheck, label: t('nav.users'), minRole: 'HeadCoach' },
    { to: '/clubs', icon: Building2, label: t('nav.clubs'), minRole: 'Admin' },
    { to: '/members', icon: UserCircle, label: t('nav.members'), minRole: 'HeadCoach' },
    { to: '/equipment', icon: Package, label: t('nav.equipment'), minRole: 'Admin' },
    { to: '/places', icon: MapPin, label: t('nav.places'), minRole: 'Admin' },
    { to: '/seasons', icon: Trophy, label: t('nav.seasons'), minRole: 'ClubAdmin' },
    { to: '/tags', icon: Tag, label: t('nav.tags'), minRole: 'Admin' },
    {
      to: '/admin/training-duplicates',
      icon: Copy,
      label: t('nav.trainingDuplicates'),
      minRole: 'Admin',
    },
    { to: '/admin/audit-logs', icon: ScrollText, label: t('nav.auditLogs'), minRole: 'Admin' },
    { to: '/admin/translations', icon: Languages, label: t('nav.translations'), minRole: 'Admin' },
    {
      href: `${import.meta.env.VITE_API_URL ?? ''}/hangfire`,
      icon: Gauge,
      label: t('nav.backgroundJobs'),
      minRole: 'Admin',
    },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.minRole || userLevel >= roleLevels[item.minRole]
  )

  return (
    <aside className="flex h-full w-56 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-6 border-b border-gray-100">
        <span className="text-lg font-bold text-sky-500">FloTr</span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            aria-label={t('nav.closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
            <li key={item.href ?? item.to}>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </a>
              ) : (
                <NavLink
                  to={item.to!}
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
              )}
            </li>
          ))}
        </ul>
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
          {t('nav.profileSettings')}
        </NavLink>
      </div>
    </aside>
  )
}
