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
import { useTrans } from '@/i18n'

export default function RegisterClientPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterClientForm />
    </Suspense>
  )
}

function RegisterFallback() {
  const t = useTrans('auth')
  return <div className="bg-[#111114] rounded-xl border border-[#27272A] p-8 text-center text-[#A1A1AA]">{t.loading}</div>
}

const TYPE_ICONS: Record<string, any> = {
  HOTEL: Hotel,
  RESTAURANT: UtensilsCrossed,
  ATTRACTION: Mountain,
  PROVIDER: Briefcase,
}

function RegisterClientForm() {
  const t = useTrans('auth')
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
        setOtpMsg({ type: 'success', text: t.otpResentSuccess })
      } else {
        setOtpMsg({ type: 'error', text: data.error || t.otpError })
      }
    } catch {
      setOtpMsg({ type: 'error', text: t.connectionError })
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
        setOtpMsg({ type: 'success', text: t.otpEmailVerified })
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
        setOtpMsg({ type: 'error', text: data.error || t.otpIncorrect })
        setOtpCode(['', '', '', '', '', ''])
        document.getElementById('rotp-0')?.focus()
      }
    } catch {
      setOtpMsg({ type: 'error', text: t.connectionError })
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
        throw new Error(t.serverErrorRetry)
      }

      if (!response.ok) {
        if (data.details) {
          setFieldErrors(data.details)
        }
        throw new Error(data.error || t.registerError)
      }

      // Account created + session set → redirect to appropriate page
      if (paramType && paramSubtype) {
        window.location.href = `/publier-lieu?type=${paramType}&subtype=${encodeURIComponent(paramSubtype)}`
      } else if (paramType) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = redirectTo || '/client'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.registerError)
    } finally {
      setIsLoading(false)
    }
  }

  // OTP Verification Screen
  if (showOtpStep) {
    return (
      <div className="bg-[#111114] rounded-xl border border-[#27272A] p-8">
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

          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.otpVerifyEmail}</h2>
          <p className="text-[#A1A1AA] mb-2">
            {t.otpSentTo}
          </p>
          <p className="text-white font-semibold mb-1">{formData.email}</p>
          {formData.phone && (
            <p className="text-xs text-[#71717A] mb-6">
              <Phone className="w-3 h-3 inline mr-1" />
              {t.otpPhoneLabel} {formData.phone}
            </p>
          )}

          <div className="bg-[#1A1A1F] border border-[#27272A] rounded-lg p-5 mb-6">
            <p className="text-sm text-[#D4D4D8] mb-4">
              {t.otpInstruction}
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
                  className="w-12 h-14 text-center text-2xl font-mono font-semibold bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] focus:border-[#FF6B35]/40 focus:outline-none transition-colors"
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
              className="w-full py-3 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium rounded-lg shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {otpVerifying ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t.otpVerifying}</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> {t.otpVerifyCode}</>
              )}
            </button>
          </div>

          {/* Resend */}
          <div className="space-y-2">
            <p className="text-xs text-[#71717A]">
              {t.otpNoCode}
            </p>
            <button
              onClick={handleSendOtp}
              disabled={otpSending || otpCooldown > 0}
              className="text-sm text-[#FF6B35] hover:text-[#F97316] font-medium disabled:opacity-50 disabled:text-[#52525B]"
            >
              {otpSending ? (
                <><Loader2 className="w-3 h-3 inline animate-spin mr-1" /> {t.otpSending}</>
              ) : otpCooldown > 0 ? (
                t.otpResendIn.replace('{seconds}', String(otpCooldown))
              ) : (
                t.otpResend
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
            className="mt-6 text-xs text-[#52525B] hover:text-[#A1A1AA] transition-colors"
          >
            {t.otpSkip}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-[#111114] rounded-xl border border-[#27272A] p-8">
      {/* Badge type/subtype si inscription depuis /register */}
      {category && subtypeInfo && TypeIcon && (
        <div className="mb-6 flex items-center gap-3 p-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-xl">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${category.gradient} shrink-0`}>
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {t.inscriptionLabel} : {category.label}
            </p>
            <p className="text-xs text-orange-300">{subtypeInfo.label}</p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
          <User className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">
          {category ? t.registerProTitle : t.registerTitle}
        </h1>
        <p className="text-[#A1A1AA]">
          {category
            ? t.registerProDesc.replace('{category}', category.label.toLowerCase())
            : t.registerDesc}
        </p>
      </div>

      {/* Avantages client (masquer si inscription pro) */}
      {!category && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { icon: Search, label: t.featureSearch },
            { icon: MessageCircle, label: t.featureContact },
            { icon: Heart, label: t.favoritesLabel },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1F] border border-[#27272A] rounded-md text-xs text-[#A1A1AA]">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-firstName" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">{t.firstName}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" aria-hidden="true" />
              <input
                id="reg-firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t.firstNamePlaceholder}
                className="w-full pl-12 pr-4 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
                required
              />
            </div>
            {fieldErrors.firstName && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.firstName[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-lastName" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">{t.lastName}</label>
            <input
              id="reg-lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder={t.lastNamePlaceholder}
              className="w-full px-4 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
              required
            />
            {fieldErrors.lastName && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.lastName[0]}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">{t.email}</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" aria-hidden="true" />
            <input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t.emailPlaceholder}
              className="w-full pl-12 pr-4 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Téléphone */}
        <div>
          <label htmlFor="reg-phone" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">{t.phone}</label>
          <PhoneInput
            id="reg-phone"
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            error={fieldErrors.phone?.[0]}
            variant="light"
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.phone[0]}</p>
          )}
        </div>

        {/* Mot de passe */}
        <div>
          <label htmlFor="reg-password" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">{t.password}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" aria-hidden="true" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t.passwordMinPlaceholder}
              className="w-full pl-12 pr-12 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
              aria-label={showPassword ? t.hidePassword : t.showPassword}
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
          <label htmlFor="reg-confirmPassword" className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-[#A1A1AA] mb-1.5">{t.confirmPassword}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" aria-hidden="true" />
            <input
              id="reg-confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder={t.confirmPasswordPlaceholder}
              className="w-full pl-12 pr-4 py-3 bg-[#1A1A1F] border border-[#27272A] rounded-lg text-[#FAFAFA] placeholder:text-[#71717A] text-[14px] focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
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
            className="mt-1 w-4 h-4 rounded border-[#27272A] bg-[#1A1A1F] text-[#FF6B35] focus:ring-orange-500/50"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-[#A1A1AA]">
            {t.termsAccept}{' '}
            <span className="text-orange-400">{t.termsLink}</span>{' '}
            {t.privacyConnector}{' '}
            <span className="text-orange-400">{t.privacyLink}</span>{' '}
            {t.termsSuffix}
          </label>
        </div>

        {/* Bouton */}
        <button
          type="submit"
          disabled={isLoading || !formData.acceptTerms}
          className="w-full py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium rounded-lg shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.registerInProgress}
            </>
          ) : (
            <>
              {t.createAccountCta}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Lien connexion */}
      <div className="mt-8 text-center">
        <p className="text-[#A1A1AA]">
          {t.haveAccountAlready}{' '}
          <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="text-[#FF6B35] hover:text-[#F97316] font-medium transition-colors">
            {t.logIn}
          </Link>
        </p>
      </div>
    </div>
  )
}
