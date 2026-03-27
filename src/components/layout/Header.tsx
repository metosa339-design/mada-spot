'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Building2,
  UtensilsCrossed,
  Mountain,
  Users,
  Map,
  Tag,
  ChefHat,
  Sparkles,
  Plus,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';
import SkipToContent from '@/components/ui/SkipToContent';
import SuccessTicker from '@/components/ui/SuccessTicker';
import NotificationBell from '@/components/ui/NotificationBell';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useTrans } from '@/i18n';

interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'ADMIN';
  avatar?: string;
  userType?: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER' | null;
}

const USER_TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hébergement',
  RESTAURANT: 'Restaurateur',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBonsPlansOpen, setIsBonsPlansOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTrans('nav');

  const bonsPlansItems = [
    { name: t.hotels, href: '/bons-plans/hotels', icon: Building2, color: '#3b82f6' },
    { name: t.restaurants, href: '/bons-plans/restaurants', icon: UtensilsCrossed, color: '#f97316' },
    { name: t.attractions, href: '/bons-plans/attractions', icon: Mountain, color: '#22c55e' },
    { name: t.providers, href: '/bons-plans/prestataires', icon: Users, color: '#06b6d4' },
    { name: t.interactiveMap, href: '/bons-plans/carte', icon: Map, color: '#8b5cf6' },
    { name: t.currentDeals, href: '/bons-plans/offres', icon: Tag, color: '#ec4899' },
    { name: t.culinaryGuide, href: '/bons-plans/guide-culinaire', icon: ChefHat, color: '#ef4444' },
    { name: t.publishPlace, href: '/publier-lieu', icon: Plus, color: '#10b981' },
  ];

  // Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          }
        }
      } catch {
        // Pas de session
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Déconnexion
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setIsUserMenuOpen(false);
      window.location.href = '/';
    } catch {
      // Erreur de déconnexion
    }
  };

  return (
    <>
    <SkipToContent />
    <header
      role="banner"
      className="relative z-50 bg-[#1a1a2e] border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src="/logo.png"
              alt="Mada Spot"
              width={40}
              height={40}
              className="w-9 h-9 md:w-10 md:h-10 object-contain"
            />
            <span className={`text-xl md:text-2xl font-bold ${'text-white'}`}>
              Mada<span className="text-orange-500"> Spot</span>
            </span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label={t.mainNav}>
            {/* Bons Plans Dropdown — hidden for providers */}
            {!user?.userType && <div className="relative">
              <button
                onClick={() => setIsBonsPlansOpen(!isBonsPlansOpen)}
                aria-expanded={isBonsPlansOpen}
                aria-haspopup="true"
                aria-label={t.openBonsPlans}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all ${
                  pathname?.startsWith('/bons-plans')
                    ? 'text-orange-500'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                {t.bonsPlans}
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full">
                  {t.newBadge}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBonsPlansOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {isBonsPlansOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                  >
                    <div className="p-2">
                      <Link
                        href="/bons-plans"
                        onClick={() => setIsBonsPlansOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{t.discover}</span>
                          <p className="text-xs text-slate-500">{t.allDeals}</p>
                        </div>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      {bonsPlansItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsBonsPlansOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${item.color}15` }}
                          >
                            <item.icon className="w-5 h-5" style={{ color: item.color }} />
                          </div>
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>}

            {!user?.userType && <Link
              href="/evenements"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all ${
                pathname?.startsWith('/evenements')
                  ? 'text-orange-500'
                  : isScrolled
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {t.events}
            </Link>}

            <Link
              href="/comment-ca-marche"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isScrolled
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {t.howItWorks}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <LanguageToggle />
            {/* Recherche */}
            <button
              onClick={() => router.push('/search')}
              aria-label={t.searchOnMadaSpot}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                'bg-white/10 text-white/90 hover:bg-white/20'
              }`}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">{t.search}</span>
            </button>

            {/* Utilisateur connecté ou boutons auth */}
            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <NotificationBell />

                    {/* Menu utilisateur */}
                    <div className="relative">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        aria-expanded={isUserMenuOpen}
                        aria-haspopup="true"
                        aria-label={t.openUserMenu}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          'text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm" aria-hidden="true">
                          {(user.firstName || '')[0] || ''}{(user.lastName || '')[0] || ''}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>

                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                          >
                            <div className="px-4 py-3 border-b border-slate-100">
                              <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-slate-500">
                                {user.role === 'ADMIN'
                                  ? 'Administrateur'
                                  : user.userType
                                    ? USER_TYPE_LABELS[user.userType] || 'Professionnel'
                                    : 'Voyageur'}
                              </p>
                            </div>
                            <div className="py-2">
                              {user.role === 'ADMIN' ? (
                                <Link
                                  href="/admin"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <User className="w-4 h-4" />
                                  Administration
                                </Link>
                              ) : user.userType ? (
                                <Link
                                  href="/dashboard"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <LayoutDashboard className="w-4 h-4 text-orange-500" />
                                  Dashboard Pro
                                </Link>
                              ) : (
                                <Link
                                  href="/client"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <User className="w-4 h-4" />
                                  Mon espace
                                </Link>
                              )}
                              {user.role === 'CLIENT' && !user.userType && (
                                <Link
                                  href="/publier-lieu"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Plus className="w-4 h-4 text-emerald-500" />
                                  {t.publishPlace}
                                </Link>
                              )}
                              <Link
                                href={user.role === 'ADMIN' ? '/admin' : '/client/settings'}
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Settings className="w-4 h-4" />
                                {t.settings}
                              </Link>
                            </div>
                            <div className="border-t border-slate-100 py-2">
                              <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <LogOut className="w-4 h-4" />
                                {t.logout}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/publier-avis"
                      className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        'text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/10'
                      }`}
                    >
                      {t.publish}
                    </Link>
                    <Link
                      href="/login"
                      className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        'text-white/90 border border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {t.login}
                    </Link>
                    <Link
                      href="/register"
                      className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        'text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:shadow-lg hover:shadow-orange-500/25'
                      }`}
                    >
                      {t.register}
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? t.closeMenu : t.openMenu}
              className={`lg:hidden p-2.5 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                'text-white hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100"
            role="navigation"
            aria-label={t.mobileMenu}
          >
            <div className="px-4 py-4 space-y-2">
              {/* Recherche mobile */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-lg">
                <Search className="w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder={t.searchDestination}
                  aria-label={t.searchDestination}
                  className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = (e.target as HTMLInputElement).value.trim();
                      setIsMobileMenuOpen(false);
                      router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
                    }
                  }}
                />
              </div>

              {/* Bons Plans — hidden for providers */}
              {!user?.userType && <div className="border-b border-slate-100 pb-4">
                <Link
                  href="/bons-plans"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <p className="text-sm font-medium text-slate-500">{t.bonsPlans}</p>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full">
                    {t.newBadge}
                  </span>
                </Link>
                {bonsPlansItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </Link>
                ))}
              </div>}

              {/* Liens */}
              {!user?.userType && <Link
                href="/evenements"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5 text-orange-500" />
                {t.events}
              </Link>}
              <Link
                href="/comment-ca-marche"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {t.howItWorks}
              </Link>

              {/* Auth mobile */}
              {!user && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <Link
                    href="/publier-avis"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center font-medium text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    {t.publish}
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center font-medium text-sm text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {t.login}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center font-medium text-sm text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg hover:shadow-lg transition-all"
                  >
                    {t.registerFree}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticker de succès */}
      <SuccessTicker />
    </header>
    </>
  );
}
