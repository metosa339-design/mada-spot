'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Lock, Bell, Save, CheckCircle,
  Eye, EyeOff, Building2, Shield
} from 'lucide-react'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar: string
  companyName: string
  city: string
  nif: string
  stat: string
}

export default function ParametresPage() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: '', lastName: '', email: '', phone: '', avatar: '',
    companyName: '', city: '', nif: '', stat: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile')
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [notifications, setNotifications] = useState({
    emailBooking: true,
    emailMessage: true,
    emailReview: true,
    pushBooking: true,
    pushMessage: true,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        const user = data.user
        setProfile({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar: user.avatar || '',
          companyName: user.clientProfile?.companyName || '',
          city: user.clientProfile?.city || '',
          nif: user.clientProfile?.nif || '',
          stat: user.clientProfile?.stat || '',
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPass !== passwordData.confirm) {
      alert('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.newPass.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.newPass,
        }),
      })
      if (res.ok) {
        alert('Mot de passe mis à jour avec succès')
        setPasswordData({ current: '', newPass: '', confirm: '' })
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (err) {
      console.error('Error changing password:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-[400px] bg-[#1a1a24] rounded-2xl animate-pulse" />
      </div>
    )
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'security' as const, label: 'Sécurité', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1a24] border border-white/10 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#ff6b35] text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Informations personnelles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Prénom</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Informations entreprise
            </h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom de l&apos;entreprise</label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile(p => ({ ...p, companyName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff6b35]/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">NIF</label>
                <input
                  type="text"
                  value={profile.nif}
                  onChange={(e) => setProfile(p => ({ ...p, nif: e.target.value }))}
                  placeholder="Numéro d'identification fiscale"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">STAT</label>
                <input
                  type="text"
                  value={profile.stat}
                  onChange={(e) => setProfile(p => ({ ...p, stat: e.target.value }))}
                  placeholder="Numéro statistique"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#ff6b35] hover:bg-[#e55a2b] text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Enregistrer'}
          </button>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Changer le mot de passe
          </h3>

          {['current', 'newPass', 'confirm'].map((field) => (
            <div key={field}>
              <label className="block text-xs text-gray-400 mb-1">
                {field === 'current' ? 'Mot de passe actuel' :
                 field === 'newPass' ? 'Nouveau mot de passe' : 'Confirmer le mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordData[field as keyof typeof passwordData]}
                  onChange={(e) => setPasswordData(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ff6b35]/50"
                />
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleChangePassword}
            disabled={!passwordData.current || !passwordData.newPass || !passwordData.confirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] hover:bg-[#e55a2b] text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            Mettre à jour
          </button>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Préférences de notification
          </h3>

          {[
            { key: 'emailBooking', label: 'Nouvelle réservation', desc: 'Recevoir un email à chaque réservation' },
            { key: 'emailMessage', label: 'Nouveau message', desc: 'Recevoir un email pour chaque message client' },
            { key: 'emailReview', label: 'Nouvel avis', desc: 'Recevoir un email quand un client laisse un avis' },
            { key: 'pushBooking', label: 'Notifications push', desc: 'Notifications dans le navigateur pour les réservations' },
            { key: 'pushMessage', label: 'Push messages', desc: 'Notifications dans le navigateur pour les messages' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-[#ff6b35]' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                  notifications[item.key as keyof typeof notifications] ? 'left-6' : 'left-0.5'
                }`} />
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
