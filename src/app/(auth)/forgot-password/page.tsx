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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 w-full max-w-md mx-auto">

      {sent ? (
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t.forgotEmailSentTitle}</h2>
          <p className="text-sm text-slate-400 mb-6">
            {t.forgotEmailSentDescBefore} <strong className="text-white">{email}</strong>{t.forgotEmailSentDescAfter}
          </p>
          <Link href="/login" className="text-sm text-[#ff6b35] hover:underline">
            {t.backToLogin}
          </Link>
        </div>
      ) : (
        <>
          <Link href="/login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Link>

          <h1 className="text-xl font-bold text-white mb-2">{t.forgotTitle}</h1>
          <p className="text-sm text-slate-400 mb-6">
            {t.forgotDesc}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="sr-only">{t.forgotEmailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
                <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder={t.forgotEmailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#ff6b35] focus:outline-none" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#ff6b35] to-[#ff1493] text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t.sendLink}
            </button>
          </form>
        </>
      )}
    </motion.div>
  );
}
