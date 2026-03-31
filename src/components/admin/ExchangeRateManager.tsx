'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Loader2, RefreshCw, Plus, Save } from 'lucide-react';

interface ExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: string | null;
  fetchedAt: string;
}

const CURRENCIES = [
  { code: 'MGA', label: 'Ariary malgache' },
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'Dollar US' },
  { code: 'GBP', label: 'Livre sterling' },
  { code: 'CNY', label: 'Yuan chinois' },
  { code: 'ZAR', label: 'Rand sud-africain' },
];

export default function ExchangeRateManager() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ baseCurrency: 'MGA', targetCurrency: 'EUR', rate: '' });

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exchange-rates');
      const data = await res.json();
      if (data.success) {
        setRates(data.rates);
      }
    } catch (err) {
      console.error('Fetch rates error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const handleSave = async () => {
    if (!form.rate || parseFloat(form.rate) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          baseCurrency: form.baseCurrency,
          targetCurrency: form.targetCurrency,
          rate: parseFloat(form.rate),
          source: 'manual',
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ baseCurrency: 'MGA', targetCurrency: 'EUR', rate: '' });
        fetchRates();
      }
    } catch (err) {
      console.error('Save rate error:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {rates.length} taux de change configuré{rates.length > 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRates} className="p-2 hover:bg-gray-100 rounded-lg" title="Rafraîchir" aria-label="Rafraîchir les taux">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Devise de base</label>
              <select
                value={form.baseCurrency}
                onChange={(e) => setForm({ ...form, baseCurrency: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Devise cible</label>
              <select
                value={form.targetCurrency}
                onChange={(e) => setForm({ ...form, targetCurrency: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {CURRENCIES.filter((c) => c.code !== form.baseCurrency).map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Taux (1 {form.baseCurrency} = ? {form.targetCurrency})</label>
              <input
                type="number"
                step="0.0001"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="Ex: 4950"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.rate}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Liste des taux */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun taux de change configuré</p>
          <p className="text-sm mt-1">Ajoutez les taux pour MGA/EUR, MGA/USD, etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map((rate) => (
            <div key={rate.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-lg">
                    {rate.baseCurrency}/{rate.targetCurrency}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                  {rate.source || 'manual'}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {rate.rate.toLocaleString('fr-FR', { maximumFractionDigits: 4 })}
              </div>
              <div className="text-xs text-gray-400">
                1 {rate.baseCurrency} = {rate.rate.toLocaleString('fr-FR', { maximumFractionDigits: 4 })} {rate.targetCurrency}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Mis à jour : {formatDate(rate.fetchedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
