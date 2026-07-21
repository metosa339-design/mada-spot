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
  Plus,
  Calendar,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import SkipToContent from '@/components/ui/SkipToContent';
import NotificationBell from '@/components/ui/NotificationBell';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useTrans } from '@/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'ADMIN';
  avatar?: string;
  userType?: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER' | null;
}

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
    { name: t.hotels, href: '/hotels', icon: Building2 },
    { name: t.restaurants, href: '/restaurants', icon: UtensilsCrossed },
    { name: t.attractions, href: '/attractions', icon: Mountain },
    { name: t.providers, href: '/prestataires', icon: Users },
    { name: 'Destinations', href: '/destinations', icon: Map },
    { name: 'Taux de change', href: '/taux-de-change', icon: Tag },
    { name: t.interactiveMap, href: '/carte', icon: Map },
    { name: t.currentDeals, href: '/offres', icon: Tag },
    { name: t.culinaryGuide, href: '/guide-culinaire', icon: ChefHat },
    { name: t.publishPlace, href: '/publier-lieu', icon: Plus },
  ];

  // Vérifier la session au chargement (1 seule fois par session navigateur — évite hammering du serveur en cas de remount répété)
  useEffect(() => {
    const SESSION_CACHE_KEY = 'mada-session-check-v1';
    const SESSION_NEGATIVE_TTL = 30_000; // 30s : durée pendant laquelle on n'essaie pas de re-fetch après un 401

    const cachedNegative = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (cachedNegative && Date.now() - parseInt(cachedNegative, 10) < SESSION_NEGATIVE_TTL) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            sessionStorage.removeItem(SESSION_CACHE_KEY);
          } else {
            sessionStorage.setItem(SESSION_CACHE_KEY, Date.now().toString());
          }
        } else if (response.status === 401) {
          sessionStorage.setItem(SESSION_CACHE_KEY, Date.now().toString());
        }
      } catch {
        // Pas de session
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

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

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <>
      <SkipToContent />
      <header
        role="banner"
        className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[68px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 md:gap-3 shrink-0">
              <Image
                src="/logo.png"
                alt="Mada Spot"
                width={36}
                height={36}
                className="w-8 h-8 md:w-9 md:h-9 object-contain"
              />
              <span
                className="text-[18px] md:text-[20px] font-semibold tracking-[-0.02em] text-[#0F172A]"
                style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
              >
                Mada<span className="text-[#FF6B35]">Spot</span>
              </span>
            </Link>

            {/* Navigation Desktop */}
            <nav
              className="hidden lg:flex items-center gap-1"
              role="navigation"
              aria-label={t.mainNav}
            >
              {!user?.userType && (
                <div className="relative">
                  <button
                    onClick={() => setIsBonsPlansOpen(!isBonsPlansOpen)}
                    aria-expanded={isBonsPlansOpen}
                    aria-haspopup="true"
                    aria-label={t.openBonsPlans}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                      bonsPlansItems.some((it) => isActive(it.href)) || isActive('/bons-plans')
                        ? 'text-[#0F172A]'
                        : 'text-[#334155] hover:text-[#0F172A]'
                    }`}
                  >
                    {t.bonsPlans}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${isBonsPlansOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {isBonsPlansOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: EASE }}
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_12px_40px_-8px_rgba(15,23,42,0.12)]"
                      >
                        <div className="p-1.5">
                          {bonsPlansItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsBonsPlansOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center group-hover:border-[#CBD5E1] transition-colors">
                                <item.icon className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                              </div>
                              <span className="text-[14px] font-medium text-[#334155] group-hover:text-[#0F172A] transition-colors">
                                {item.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!user?.userType && (
                <Link
                  href="/evenements"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                    isActive('/evenements')
                      ? 'text-[#0F172A]'
                      : 'text-[#334155] hover:text-[#0F172A]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {t.events}
                </Link>
              )}

              <Link
                href="/blog"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive('/blog') ? 'text-[#0F172A]' : 'text-[#334155] hover:text-[#0F172A]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Blog
              </Link>

              <Link
                href="/comment-ca-marche"
                className={`px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive('/comment-ca-marche')
                    ? 'text-[#0F172A]'
                    : 'text-[#334155] hover:text-[#0F172A]'
                }`}
              >
                {t.howItWorks}
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <LanguageToggle />

              {/* Recherche */}
              <button
                onClick={() => router.push('/search')}
                aria-label={t.searchOnMadaSpot}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-[13px]">{t.search}</span>
              </button>

              {!isLoading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      <NotificationBell />

                      <div className="relative">
                        <button
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          aria-expanded={isUserMenuOpen}
                          aria-haspopup="true"
                          aria-label={t.openUserMenu}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <div
                            className="w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center text-white font-semibold text-[12px]"
                            aria-hidden="true"
                          >
                            {(user.firstName || '')[0] || ''}
                            {(user.lastName || '')[0] || ''}
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform text-[#64748B] ${isUserMenuOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </button>

                        <AnimatePresence>
                          {isUserMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.18, ease: EASE }}
                              className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-[0_12px_40px_-8px_rgba(15,23,42,0.12)]"
                            >
                              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                                <p className="text-[14px] font-semibold text-[#0F172A]">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-[12px] text-[#64748B] mt-0.5">
                                  {user.role === 'ADMIN'
                                    ? t.roleAdmin
                                    : user.userType === 'HOTEL'
                                      ? t.userTypeHotel
                                      : user.userType === 'RESTAURANT'
                                        ? t.userTypeRestaurant
                                        : user.userType === 'ATTRACTION'
                                          ? t.userTypeAttraction
                                          : user.userType === 'PROVIDER'
                                            ? t.userTypeProvider
                                            : user.userType
                                              ? t.roleProvider
                                              : t.roleTraveler}
                                </p>
                              </div>
                              <div className="py-1.5">
                                {user.role === 'ADMIN' ? (
                                  <Link
                                    href="/admin"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-[#334155] hover:bg-white hover:text-[#0F172A] transition-colors"
                                  >
                                    <User className="w-4 h-4" />
                                    {t.adminLink}
                                  </Link>
                                ) : user.userType ? (
                                  <Link
                                    href="/dashboard"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-[#334155] hover:bg-white hover:text-[#0F172A] transition-colors"
                                  >
                                    <LayoutDashboard className="w-4 h-4 text-[#FF6B35]" />
                                    {t.proDashboard}
                                  </Link>
                                ) : (
                                  <Link
                                    href="/client"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-[#334155] hover:bg-white hover:text-[#0F172A] transition-colors"
                                  >
                                    <User className="w-4 h-4" />
                                    {t.myAccount}
                                  </Link>
                                )}
                                {user.role === 'CLIENT' && !user.userType && (
                                  <Link
                                    href="/publier-lieu"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-[#334155] hover:bg-white hover:text-[#0F172A] transition-colors"
                                  >
                                    <Plus className="w-4 h-4 text-[#10B981]" />
                                    {t.publishPlace}
                                  </Link>
                                )}
                                <Link
                                  href={user.role === 'ADMIN' ? '/admin' : '/client/settings'}
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2 text-[13px] text-[#334155] hover:bg-white hover:text-[#0F172A] transition-colors"
                                >
                                  <Settings className="w-4 h-4" />
                                  {t.settings}
                                </Link>
                              </div>
                              <div className="border-t border-[#E2E8F0] py-1.5">
                                <button
                                  onClick={handleLogout}
                                  className="flex items-center gap-3 px-4 py-2 w-full text-[13px] text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
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
                    <div className="hidden md:flex items-center gap-2">
                      <Link
                        href="/login"
                        className="px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {t.login}
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-1.5 rounded-xl text-[13px] font-semibold text-white bg-[#FF6B35] hover:bg-[#e55a2b] hover:scale-[1.02] active:scale-100 transition-all shadow-[0_8px_24px_-6px_rgba(255,107,53,0.45)]"
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
                className="lg:hidden p-2 rounded-md text-[#0F172A] hover:bg-[#F8FAFC] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
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
              transition={{ duration: 0.25, ease: EASE }}
              className="lg:hidden bg-white border-t border-[#E2E8F0] overflow-hidden"
              role="navigation"
              aria-label={t.mobileMenu}
            >
              <div className="px-4 py-4 space-y-1">
                {/* Recherche mobile */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg mb-3">
                  <Search className="w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder={t.searchDestination}
                    aria-label={t.searchDestination}
                    className="flex-1 bg-transparent outline-none text-[14px] text-[#0F172A] placeholder:text-[#94A3B8]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const q = (e.target as HTMLInputElement).value.trim();
                        setIsMobileMenuOpen(false);
                        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
                      }
                    }}
                  />
                </div>

                {!user?.userType && (
                  <div className="pb-3 border-b border-[#E2E8F0] space-y-0.5">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#94A3B8] px-3 pt-1 pb-1.5">
                      {t.bonsPlans}
                    </p>
                    {bonsPlansItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-[#64748B]" />
                        <span className="text-[14px] font-medium text-[#334155]">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {!user?.userType && (
                  <Link
                    href="/evenements"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-[#334155] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[#64748B]" />
                    {t.events}
                  </Link>
                )}
                <Link
                  href="/blog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-[#334155] hover:bg-[#F8FAFC] transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#64748B]" />
                  Blog
                </Link>
                <Link
                  href="/comment-ca-marche"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-[14px] font-medium text-[#334155] hover:bg-[#F8FAFC] transition-colors"
                >
                  {t.howItWorks}
                </Link>

                {!user && (
                  <div className="pt-3 mt-2 border-t border-[#E2E8F0] space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-4 py-2.5 text-center text-[13px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                    >
                      {t.login}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-4 py-2.5 text-center text-[13px] font-semibold text-white bg-[#FF6B35] hover:bg-[#e55a2b] rounded-xl shadow-[0_8px_24px_-6px_rgba(255,107,53,0.45)] transition-all"
                    >
                      {t.registerFree}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
