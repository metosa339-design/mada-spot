'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, MapPin, Mail, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCsrf } from '@/hooks/useCsrf';
import PhoneInput from '@/components/ui/PhoneInput';

const SUBJECTS = [
  'Question générale',
  'Problème technique',
  'Signaler un abus',
  'Partenariat',
  'Suggestion',
  'Autre',
];

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

function validateField(field: string, value: string): string | undefined {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Le nom est requis';
      if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
      if (value.trim().length > 100) return 'Le nom ne doit pas dépasser 100 caractères';
      return undefined;
    case 'email':
      if (!value.trim()) return 'L\'email est requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Format d\'email invalide';
      return undefined;
    case 'phone':
      if (value.trim() && !/^[+]?[\d\s()-]{6,20}$/.test(value.trim())) return 'Format de téléphone invalide';
      return undefined;
    case 'subject':
      if (!value) return 'Veuillez choisir un sujet';
      return undefined;
    case 'message':
      if (!value.trim()) return 'Le message est requis';
      if (value.trim().length < 10) return 'Le message doit contenir au moins 10 caractères';
      if (value.trim().length > 5000) return 'Le message ne doit pas dépasser 5000 caractères';
      return undefined;
    default:
      return undefined;
  }
}

export default function ContactPage() {
  const { csrfToken } = useCsrf();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field as keyof typeof form]);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const errors: FieldErrors = {};
    for (const field of ['name', 'email', 'phone', 'subject', 'message'] as const) {
      const err = validateField(field, form[field]);
      if (err) errors[field] = err;
    }
    setFieldErrors(errors);
    setTouched({ name: true, email: true, phone: true, subject: true, message: true });

    if (Object.keys(errors).length > 0) return;

    setSending(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, csrfToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h1>
          <p className="text-gray-500 mb-6">Nous avons bien reçu votre message et reviendrons vers vous dans les plus brefs délais.</p>
          <Link href="/" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <h1 className="text-3xl font-bold">Contactez-nous</h1>
          <p className="mt-2 text-white/80">Une question ? Un problème ? Notre équipe est là pour vous aider.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-5">
              <Mail className="w-6 h-6 text-orange-500 mb-2" />
              <h3 className="font-semibold text-sm">Email</h3>
              <p className="text-sm text-gray-500 mt-1">support@madaspot.mg</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <Phone className="w-6 h-6 text-orange-500 mb-2" />
              <h3 className="font-semibold text-sm">Téléphone</h3>
              <p className="text-sm text-gray-500 mt-1">+261 34 00 000 00</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <MapPin className="w-6 h-6 text-orange-500 mb-2" />
              <h3 className="font-semibold text-sm">Adresse</h3>
              <p className="text-sm text-gray-500 mt-1">Antananarivo, Madagascar</p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nom complet *</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${touched.name && fieldErrors.name ? 'border-red-400' : ''}`}
                    placeholder="Votre nom"
                  />
                  {touched.name && fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${touched.email && fieldErrors.email ? 'border-red-400' : ''}`}
                    placeholder="votre@email.com"
                  />
                  {touched.email && fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Téléphone</label>
                  <PhoneInput
                    value={form.phone}
                    onChange={(val) => handleChange('phone', val)}
                    variant="light"
                    error={touched.phone && fieldErrors.phone ? fieldErrors.phone : undefined}
                  />
                  {touched.phone && fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sujet *</label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    onBlur={() => handleBlur('subject')}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${touched.subject && fieldErrors.subject ? 'border-red-400' : ''}`}
                  >
                    <option value="">Choisir un sujet</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {touched.subject && fieldErrors.subject && <p className="text-xs text-red-500 mt-1">{fieldErrors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Message *</label>
                <textarea
                  required
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${touched.message && fieldErrors.message ? 'border-red-400' : ''}`}
                  placeholder="Décrivez votre demande..."
                />
                <div className="flex justify-between mt-1">
                  {touched.message && fieldErrors.message ? <p className="text-xs text-red-500">{fieldErrors.message}</p> : <span />}
                  <span className="text-xs text-gray-400">{form.message.length}/5000</span>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {sending ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
