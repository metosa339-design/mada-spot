'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useCsrf } from '@/hooks/useCsrf';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center text-slate-400">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [formData, setFormData] = useState({
    identifier: '',
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
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Vérification email obligatoire (sauf admin)
      if (!data.user.isVerified && data.user.role !== 'ADMIN') {
        router.push('/verify-account');
        return;
      }

      // Si un redirect est spécifié, y aller directement
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Sinon, rediriger selon le rôle et le type
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.userType) {
        // Prestataire → dashboard pro
        router.push('/dashboard');
      } else {
        // Voyageur/client → bons plans
        router.push('/bons-plans');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const registerClientHref = redirectTo
    ? `/register?redirect=${encodeURIComponent(redirectTo)}`
    : '/register';

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
      <div className="text-center mb-8">
        <Image src="/logo.png" alt="Mada Spot" width={56} height={56} className="w-14 h-14 mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-white mb-2">Connexion</h1>
        <p className="text-slate-400">
          Accédez à votre espace Mada Spot
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email ou Téléphone */}
        <div>
          <label htmlFor="login-identifier" className="block text-sm font-medium text-slate-300 mb-2">
            Email ou Téléphone
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              id="login-identifier"
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder="exemple@email.com ou +261 34 XX XXX XX"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Votre mot de passe"
              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mot de passe oublié */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      {/* Lien d'inscription */}
      <div className="mt-8 text-center">
        <p className="text-slate-400">
          Pas encore de compte ?{' '}
          <Link href={registerClientHref} className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
