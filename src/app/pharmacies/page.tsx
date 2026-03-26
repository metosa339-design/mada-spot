'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Phone, MapPin, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Pharmacy {
  id: string;
  name: string;
  address: string | null;
  city: string;
  district: string | null;
  phone: string;
  phone2: string | null;
  isOnGuard: boolean;
  guardStartDate: string | null;
  guardEndDate: string | null;
}

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Antananarivo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacies();
  }, [selectedCity]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      params.set('onGuard', 'true');

      const res = await fetch(`/api/pharmacies?${params}`);
      const data = await res.json();

      if (data.success) {
        setPharmacies(data.pharmacies);
        if (cities.length === 0) {
          setCities(data.cities);
        }
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatGuardPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          {/* Header avec sélecteur de ville */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Pill className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pharmacies de Garde</h1>
                <p className="text-green-100">Sélectionnez votre ville</p>
              </div>
            </div>

            {/* Sélecteur de ville */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer"
              style={{ backgroundImage: 'none' }}
            >
              {cities.map(city => (
                <option key={city} value={city} className="text-gray-900">{city}</option>
              ))}
            </select>
          </div>

          {/* Titre de la ville */}
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-white">
              Pharmacies de garde à {selectedCity}
            </h2>
          </div>

          {/* Results */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#1a1a24] rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-white/10 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : pharmacies.length === 0 ? (
            <div className="bg-[#1a1a24] rounded-xl p-8 text-center">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucune pharmacie de garde</h3>
              <p className="text-gray-500">Aucune pharmacie de garde trouvée à {selectedCity}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pharmacies.map((pharmacy, index) => (
                <motion.div
                  key={pharmacy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1a1a24] rounded-xl p-6 border border-[#2a2a36] hover:border-[#3a3a46] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{pharmacy.name}</h3>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          De garde
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-400">
                        {pharmacy.district && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{pharmacy.district}</span>
                          </div>
                        )}
                        {pharmacy.address && (
                          <p className="text-gray-500 ml-6">{pharmacy.address}</p>
                        )}
                        {pharmacy.guardStartDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{formatGuardPeriod(pharmacy.guardStartDate, pharmacy.guardEndDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <a
                        href={`tel:${pharmacy.phone}`}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {pharmacy.phone}
                      </a>
                      {pharmacy.phone2 && (
                        <a
                          href={`tel:${pharmacy.phone2}`}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm"
                        >
                          <Phone className="w-4 h-4" />
                          {pharmacy.phone2}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
