'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useTrans } from '@/i18n';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetFallback() {
  const t = useTrans('auth');
  return <div className="bg-[#111114] rounded-xl border border-[#27272A] p-8 text-center text-[#A1A1AA]">{t.loading}</div>;
}

function ResetPasswordForm() {
  const t = useTrans('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#111114] rounded-xl border border-[#27272A] p-8 text-center"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.invalidLinkTitle}</h2>
        <p className="text-[13px] text-[#A1A1AA] mb-5 leading-relaxed">{t.invalidLinkDesc}</p>
        <Link href="/forgot-password" className="text-[13px] text-[#FF6B35] hover:underline">
          {t.requestNewLink}
        </Link>
      </motion.div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || t.otpError);
      }
    } catch {
      setError(t.networkError);
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#111114] rounded-xl border border-[#27272A] p-8 text-center"
      >
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.resetSuccessTitle}</h2>
        <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{t.resetSuccessDesc}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#111114] rounded-xl border border-[#27272A] p-8 w-full max-w-md mx-auto"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-2">Sécurité</p>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.resetTitle}</h1>
      <p className="text-[13px] text-[#A1A1AA] mb-6 leading-relaxed">{t.resetDesc}</p>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-new-password" className="sr-only">{t.newPasswordLabel}</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" aria-hidden="true" />
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder={t.newPasswordPlaceholder}
              minLength={6}
              className="w-full pl-10 pr-10 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className="sr-only">{t.confirmPasswordLabel}</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" aria-hidden="true" />
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder={t.confirmPasswordLabel}
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
          {t.resetButton}
        </button>
      </form>
    </motion.div>
  );
}
