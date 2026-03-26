'use client';

import { useState } from 'react';
import { useCsrf } from '@/hooks/useCsrf';
import {
  Loader2,
  CheckCircle,
  Music,
  Landmark,
  Trophy,
  TreePine,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/data/event-categories';
import { PROVINCES } from '@/data/madagascar-regions';

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  region: string;
  category: string;
  coverImage: string;
  organizer: string;
  isRecurring: boolean;
  recurrenceRule: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  Landmark,
  Trophy,
  TreePine,
  ShoppingBag,
  Calendar,
};

const RADIO_COLORS: Record<string, string> = {
  pink: 'peer-checked:border-pink-500 peer-checked:bg-pink-500/10 peer-checked:text-pink-400',
  purple: 'peer-checked:border-purple-500 peer-checked:bg-purple-500/10 peer-checked:text-purple-400',
  green: 'peer-checked:border-green-500 peer-checked:bg-green-500/10 peer-checked:text-green-400',
  emerald: 'peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400',
  amber: 'peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-400',
  gray: 'peer-checked:border-gray-500 peer-checked:bg-gray-500/10 peer-checked:text-gray-300',
};

export default function EventForm() {
  const { csrfToken, csrfLoading } = useCsrf();
  const [form, setForm] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    city: '',
    region: '',
    category: '',
    coverImage: '',
    organizer: '',
    isRecurring: false,
    recurrenceRule: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Client-side validation
    if (!form.title.trim()) {
      setError('Le titre est requis');
      setIsSubmitting(false);
      return;
    }
    if (!form.startDate) {
      setError('La date de début est requise');
      setIsSubmitting(false);
      return;
    }
    if (!form.city) {
      setError('La ville est requise');
      setIsSubmitting(false);
      return;
    }
    if (!form.category) {
      setError('La catégorie est requise');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          csrfToken,
          startDate: new Date(form.startDate).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          coverImage: form.coverImage || null,
          organizer: form.organizer || null,
          location: form.location || null,
          region: form.region || null,
          recurrenceRule: form.isRecurring ? form.recurrenceRule || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Erreur lors de la soumission');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Événement soumis !
        </h3>
        <p className="text-gray-400">
          Il sera visible après validation par notre équipe.
        </p>
      </div>
    );
  }

  const inputClasses =
    'w-full px-4 py-3 rounded-xl bg-[#0c0c16] border border-[#1e1e2e] text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
  const labelClasses = 'block text-sm font-medium text-gray-300 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClasses}>
          Titre de l&apos;événement *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="Ex: Festival des baleines"
          className={inputClasses}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClasses}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Décrivez votre événement..."
          rows={4}
          className={inputClasses + ' resize-none'}
        />
      </div>

      {/* Category (radio group with icons) */}
      <div>
        <label className={labelClasses}>Catégorie *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EVENT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon] || Calendar;
            const radioColor = RADIO_COLORS[cat.color] || RADIO_COLORS.gray;
            return (
              <label key={cat.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={form.category === cat.value}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[#1e1e2e] text-gray-400 transition-all ${radioColor}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className={labelClasses}>
            Date de début *
          </label>
          <input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={handleChange}
            className={inputClasses}
            required
          />
        </div>
        <div>
          <label htmlFor="endDate" className={labelClasses}>
            Date de fin (optionnel)
          </label>
          <input
            id="endDate"
            name="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Location + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className={labelClasses}>
            Lieu précis
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="Ex: Stade Municipal"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="city" className={labelClasses}>
            Ville *
          </label>
          <select
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            className={inputClasses}
            required
          >
            <option value="">Sélectionner une ville</option>
            {PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
            <option value="Nosy Be">Nosy Be</option>
            <option value="Sainte-Marie">Sainte-Marie</option>
            <option value="Morondava">Morondava</option>
            <option value="Fort-Dauphin">Fort-Dauphin</option>
            <option value="Antsirabe">Antsirabe</option>
            <option value="Ambositra">Ambositra</option>
          </select>
        </div>
      </div>

      {/* Region */}
      <div>
        <label htmlFor="region" className={labelClasses}>
          Région (optionnel)
        </label>
        <input
          id="region"
          name="region"
          type="text"
          value={form.region}
          onChange={handleChange}
          placeholder="Ex: Diana, Analamanga..."
          className={inputClasses}
        />
      </div>

      {/* Cover image URL */}
      <div>
        <label htmlFor="coverImage" className={labelClasses}>
          Image de couverture (URL)
        </label>
        <input
          id="coverImage"
          name="coverImage"
          type="url"
          value={form.coverImage}
          onChange={handleChange}
          placeholder="https://..."
          className={inputClasses}
        />
      </div>

      {/* Organizer */}
      <div>
        <label htmlFor="organizer" className={labelClasses}>
          Organisateur
        </label>
        <input
          id="organizer"
          name="organizer"
          type="text"
          value={form.organizer}
          onChange={handleChange}
          placeholder="Nom de l'organisateur"
          className={inputClasses}
        />
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-3">
        <input
          id="isRecurring"
          name="isRecurring"
          type="checkbox"
          checked={form.isRecurring}
          onChange={handleChange}
          className="w-4 h-4 rounded border-[#1e1e2e] bg-[#0c0c16] text-orange-500 focus:ring-orange-500/50"
        />
        <label htmlFor="isRecurring" className="text-sm text-gray-300">
          Événement récurrent
        </label>
      </div>

      {form.isRecurring && (
        <div>
          <label htmlFor="recurrenceRule" className={labelClasses}>
            Règle de récurrence
          </label>
          <input
            id="recurrenceRule"
            name="recurrenceRule"
            type="text"
            value={form.recurrenceRule}
            onChange={handleChange}
            placeholder="Ex: Chaque samedi, Mensuel le 1er..."
            className={inputClasses}
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || csrfLoading}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          'Soumettre l\'événement'
        )}
      </button>
    </form>
  );
}
