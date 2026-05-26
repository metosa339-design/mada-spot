'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, MapPin, Mail, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCsrf } from '@/hooks/useCsrf';
import PhoneInput from '@/components/ui/PhoneInput';
import { useTrans } from '@/i18n';

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const t = useTrans('contact');
  const { csrfToken } = useCsrf();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const SUBJECTS = [
    t.subjectGeneral,
    t.subjectTechnical,
    t.subjectAbuse,
    t.subjectPartnership,
    t.subjectSuggestion,
    t.subjectOther,
  ];

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return t.nameRequired;
        if (value.trim().length < 2) return t.nameMin;
        if (value.trim().length > 100) return t.nameMax;
        return undefined;
      case 'email':
        if (!value.trim()) return t.emailRequired;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return t.emailInvalid;
        return undefined;
      case 'phone':
        if (value.trim() && !/^[+]?[\d\s()-]{6,20}$/.test(value.trim())) return t.phoneInvalid;
        return undefined;
      case 'subject':
        if (!value) return t.subjectRequired;
        return undefined;
      case 'message':
        if (!value.trim()) return t.messageRequired;
        if (value.trim().length < 10) return t.messageMin;
        if (value.trim().length > 5000) return t.messageMax;
        return undefined;
      default:
        return undefined;
    }
  };

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
        setError(data.error || t.sendError);
      }
    } catch {
      setError(t.connectionError);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="text-center max-w-md">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.sentTitle}</h2>
          <p className="text-[#A1A1AA] text-[14px] mb-6 leading-relaxed">{t.sentDesc}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
          >
            {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  const inputClasses = (hasError: boolean) =>
    `w-full bg-[#1A1A1F] border rounded-lg px-3.5 py-2.5 text-[14px] text-[#FAFAFA] placeholder-[#71717A] focus:outline-none transition-colors ${
      hasError ? 'border-red-500/50 focus:border-red-500' : 'border-[#27272A] focus:border-[#FF6B35]/40'
    }`;

  return (
    <div className="min-h-screen bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="relative bg-[#0A0A0F] pt-28 pb-10 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[400px] h-[400px] bg-[#FF6B35] rounded-full blur-[120px] opacity-[0.10] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px] mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backHome}
          </Link>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Nous contacter</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] text-[#FAFAFA]">{t.title}</h1>
          <p className="mt-2 text-[#A1A1AA] text-[15px] leading-relaxed max-w-2xl">{t.subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <div className="bg-[#111114] rounded-xl border border-[#27272A] p-5">
              <Mail className="w-5 h-5 text-[#FF6B35] mb-3" />
              <h3 className="font-semibold text-[#FAFAFA] text-[13px]">{t.email}</h3>
              <p className="text-[12px] font-mono text-[#A1A1AA] mt-1">support@madaspot.com</p>
            </div>
            <div className="bg-[#111114] rounded-xl border border-[#27272A] p-5">
              <Phone className="w-5 h-5 text-[#FF6B35] mb-3" />
              <h3 className="font-semibold text-[#FAFAFA] text-[13px]">{t.phoneWa}</h3>
              <a href="tel:+261341688296" className="block text-[12px] font-mono text-[#D4D4D8] mt-1 hover:text-[#FF6B35] transition-colors">
                +261 34 16 88 296
              </a>
              <a
                href="https://wa.me/261341688296"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[11px] text-emerald-400 hover:text-emerald-300 mt-2"
              >
                {t.chatWa}
              </a>
            </div>
            <div className="bg-[#111114] rounded-xl border border-[#27272A] p-5">
              <MapPin className="w-5 h-5 text-[#FF6B35] mb-3" />
              <h3 className="font-semibold text-[#FAFAFA] text-[13px]">{t.address}</h3>
              <p className="text-[12px] text-[#A1A1AA] mt-1">{t.addressValue}</p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-[#111114] rounded-xl border border-[#27272A] p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5 block">{t.fullName}</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={inputClasses(Boolean(touched.name && fieldErrors.name))}
                    placeholder={t.namePlaceholder}
                  />
                  {touched.name && fieldErrors.name && <p className="text-[11px] text-red-400 mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5 block">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={inputClasses(Boolean(touched.email && fieldErrors.email))}
                    placeholder={t.emailPlaceholder}
                  />
                  {touched.email && fieldErrors.email && <p className="text-[11px] text-red-400 mt-1">{fieldErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5 block">{t.phoneLabel}</label>
                  <PhoneInput
                    value={form.phone}
                    onChange={(val) => handleChange('phone', val)}
                    variant="light"
                    error={touched.phone && fieldErrors.phone ? fieldErrors.phone : undefined}
                  />
                  {touched.phone && fieldErrors.phone && <p className="text-[11px] text-red-400 mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5 block">{t.subjectLabel}</label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    onBlur={() => handleBlur('subject')}
                    className={inputClasses(Boolean(touched.subject && fieldErrors.subject))}
                  >
                    <option value="">{t.chooseSubject}</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {touched.subject && fieldErrors.subject && <p className="text-[11px] text-red-400 mt-1">{fieldErrors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5 block">{t.messageLabel}</label>
                <textarea
                  required
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  className={`${inputClasses(Boolean(touched.message && fieldErrors.message))} resize-none`}
                  placeholder={t.messagePlaceholder}
                />
                <div className="flex justify-between mt-1.5">
                  {touched.message && fieldErrors.message ? <p className="text-[11px] text-red-400">{fieldErrors.message}</p> : <span />}
                  <span className="text-[11px] font-mono text-[#71717A]">{form.message.length}/5000</span>
                </div>
              </div>

              {error && (
                <div className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium disabled:opacity-50 transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? t.sending : t.sendMessage}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
