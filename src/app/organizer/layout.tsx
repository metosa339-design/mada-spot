'use client';

// Mada Spot — Back-office Organisateur : layout + garde d'accès (ORGANIZER/ADMIN).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Wallet, Loader2, ArrowLeft } from 'lucide-react';

interface OrganizerUser {
  id: string;
  firstName: string;
  role: string;
}

const NAV = [
  { href: '/organizer/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/organizer/events', label: 'Événements & billets', icon: CalendarDays },
  { href: '/organizer/payouts', label: 'Trésorerie', icon: Wallet },
];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<OrganizerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const json = await res.json();
        if (!json.success || !json.user) {
          router.replace('/login?redirect=/organizer/dashboard');
          return;
        }
        if (!['ORGANIZER', 'ADMIN'].includes(json.user.role)) {
          router.replace('/');
          return;
        }
        setUser({ id: json.user.id, firstName: json.user.firstName, role: json.user.role });
      } catch {
        router.replace('/login?redirect=/organizer/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-2 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Accueil
            </Link>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A]">
              Espace organisateur
            </h1>
          </div>
          <span className="text-[13px] text-[#64748B]">Bonjour, {user.firstName}</span>
        </div>

        {/* Navigation par onglets */}
        <nav className="flex gap-1 mb-6 bg-white rounded-xl border border-[#E2E8F0] p-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active ? 'bg-[#FF6B35] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
