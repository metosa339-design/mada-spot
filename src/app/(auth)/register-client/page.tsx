'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  Heart,
  MessageCircle,
  Hotel,
  UtensilsCrossed,
  Mountain,
  Briefcase,
  ShieldCheck,
  Phone,
} from 'lucide-react'
import { useCsrf } from '@/hooks/useCsrf'
import PhoneInput from '@/components/ui/PhoneInput'
import { getCategoryByType, getSubtype } from '@/data/registration-types'

export default function RegisterClientPage() {
  return (
    <Suspense fallback={<div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center text-slate-400">Chargement...</div>}>
      <RegisterClientForm />
    </Suspense>
  )
}

const TYPE_ICONS: Record<string, any> = {
  HOTEL: Hotel,
  RESTAURANT: UtensilsCrossed,
  ATTRACTION: Mountain,
  PROVIDER: Briefcase,
}

function RegisterClientForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  // Lire type/subtype depuis query params ou sessionStorage
  const paramType = searchParams.get('type')
  const paramSubtype = searchParams.get('subtype')
  const category = paramType ? getCategoryByType(paramType) : null
  const subtypeInfo = paramType && paramSubtype ? getSubtype(paramType, paramSubtype) : null
  const TypeIcon = paramType ? TYPE_ICONS[paramType] || User : null

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const { csrfToken } = useCsrf()

  // OTP verification step
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showOtpStep, _setShowOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpMsg, setOtpMsg] = useState({ type: '', text: '' })
  const [otpCooldown, setOtpCooldown] = useState(0)

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCooldown])

  const handleSendOtp = async () => {
    setOtpSending(true)
    setOtpMsg({ type: '', text: '' })
    try {
      const res = await fetch('/api/contact-verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOtpCooldown(60)
        setOtpMsg({ type: 'success', text: 'Code renvoyé ! Vérifiez votre boîte mail.' })
      } else {
        setOtpMsg({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch {
      setOtpMsg({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async (code: string) => {
    setOtpVerifying(true)
    setOtpMsg({ type: '', text: '' })
    try {
      const res = await fetch('/api/contact-verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOtpMsg({ type: 'success', text: 'Email vérifié ! Redirection...' })
        // Also mark user as verified via the auth OTP endpoint
        fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code }),
        }).catch(() => {})
        // Redirect after short delay
        setTimeout(() => {
          if (paramType && paramSubtype) {
            router.push(`/publier-lieu?type=${paramType}&subtype=${encodeURIComponent(paramSubtype)}`)
          } else if (paramType) {
            router.push('/dashboard')
          } else {
            router.push(redirectTo || '/bons-plans')
          }
        }, 1500)
      } else {
        setOtpMsg({ type: 'error', text: data.error || 'Code incorrect' })
        setOtpCode(['', '', '', '', '', ''])
        document.getElementById('rotp-0')?.focus()
      }
    } catch {
      setOtpMsg({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const nc = [...otpCode]
    nc[index] = value
    setOtpCode(nc)
    if (value && index < 5) document.getElementById(`rotp-${index + 1}`)?.focus()
    if (value && index === 5 && nc.every(d => d !== '')) handleVerifyOtp(nc.join(''))
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`rotp-${index - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtpCode(pasted.split(''))
      handleVerifyOtp(pasted)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'CLIENT',
          userType: paramType || undefined,
          csrfToken,
        }),
        credentials: 'include',
      })

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error("Erreur serveur. Veuillez réessayer.")
      }

      if (!response.ok) {
        if (data.details) {
          setFieldErrors(data.details)
        }
        throw new Error(data.error || "Erreur lors de l'inscription")
      }

      // Account created → OTP already sent by register route
      // Redirect to the unified verify-account page
      router.push('/verify-account')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  // OTP Verification Screen
  if (showOtpStep) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-2 border-orange-500/30 flex items-center justify-center">
            <Mail className="w-10 h-10 text-orange-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Vérifiez votre email</h2>
          <p className="text-slate-400 mb-2">
            Un code de confirmation à 6 chiffres a été envoyé à
          </p>
          <p className="text-white font-semibold mb-1">{formData.email}</p>
          {formData.phone && (
            <p className="text-xs text-slate-500 mb-6">
              <Phone className="w-3 h-3 inline mr-1" />
              Téléphone : {formData.phone}
            </p>
          )}

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <p className="text-sm text-slate-300 mb-4">
              Merci de valider votre email en insérant le code reçu dans votre boîte mail
            </p>

            {/* 6-digit OTP input */}
            <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  id={`rotp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded-xl text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                />
              ))}
            </div>

            {otpVerifying && (
              <div className="flex justify-center mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
              </div>
            )}

            {otpMsg.text && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm mb-3 ${otpMsg.type === 'error' ? 'text-red-400' : otpMsg.type === 'info' ? 'text-amber-400 font-mono font-bold text-lg' : 'text-emerald-400'}`}
              >
                {otpMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : <AlertCircle className="w-4 h-4 inline mr-1" />}
                {otpMsg.text}
              </motion.p>
            )}

            {/* Verify button */}
            <button
              onClick={() => handleVerifyOtp(otpCode.join(''))}
              disabled={otpVerifying || otpCode.some(d => !d)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {otpVerifying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Vérification...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Vérifier le code</>
              )}
            </button>
          </div>

          {/* Resend */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Vous n&apos;avez pas reçu le code ? Vérifiez vos spams ou
            </p>
            <button
              onClick={handleSendOtp}
              disabled={otpSending || otpCooldown > 0}
              className="text-sm text-orange-400 hover:text-orange-300 font-medium disabled:opacity-50 disabled:text-slate-600"
            >
              {otpSending ? (
                <><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> Envoi...</>
              ) : otpCooldown > 0 ? (
                `Renvoyer dans ${otpCooldown}s`
              ) : (
                'Renvoyer le code'
              )}
            </button>
          </div>

          {/* Skip link */}
          <button
            onClick={() => {
              if (paramType && paramSubtype) {
                router.push(`/publier-lieu?type=${paramType}&subtype=${encodeURIComponent(paramSubtype)}`)
              } else if (paramType) {
                router.push('/dashboard')
              } else {
                router.push(redirectTo || '/bons-plans')
              }
            }}
            className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Passer cette étape pour le moment →
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
      {/* Badge type/subtype si inscription depuis /register */}
      {category && subtypeInfo && TypeIcon && (
        <div className="mb-6 flex items-center gap-3 p-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-xl">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${category.gradient} shrink-0`}>
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Inscription : {category.label}
            </p>
            <p className="text-xs text-orange-300">{subtypeInfo.label}</p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
          <User className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {category ? 'Créer votre compte professionnel' : 'Créer un compte'}
        </h2>
        <p className="text-slate-400">
          {category
            ? `Étape 2/3 — Après inscription, vous pourrez publier votre ${category.label.toLowerCase()}`
            : 'Rejoignez Mada Spot pour découvrir les meilleurs bons plans de Madagascar'}
        </p>
      </div>

      {/* Avantages client (masquer si inscription pro) */}
      {!category && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { icon: Search, label: 'Rechercher' },
            { icon: MessageCircle, label: 'Contacter' },
            { icon: Heart, label: 'Favoris' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400">
              <item.icon className="w-3 h-3 text-orange-400" />
              {item.label}
            </div>
          ))}
        </div>
      )}

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
        {/* Nom et Prénom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-firstName" className="block text-sm font-medium text-slate-300 mb-2">Prénom</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                id="reg-firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Prénom"
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                required
              />
            </div>
            {fieldErrors.firstName && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-lastName" className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
            <input
              id="reg-lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Nom"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
            {fieldErrors.lastName && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName[0]}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre@email.com"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Téléphone */}
        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-300 mb-2">Téléphone</label>
          <PhoneInput
            id="reg-phone"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            error={fieldErrors.phone?.[0]}
            variant="dark"
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.phone[0]}</p>
          )}
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 caractères"
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
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.password[0]}</p>
          )}
        </div>

        {/* Confirmation mot de passe */}
        <div>
          <label htmlFor="reg-confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input
              id="reg-confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirmez votre mot de passe"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              required
            />
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
            )}
          </div>
        </div>

        {/* Conditions */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={formData.acceptTerms}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/50"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-slate-400">
            J&apos;accepte les{' '}
            <span className="text-orange-400">conditions d&apos;utilisation</span>{' '}
            et la{' '}
            <span className="text-orange-400">politique de confidentialité</span>{' '}
            de Mada Spot
          </label>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={isLoading || !formData.acceptTerms}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Inscription en cours...
            </>
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Lien connexion */}
      <div className="mt-8 text-center">
        <p className="text-slate-400">
          Déjà un compte ?{' '}
          <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
