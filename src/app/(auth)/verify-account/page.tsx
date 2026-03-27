'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyAccountPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) setSessionExpired(true);
      })
      .catch(() => setSessionExpired(true))
      .finally(() => setSessionChecked(true));
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Fetch CSRF token
  const getCsrfToken = useCallback(async () => {
    try {
      const res = await fetch('/api/csrf');
      const data = await res.json();
      return data.token || '';
    } catch {
      return '';
    }
  }, []);

  // Handle digit input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (value && index === 5 && newCode.every((d) => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  // Verify OTP
  const handleVerify = async (codeStr?: string) => {
    const finalCode = codeStr || code.join('');
    if (finalCode.length !== 6) {
      setError('Entrez un code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: finalCode, csrfToken }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/client'), 1500);
      } else {
        setError(data.error || 'Code invalide');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setError('');

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken }),
      });

      const data = await res.json();

      if (data.success) {
        setResendCooldown(60);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Impossible de renvoyer le code');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setResendLoading(false);
    }
  };

  // Session expired guard
  if (sessionChecked && sessionExpired) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Votre session a expiré</h2>
        <p className="text-gray-400 text-sm mb-6">
          Veuillez vous reconnecter pour vérifier votre compte.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
            bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 transition-all"
        >
          Retour à la connexion
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Wait for session check
  if (!sessionChecked) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Compte vérifié !</h2>
        <p className="text-gray-400 mb-6">Redirection vers votre espace...</p>
        <div className="w-8 h-8 mx-auto border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Vérifiez votre email</h1>
        <p className="text-gray-400 text-sm">
          Nous avons envoyé un code à 6 chiffres à votre adresse email.
          <br />
          Entrez-le ci-dessous pour activer votre compte.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Vérifiez également votre dossier spam / courrier indésirable
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-xl border-2
              bg-[#1a1a24] text-white outline-none transition-all duration-200
              ${error
                ? 'border-red-500/50 focus:border-red-500'
                : digit
                  ? 'border-orange-500/50 focus:border-orange-500'
                  : 'border-gray-700 focus:border-orange-500'
              }
              focus:ring-2 focus:ring-orange-500/20
            `}
            disabled={loading}
            autoFocus={index === 0}
          />
        ))}
      </div>

      {/* Expiry warning */}
      <p className="text-gray-500 text-xs text-center mb-4">
        Le code expire dans 15 minutes
      </p>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm text-center mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* Verify Button */}
      <button
        onClick={() => handleVerify()}
        disabled={loading || code.some((d) => !d)}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200
          bg-gradient-to-r from-orange-500 to-pink-500
          hover:from-orange-600 hover:to-pink-600
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Vérifier mon compte
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Resend */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm mb-2">Vous n&apos;avez pas reçu le code ?</p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className="text-orange-400 hover:text-orange-300 text-sm font-medium
            disabled:text-gray-600 disabled:cursor-not-allowed
            inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
          {resendCooldown > 0
            ? `Renvoyer dans ${resendCooldown}s`
            : resendLoading
              ? 'Envoi...'
              : 'Renvoyer le code'
          }
        </button>
      </div>
    </div>
  );
}
