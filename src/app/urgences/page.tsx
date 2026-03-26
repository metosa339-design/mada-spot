'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Phone, MapPin, Clock, Search, ArrowLeft, Flame, Stethoscope, Building2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface EmergencyContact {
  id: string;
  name: string;
  type: string;
  phone: string;
  phone2: string | null;
  email: string | null;
  city: string;
  district: string | null;
  address: string | null;
  hours: string | null;
  is24h: boolean;
}

const typeConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  police: { icon: Shield, label: 'Police', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  gendarmerie: { icon: Shield, label: 'Gendarmerie', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  pompiers: { icon: Flame, label: 'Pompiers', color: 'text-red-600', bgColor: 'bg-red-100' },
  samu: { icon: Stethoscope, label: 'SAMU', color: 'text-green-600', bgColor: 'bg-green-100' },
  autre: { icon: Building2, label: 'Autre', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function UrgencesPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <UrgencesPage />
    </Suspense>
  );
}

function UrgencesPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, [selectedCity, selectedType]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      if (selectedType) params.set('type', selectedType);

      const res = await fetch(`/api/emergency-contacts?${params}`);
      const data = await res.json();

      if (data.success) {
        setContacts(data.contacts);
        if (cities.length === 0) {
          setCities(data.cities);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const types = ['police', 'gendarmerie', 'pompiers', 'samu'];

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

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Contacts d'Urgence</h1>
                <p className="text-blue-100">Police, Gendarmerie, Pompiers, SAMU</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
              <input
                type="text"
                placeholder="Rechercher par nom ou quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedType('')}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                !selectedType
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a24] text-gray-300 border border-[#2a2a36] hover:border-blue-300'
              }`}
            >
              Tous
            </button>
            {types.map(type => {
              const config = typeConfig[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type === selectedType ? '' : type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    selectedType === type
                      ? `${config.bgColor} ${config.color}`
                      : 'bg-[#1a1a24] text-gray-300 border border-[#2a2a36] hover:border-blue-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* City Filter */}
          <div className="mb-6">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a36] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les villes</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
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
          ) : filteredContacts.length === 0 ? (
            <div className="bg-[#1a1a24] rounded-xl p-8 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucun contact trouvé</h3>
              <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact, index) => {
                const config = typeConfig[contact.type] || typeConfig.autre;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#1a1a24] rounded-xl p-6 border border-[#2a2a36] hover:border-[#3a3a46] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                            <span className={`text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-400 ml-12">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{contact.district ? `${contact.district}, ` : ''}{contact.city}</span>
                          </div>
                          {contact.address && (
                            <p className="text-gray-500 ml-6">{contact.address}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{contact.is24h ? '24h/24' : contact.hours || 'Non spécifié'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {contact.phone}
                        </a>
                        {contact.phone2 && (
                          <a
                            href={`tel:${contact.phone2}`}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            {contact.phone2}
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
