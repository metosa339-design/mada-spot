'use client';

import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

// rates: Ariary par 1 unité de devise (ex: { EUR: 4950, USD: 4550 })
export default function CurrencyConverter({ rates }: { rates: Record<string, number> }) {
  const [amount, setAmount] = useState('100');
  const [cur, setCur] = useState<'EUR' | 'USD' | 'MGA'>('EUR');

  const n = parseFloat(amount.replace(',', '.')) || 0;
  const fmt = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(v));

  // Convertir le montant saisi en Ariary
  const inMGA = cur === 'MGA' ? n : n * (rates[cur] || 0);
  const results: { label: string; value: string }[] = [];
  if (cur !== 'MGA') results.push({ label: 'Ariary (Ar)', value: fmt(inMGA) + ' Ar' });
  if (cur !== 'EUR' && rates.EUR) results.push({ label: 'Euro (€)', value: fmt(inMGA / rates.EUR) + ' €' });
  if (cur !== 'USD' && rates.USD) results.push({ label: 'Dollar ($)', value: fmt(inMGA / rates.USD) + ' $' });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold"><ArrowRightLeft className="w-4 h-4 text-[#FF6B35]" /> Convertisseur</div>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-lg font-medium text-gray-900 focus:outline-none focus:border-[#FF6B35]"
        />
        <select value={cur} onChange={(e) => setCur(e.target.value as any)} className="px-3 py-3 border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-[#FF6B35]">
          <option value="EUR">EUR €</option>
          <option value="USD">USD $</option>
          <option value="MGA">Ariary</option>
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {results.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50">
            <span className="text-sm text-gray-500">{r.label}</span>
            <span className="text-lg font-bold text-gray-900">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
