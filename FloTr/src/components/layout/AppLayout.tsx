import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useAuthStore } from '../../store/authStore'
import { ConflictToast } from '../shared/ConflictToast'
import { useNotificationsHub } from '../../hooks/useNotificationsHub'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { InstallPromptBanner } from '../shared/InstallPromptBanner'

export function AppLayout() {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const isOnline = useOnlineStatus()

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useNotificationsHub()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <a href="#main-content" className="skip-nav">
        {t('shared.skipToContent')}
      </a>
      <ConflictToast />
      <InstallPromptBanner />
      {!isOnline && (
        <div
          data-testid="offline-banner"
          className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-white"
        >
          {t('shared.offlineBanner')}
        </div>
      )}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop always visible, mobile slide-in */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
