'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Lock,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Bell,
  ShieldCheck,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCsrf } from '@/hooks/useCsrf';
import PhoneInput from '@/components/ui/PhoneInput';

export default function ClientSettingsPage() {
  const router = useRouter();
  const { csrfToken } = useCsrf();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // OTP verification
  const [otpModal, setOtpModal] = useState<'email' | 'phone' | null>(null);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpMsg, setOtpMsg] = useState({ type: '', text: '' });
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [showPw, setShowPw] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetch('/api/client/profile', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) { router.push('/login'); return null; }
        return res.json();
      })
      .then((data) => {
        if (data?.profile) {
          setProfile({
            firstName: data.profile.firstName || '',
            lastName: data.profile.lastName || '',
            email: data.profile.email || '',
            phone: data.profile.phone || '',
          });
          setEmailVerified(data.profile.emailVerified || false);
          setPhoneVerified(data.profile.phoneVerified || false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch notification preferences
    fetch('/api/client/notification-preferences', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.preferences) setNotifPrefs(d.preferences); })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [router]);

  const handleSaveNotifPrefs = async () => {
    setNotifSaving(true);
    setNotifMsg('');
    try {
      const res = await fetch('/api/client/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences: notifPrefs, csrfToken }),
      });
      if (res.ok) setNotifMsg('Préférences sauvegardées');
      else setNotifMsg('Erreur');
    } catch {
      setNotifMsg('Erreur de connexion');
    } finally {
      setNotifSaving(false);
      setTimeout(() => setNotifMsg(''), 3000);
    }
  };

  const NOTIF_GROUPS = [
    { label: 'Réservations', types: ['BOOKING_NEW', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED'] },
    { label: 'Avis & Messages', types: ['REVIEW_NEW', 'MESSAGE_NEW'] },
    { label: 'Activité', types: ['CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'EVENT_NEW', 'GHOST_CREATED'] },
    { label: 'Système', types: ['SYSTEM', 'IMPORT_COMPLETED'] },
  ];

  const NOTIF_LABELS: Record<string, string> = {
    BOOKING_NEW: 'Nouvelle réservation',
    BOOKING_CONFIRMED: 'Réservation confirmée',
    BOOKING_CANCELLED: 'Réservation annulée',
    BOOKING_COMPLETED: 'Réservation terminée',
    REVIEW_NEW: 'Nouvel avis',
    MESSAGE_NEW: 'Nouveau message',
    CLAIM_SUBMITTED: 'Revendication soumise',
    CLAIM_APPROVED: 'Revendication approuvée',
    CLAIM_REJECTED: 'Revendication refusée',
    EVENT_NEW: 'Nouvel événement',
    GHOST_CREATED: 'Lieu communautaire créé',
    SYSTEM: 'Notifications système',
    IMPORT_COMPLETED: 'Import terminé',
  };

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  // Handle OTP digit input
  const handleOtpDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);
    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleVerifyOtp(newCode.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setOtpCode(newCode);
      handleVerifyOtp(pasted);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    setOtpMsg({ type: '', text: '' });
    setOtpCode(['', '', '', '', '', '']);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csrfToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpMsg({ type: 'success', text: 'Code envoyé par email' });
        setOtpCooldown(60);
      } else {
        setOtpMsg({ type: 'error', text: data.error || 'Erreur lors de l\'envoi' });
      }
    } catch {
      setOtpMsg({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setOtpVerifying(true);
    setOtpMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, csrfToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpMsg({ type: 'success', text: 'Vérification réussie !' });
        if (otpModal === 'email') setEmailVerified(true);
        if (otpModal === 'phone') setPhoneVerified(true);
        setTimeout(() => setOtpModal(null), 1500);
      } else {
        setOtpMsg({ type: 'error', text: data.error || 'Code invalide' });
        setOtpCode(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch {
      setOtpMsg({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...profile, csrfToken }),
      });
      if (res.ok) setSaveMsg('Profil mis à jour');
      else setSaveMsg('Erreur lors de la sauvegarde');
    } catch {
      setSaveMsg('Erreur de connexion');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg({ type: '', text: '' });
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Minimum 8 caractères' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
          csrfToken,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwMsg({ type: 'success', text: 'Mot de passe modifié' });
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError('Mot de passe requis'); return; }
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword, csrfToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/');
      } else {
        setDeleteError(data.error || 'Erreur');
      }
    } catch {
      setDeleteError('Erreur de connexion');
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = "w-full bg-[#080810] border border-[#2a2a36] rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#ff6b35] focus:outline-none";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <Link href="/client" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Mon espace
        </Link>
        <h1 className="text-2xl font-bold text-white mb-8">Paramètres du compte</h1>

        {/* Profil */}
        <section className="bg-[#1a1a24] rounded-2xl border border-[#2a2a36] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#ff6b35]" />
            <h2 className="font-semibold text-lg text-white">Informations personnelles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Prénom</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Nom</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                {emailVerified ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Vérifié
                  </span>
                ) : profile.email ? (
                  <button
                    onClick={() => { setOtpModal('email'); setOtpMsg({ type: '', text: '' }); setOtpCode(['', '', '', '', '', '']); }}
                    className="text-[10px] text-[#ff6b35] hover:text-[#ff8555] font-medium flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" /> Vérifier
                  </button>
                ) : null}
              </div>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Téléphone
                </label>
                {phoneVerified ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Vérifié
                  </span>
                ) : profile.phone ? (
                  <span className="text-[10px] text-gray-500">
                    Non vérifié
                  </span>
                ) : null}
              </div>
              <PhoneInput
                value={profile.phone}
                onChange={(val) => setProfile({ ...profile, phone: val })}
                variant="dark"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] text-white rounded-xl text-sm font-medium hover:bg-[#e55a2b] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
            {saveMsg && (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> {saveMsg}
              </span>
            )}
          </div>
        </section>

        {/* Mot de passe */}
        <section className="bg-[#1a1a24] rounded-2xl border border-[#2a2a36] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-[#ff6b35]" />
            <h2 className="font-semibold text-lg text-white">Changer le mot de passe</h2>
          </div>
          <div className="space-y-3 max-w-sm">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Mot de passe actuel"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              type="password"
              placeholder="Nouveau mot de passe (min. 8 car.)"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className={inputClass}
            />
          </div>
          {pwMsg.text && (
            <div className={`mt-3 text-sm ${pwMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
              {pwMsg.text}
            </div>
          )}
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#2a2a36] text-white rounded-xl text-sm font-medium hover:bg-[#3a3a46] disabled:opacity-50"
          >
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Modifier le mot de passe
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-[#1a1a24] rounded-2xl border border-[#2a2a36] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#ff6b35]" />
            <h2 className="font-semibold text-lg text-white">Préférences de notifications</h2>
          </div>
          {notifLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-5">
              {NOTIF_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{group.label}</p>
                  <div className="space-y-2">
                    {group.types.map(type => (
                      <div key={type} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-300">{NOTIF_LABELS[type] || type}</span>
                        <button
                          type="button"
                          onClick={() => setNotifPrefs(prev => ({ ...prev, [type]: !prev[type] }))}
                          className={`relative w-10 h-5.5 rounded-full transition-colors ${
                            notifPrefs[type] !== false ? 'bg-[#ff6b35]' : 'bg-[#2a2a36]'
                          }`}
                          style={{ width: 40, height: 22 }}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform ${
                              notifPrefs[type] !== false ? 'translate-x-[18px]' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveNotifPrefs}
                  disabled={notifSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] text-white rounded-xl text-sm font-medium hover:bg-[#e55a2b] disabled:opacity-50"
                >
                  {notifSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
                {notifMsg && (
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {notifMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* OTP Verification Modal */}
        {otpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setOtpModal(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#ff6b35]/10 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-[#ff6b35]" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Vérification {otpModal === 'email' ? 'email' : 'téléphone'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Un code à 6 chiffres sera envoyé à{' '}
                  <span className="text-white font-medium">
                    {otpModal === 'email' ? profile.email : profile.phone}
                  </span>
                </p>
              </div>

              {/* Send OTP button */}
              <button
                onClick={handleSendOtp}
                disabled={otpSending || otpCooldown > 0}
                className="w-full mb-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-[#ff6b35] text-white hover:bg-[#e55a2b] disabled:opacity-50"
              >
                {otpSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : otpCooldown > 0 ? (
                  `Renvoyer dans ${otpCooldown}s`
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Envoyer le code
                  </>
                )}
              </button>

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-xl font-bold bg-[#080810] border border-[#2a2a36] rounded-xl text-white focus:border-[#ff6b35] focus:outline-none transition-colors"
                    style={{ height: 52 }}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={() => handleVerifyOtp(otpCode.join(''))}
                disabled={otpVerifying || otpCode.some(d => !d)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {otpVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Vérifier le code
                  </>
                )}
              </button>

              {/* Message */}
              {otpMsg.text && (
                <div className={`mt-3 text-center text-sm ${otpMsg.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {otpMsg.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suppression de compte */}
        <section className="bg-[#1a1a24] rounded-2xl border border-red-500/20 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h2 className="font-semibold text-lg text-red-400">Supprimer mon compte</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Cette action est irréversible. Toutes vos données (réservations, avis, favoris, messages) seront définitivement supprimées.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/10"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Confirmez la suppression en entrant votre mot de passe
              </div>
              <input
                type="password"
                placeholder="Votre mot de passe"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full bg-[#080810] border border-red-500/30 rounded-xl px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none max-w-sm"
              />
              {deleteError && <div className="text-sm text-red-400">{deleteError}</div>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirmer la suppression
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                  className="px-4 py-2 text-gray-400 text-sm hover:bg-[#2a2a36] rounded-xl"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
