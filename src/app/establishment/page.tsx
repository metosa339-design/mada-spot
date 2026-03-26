'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import {
  Building2, Hotel, UtensilsCrossed, Compass, Star, Eye, MessageCircle,
  ChevronRight, Loader2, LogOut, MapPin, Plus,
} from 'lucide-react';

export default function MyEstablishmentsPage() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
        const sessionData = await sessionRes.json();
        if (!sessionData.success || !sessionData.user) {
          router.push('/login');
          return;
        }
        setUser(sessionData.user);

        const res = await fetch('/api/establishments/my', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setEstablishments(data.establishments || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [router]);

  const typeIcons: Record<string, any> = { HOTEL: Hotel, RESTAURANT: UtensilsCrossed, ATTRACTION: Compass };
  const typeColors: Record<string, string> = { HOTEL: '#3b82f6', RESTAURANT: '#f97316', ATTRACTION: '#10b981' };
  const typeLabels: Record<string, string> = { HOTEL: 'Hôtel', RESTAURANT: 'Restaurant', ATTRACTION: 'Attraction' };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060610] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mes Établissements</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user && `${user.firstName} ${user.lastName}`} — Gérez vos fiches
            </p>
          </div>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Retour au site
          </Link>
        </div>

        {/* Establishments list */}
        {establishments.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Aucun établissement</h2>
            <p className="text-sm text-gray-500 mb-6">
              Vous n'avez pas encore revendiqué d'établissement.
              <br />Trouvez votre établissement et cliquez sur "Revendiquer cette fiche".
            </p>
            <Link href="/bons-plans" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors">
              <Plus className="w-4 h-4" /> Parcourir les établissements
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {establishments.map((est: any) => {
              const TypeIcon = typeIcons[est.type] || Building2;
              const color = typeColors[est.type] || '#6b7280';
              return (
                <Link key={est.id} href={`/establishment/${est.id}`}
                  className="flex items-center gap-4 p-5 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl hover:border-[#ff6b35]/30 transition-all group">
                  {est.coverImage ? (
                    <div className="relative w-20 h-20 rounded-xl flex-shrink-0">
                      <Image src={getImageUrl(est.coverImage)} alt={est.name} fill sizes="80px" className="rounded-xl object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#080810] flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-8 h-8" style={{ color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{est.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>
                        {typeLabels[est.type] || est.type}
                      </span>
                      {est.moderationStatus === 'approved' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Actif</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {est.city}{est.district ? `, ${est.district}` : ''}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {est.rating > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" /> {est.rating.toFixed(1)}</span>
                      )}
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {est.viewCount} vues</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {est.reviewCount} avis</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#ff6b35] transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
