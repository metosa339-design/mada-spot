'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Calendar, MessageSquare, Star, Tag,
  Settings, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
  Utensils, Mountain, Users, BedDouble, UtensilsCrossed, Ticket,
  Menu, X, TrendingUp, Zap
} from 'lucide-react'
import type { UserType, DashboardUser } from '@/types/dashboard'
import { useState } from 'react'

interface SidebarLink {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
  userTypes?: UserType[]
}

interface DashboardSidebarProps {
  user: DashboardUser
  unreadMessages: number
  todayBookings: number
  onLogout: () => void
}

// Hotel-specific labels override common ones
function getCommonLinks(): SidebarLink[] {
  return [
    { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
    { icon: Building2, label: 'Mon établissement', href: '/dashboard/etablissement' },
    { icon: Calendar, label: 'Réservations', href: '/dashboard/calendrier' },
    { icon: MessageSquare, label: 'Messagerie', href: '/dashboard/messagerie' },
    { icon: Zap, label: 'Promotions', href: '/dashboard/promotions' },
    { icon: Star, label: 'Avis clients', href: '/dashboard/avis' },
    { icon: Tag, label: 'Tarifs & Saisons', href: '/dashboard/tarifs' },
    { icon: TrendingUp, label: 'Statistiques', href: '/dashboard/statistiques' },
  ]
}

const TYPE_SPECIFIC_LINKS: SidebarLink[] = [
  // Hôtel — Chambres & Unités
  { icon: BedDouble, label: 'Chambres & Unités', href: '/dashboard/etablissement?tab=rooms', userTypes: ['HOTEL'] },
  // Restaurant
  { icon: UtensilsCrossed, label: 'Ma Carte & Menu', href: '/dashboard/etablissement?tab=menu', userTypes: ['RESTAURANT'] },
  // Attraction
  { icon: Ticket, label: 'Tarifs visiteurs', href: '/dashboard/tarifs?tab=visiteurs', userTypes: ['ATTRACTION'] },
  // Provider
  { icon: Users, label: 'Planning sorties', href: '/dashboard/reservations?tab=planning', userTypes: ['PROVIDER'] },
]

// Bleu Lagon for hotel, orange for others
function getAccentColor(userType?: UserType | null): string {
  return userType === 'HOTEL' ? '#06B6D4' : '#FF6B35'
}

const BOTTOM_LINKS: SidebarLink[] = [
  { icon: ShieldCheck, label: 'Vérification', href: '/dashboard/verification' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/parametres' },
]

function getUserTypeIcon(userType?: UserType | null) {
  switch (userType) {
    case 'HOTEL': return BedDouble
    case 'RESTAURANT': return Utensils
    case 'ATTRACTION': return Mountain
    case 'PROVIDER': return Users
    default: return Building2
  }
}

function getUserTypeLabel(userType?: UserType | null) {
  switch (userType) {
    case 'HOTEL': return 'Hébergement'
    case 'RESTAURANT': return 'Restaurant'
    case 'ATTRACTION': return 'Attraction'
    case 'PROVIDER': return 'Prestataire'
    default: return 'Pro'
  }
}

export default function DashboardSidebar({ user, unreadMessages, todayBookings, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const UserTypeIcon = getUserTypeIcon(user.userType)

  const accent = getAccentColor(user.userType)

  const filteredTypeLinks = TYPE_SPECIFIC_LINKS.filter(
    link => !link.userTypes || (user.userType && link.userTypes.includes(user.userType))
  )

  const allLinks = [...getCommonLinks(), ...filteredTypeLinks]

  function getBadge(link: SidebarLink): number | undefined {
    if (link.href === '/dashboard/messagerie') return unreadMessages || undefined
    if (link.href === '/dashboard/calendrier') return todayBookings || undefined
    return link.badge
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href.split('?')[0])
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: accent }}
          >
            <UserTypeIcon className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] truncate">
                {user.clientProfile?.companyName || `${user.firstName} ${user.lastName}`}
              </p>
              <p className="text-xs text-[#94A3B8]">{getUserTypeLabel(user.userType)}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {allLinks.map((link) => {
          const active = isActive(link.href)
          const badge = getBadge(link)
          return (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group ${
                active
                  ? ''
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
              style={active ? { backgroundColor: `${accent}14`, color: accent } : undefined}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r-full"
                  style={{ backgroundColor: accent }}
                />
              )}
              {(() => { const Icon = link.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>; return <Icon className="w-5 h-5 flex-shrink-0" style={active ? { color: accent } : undefined} /> })()}
              {!collapsed && (
                <>
                  <span className="truncate">{link.label}</span>
                  {badge && badge > 0 && (
                    <span className="ml-auto text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center" style={{ backgroundColor: accent }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && badge && badge > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[#E2E8F0] p-3 space-y-1">
        {BOTTOM_LINKS.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-[#F8FAFC] text-[#0F172A]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              {(() => { const Icon = link.icon as React.ComponentType<{ className?: string }>; return <Icon className="w-5 h-5 flex-shrink-0" /> })()}
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-3 border-t border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A] transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A]"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/35 z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-[#E2E8F0] z-50"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-[#E2E8F0] transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
