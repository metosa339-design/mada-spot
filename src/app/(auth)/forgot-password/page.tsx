'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useTrans } from '@/i18n';

export default function ForgotPasswordPage() {
  const t = useTrans('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || t.otpError);
      }
    } catch {
      setError(t.networkError);
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#111114] rounded-xl border border-[#27272A] p-8 w-full max-w-md mx-auto"
    >
      {sent ? (
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.forgotEmailSentTitle}</h2>
          <p className="text-[13px] text-[#A1A1AA] mb-6 leading-relaxed">
            {t.forgotEmailSentDescBefore} <strong className="text-[#FAFAFA] font-mono">{email}</strong>{t.forgotEmailSentDescAfter}
          </p>
          <Link href="/login" className="text-[13px] text-[#FF6B35] hover:underline">
            {t.backToLogin}
          </Link>
        </div>
      ) : (
        <>
          <Link href="/login" className="flex items-center gap-1.5 text-[12px] text-[#A1A1AA] hover:text-[#FAFAFA] mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.back}
          </Link>

          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-2">Réinitialisation</p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.forgotTitle}</h1>
          <p className="text-[13px] text-[#A1A1AA] mb-6 leading-relaxed">
            {t.forgotDesc}
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="sr-only">{t.forgotEmailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" aria-hidden="true" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={t.forgotEmailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t.sendLink}
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
}
