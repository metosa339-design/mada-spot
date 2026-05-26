'use client';

import { useCurrency, Currency } from '@/contexts/CurrencyContext';

const currencies: { id: Currency; label: string; flag: string }[] = [
  { id: 'MGA', label: 'Ar', flag: '🇲🇬' },
  { id: 'EUR', label: '€', flag: '🇪🇺' },
  { id: 'USD', label: '$', flag: '🇺🇸' },
];

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center bg-[#1A1A1F] backdrop-blur-sm rounded-full border border-[#3F3F46] overflow-hidden">
      {currencies.map((c) => (
        <button
          key={c.id}
          onClick={() => setCurrency(c.id)}
          className={`px-2.5 py-1.5 text-xs font-medium transition-all ${
            currency === c.id
              ? 'bg-[#FF6B35] text-white'
              : 'text-white/60 hover:text-white hover:bg-[#1A1A1F]'
          }`}
          title={`Afficher en ${c.id}`}
        >
          <span className="hidden sm:inline mr-0.5">{c.flag}</span>
          {c.label}
        </button>
      ))}
    </div>
  );
}
