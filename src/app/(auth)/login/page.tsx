'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useCsrf } from '@/hooks/useCsrf';
import { useTrans } from '@/i18n';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  const t = useTrans('auth');
  return <div className="bg-[#111114] rounded-xl border border-[#27272A] p-8 text-center text-[#A1A1AA]">{t.loading}</div>;
}

function LoginForm() {
  const t = useTrans('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    identifier: prefillEmail,
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { csrfToken } = useCsrf();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, csrfToken }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.loginError);
      }

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.userType) {
        router.push('/dashboard');
      } else {
        router.push('/bons-plans');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const registerClientHref = redirectTo
    ? `/register?redirect=${encodeURIComponent(redirectTo)}`
    : '/register';

  return (
    <div className="bg-[#111114] rounded-xl border border-[#27272A] p-8">
      <div className="text-center mb-8">
        <Image src="/logo.png" alt="Mada Spot" width={48} height={48} className="w-12 h-12 mx-auto mb-4 object-contain" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-2">Connexion</p>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.loginTitle}</h1>
        <p className="text-[#A1A1AA] text-[13px] leading-relaxed">
          {t.loginDesc}
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-400">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email ou Téléphone */}
        <div>
          <label htmlFor="login-identifier" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">
            {t.emailOrPhone}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" aria-hidden="true" />
            <input
              id="login-identifier"
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder={t.emailOrPhonePlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
              required
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="login-password" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">
            {t.password}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t.passwordPlaceholder}
              className="w-full pl-10 pr-10 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
              required
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

        {/* Mot de passe oublié */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[12px] text-[#A1A1AA] hover:text-[#FF6B35] transition-colors">
            {t.forgotPassword}
          </Link>
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.loginInProgress}
            </>
          ) : (
            t.loginButton
          )}
        </button>
      </form>

      {/* Lien d'inscription */}
      <div className="mt-8 text-center">
        <p className="text-[13px] text-[#A1A1AA]">
          {t.noAccountYet}{' '}
          <Link href={registerClientHref} className="text-[#FF6B35] hover:text-[#F97316] font-medium transition-colors">
            {t.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
}
