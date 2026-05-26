'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import QuickActionBar from '@/components/dashboard/QuickActionBar'
import type { DashboardUser } from '@/types/dashboard'
import { Bell, Search } from 'lucide-react'
import Link from 'next/link'
import { useTrans } from '@/i18n'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTrans('dashboardPro')
  const router = useRouter()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [todayBookings, setTodayBookings] = useState(0)
  const [notifications, setNotifications] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return
    fetchBadges()
    const interval = setInterval(fetchBadges, 30000)
    return () => clearInterval(interval)
  }, [user])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (!res.ok) {
        router.push('/login?redirect=/dashboard')
        return
      }
      const data = await res.json()
      // Note: email verification is now non-blocking (banner shown in dashboard)
      setUser(data.user)
    } catch {
      router.push('/login?redirect=/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/dashboard/badges')
      if (res.ok) {
        const data = await res.json()
        setUnreadMessages(data.unreadMessages || 0)
        setTodayBookings(data.todayBookings || 0)
        setNotifications(data.notifications || 0)
      }
    } catch {
      // silently fail
    }
  }

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#64748B] text-sm">{t.loadingDashboard}</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <DashboardSidebar
        user={user}
        unreadMessages={unreadMessages}
        todayBookings={todayBookings}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#E2E8F0] bg-[#F8FAFC]/90 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex-1 max-w-md ml-12 lg:ml-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link
              href="/dashboard/parametres?tab=notifications"
              className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-white rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#EF4444] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>

            {/* User Avatar */}
            <Link href="/dashboard/parametres" className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {user.firstName[0]}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[#0F172A] leading-tight">{user.firstName}</p>
                <p className="text-xs text-[#94A3B8] leading-tight">
                  {user.userType === 'HOTEL' ? t.userTypeHotel :
                   user.userType === 'RESTAURANT' ? t.userTypeRestaurant :
                   user.userType === 'ATTRACTION' ? t.userTypeAttraction :
                   user.userType === 'PROVIDER' ? t.userTypeProvider : t.rolePro}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24">
          {children}
        </main>
      </div>

      {/* Quick Action Bar — HOTEL only */}
      {user.userType === 'HOTEL' && <QuickActionBar />}
    </div>
  )
}
