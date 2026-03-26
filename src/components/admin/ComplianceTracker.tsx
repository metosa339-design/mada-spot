'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert, Users, FileWarning, AlertTriangle, CheckCircle,
  Image as ImageIcon, MapPin, Phone, FileText,
  Loader2, Building2
} from 'lucide-react'

interface NewRegistration {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  userType: string | null
  createdAt: string
  lastLoginAt: string | null
  profileCompletion: number
  verificationDocs: { total: number; verified: number; pending: number; rejected: number }
  hasEstablishment: boolean
}

interface EstablishmentIssue {
  id: string
  name: string
  type: string
  city: string
  claimedByName: string | null
  issues: string[]
}

interface DocCompliance {
  totalPros: number
  withNif: number
  withStat: number
  withLicense: number
  withIdCard: number
  fullyVerified: number
  noDocsSubmitted: number
}

interface ComplianceStats {
  totalNewRegistrations: number
  prosWithoutDocs: number
  lowQualityEstablishments: number
  complianceRate: number
}

const ISSUE_LABELS: Record<string, { label: string; icon: typeof ImageIcon; color: string }> = {
  no_cover: { label: 'Pas de photo de couverture', icon: ImageIcon, color: 'text-red-400' },
  no_images: { label: 'Aucune photo', icon: ImageIcon, color: 'text-red-400' },
  short_description: { label: 'Description trop courte', icon: FileText, color: 'text-amber-400' },
  no_gps: { label: 'Pas de coordonnées GPS', icon: MapPin, color: 'text-amber-400' },
  no_phone: { label: 'Pas de téléphone', icon: Phone, color: 'text-orange-400' },
}

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hôtel', RESTAURANT: 'Restaurant', ATTRACTION: 'Attraction', PROVIDER: 'Prestataire',
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: '90', label: '3 derniers mois' },
]

export default function ComplianceTracker() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeSection, setActiveSection] = useState<'registrations' | 'documents' | 'quality'>('registrations')

  const [registrations, setRegistrations] = useState<NewRegistration[]>([])
  const [docCompliance, setDocCompliance] = useState<DocCompliance>({ totalPros: 0, withNif: 0, withStat: 0, withLicense: 0, withIdCard: 0, fullyVerified: 0, noDocsSubmitted: 0 })
  const [qualityIssues, setQualityIssues] = useState<EstablishmentIssue[]>([])
  const [stats, setStats] = useState<ComplianceStats>({ totalNewRegistrations: 0, prosWithoutDocs: 0, lowQualityEstablishments: 0, complianceRate: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`/api/admin/compliance?${params}`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        const d = json.data || json
        setRegistrations(d.newRegistrations || [])
        setDocCompliance(d.documentCompliance || docCompliance)
        setQualityIssues(d.establishmentQuality || [])
        setStats(d.stats || stats)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [period, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const getCompletionColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400'
    if (pct >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getCompletionBg = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nouveaux inscrits', value: stats.totalNewRegistrations, icon: Users, color: 'text-blue-400', bg: 'from-blue-500/20 to-indigo-500/20' },
          { label: 'Pros sans docs', value: stats.prosWithoutDocs, icon: FileWarning, color: 'text-red-400', bg: 'from-red-500/20 to-rose-500/20' },
          { label: 'Fiches à corriger', value: stats.lowQualityEstablishments, icon: AlertTriangle, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20' },
          { label: 'Taux de conformité', value: `${stats.complianceRate}%`, icon: ShieldAlert, color: stats.complianceRate >= 70 ? 'text-emerald-400' : 'text-red-400', bg: stats.complianceRate >= 70 ? 'from-emerald-500/20 to-teal-500/20' : 'from-red-500/20 to-rose-500/20' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.bg} border border-white/5 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Section tabs */}
        <div className="flex gap-2 flex-1">
          {[
            { id: 'registrations' as const, label: 'Inscriptions', icon: Users },
            { id: 'documents' as const, label: 'Documents', icon: FileText },
            { id: 'quality' as const, label: 'Qualité Fiches', icon: Building2 },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === s.id ? 'bg-[#ff6b35] text-white' : 'bg-[#0c0c16] text-gray-400 border border-[#1e1e2e] hover:border-[#ff6b35]/50'
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Period + Type */}
        <div className="flex gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]"
          >
            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]"
          >
            <option value="all">Tous les types</option>
            <option value="HOTEL">Hôtels</option>
            <option value="RESTAURANT">Restaurants</option>
            <option value="ATTRACTION">Attractions</option>
            <option value="PROVIDER">Prestataires</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : (
        <>
          {/* Section 1: New Registrations */}
          {activeSection === 'registrations' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Nouveaux inscrits — {period === '7' ? '7 derniers jours' : period === '30' ? '30 derniers jours' : '3 derniers mois'}
              </h3>
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Aucune nouvelle inscription sur cette période</p>
                </div>
              ) : (
                registrations.map(reg => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35]/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#ff6b35]">{reg.firstName[0]}{reg.lastName[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{reg.firstName} {reg.lastName}</span>
                          {reg.userType ? (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">{TYPE_LABELS[reg.userType] || reg.userType}</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Voyageur</span>
                          )}
                          {reg.hasEstablishment && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Fiche publiée</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{reg.email || reg.phone || 'N/A'}</p>
                      </div>

                      {/* Profile completion */}
                      <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className={`text-sm font-bold ${getCompletionColor(reg.profileCompletion)}`}>{reg.profileCompletion}%</p>
                          <p className="text-[10px] text-gray-500">Profil</p>
                        </div>
                        <div className="w-16 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                          <div className={`h-full ${getCompletionBg(reg.profileCompletion)} rounded-full transition-all`} style={{ width: `${reg.profileCompletion}%` }} />
                        </div>
                      </div>

                      {/* Verification docs */}
                      {reg.userType && (
                        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                          <div className={`text-center px-3 py-1.5 rounded-lg ${
                            reg.verificationDocs.verified >= 2 ? 'bg-emerald-500/20' : reg.verificationDocs.total > 0 ? 'bg-amber-500/20' : 'bg-red-500/20'
                          }`}>
                            <p className={`text-sm font-bold ${
                              reg.verificationDocs.verified >= 2 ? 'text-emerald-400' : reg.verificationDocs.total > 0 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {reg.verificationDocs.verified}/{reg.verificationDocs.total}
                            </p>
                            <p className="text-[10px] text-gray-500">Docs</p>
                          </div>
                        </div>
                      )}

                      <div className="text-right text-xs text-gray-500 flex-shrink-0">
                        <p>{new Date(reg.createdAt).toLocaleDateString('fr-FR')}</p>
                        {reg.lastLoginAt && (
                          <p className="text-gray-600">Vu {new Date(reg.lastLoginAt).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Section 2: Document Compliance */}
          {activeSection === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Conformité documentaire des prestataires</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Pros', value: docCompliance.totalPros, color: 'text-white' },
                  { label: 'Avec NIF', value: docCompliance.withNif, color: 'text-emerald-400' },
                  { label: 'Avec STAT', value: docCompliance.withStat, color: 'text-emerald-400' },
                  { label: 'Avec Licence', value: docCompliance.withLicense, color: 'text-cyan-400' },
                  { label: 'Avec CIN', value: docCompliance.withIdCard, color: 'text-cyan-400' },
                  { label: 'Tout vérifié', value: docCompliance.fullyVerified, color: 'text-emerald-400' },
                ].map(item => (
                  <div key={item.label} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                    {docCompliance.totalPros > 0 && (
                      <div className="mt-2 w-full h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <div className="h-full bg-[#ff6b35] rounded-full" style={{ width: `${Math.round((item.value / docCompliance.totalPros) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Alert: Pros without docs */}
              {docCompliance.noDocsSubmitted > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      {docCompliance.noDocsSubmitted} prestataire{docCompliance.noDocsSubmitted > 1 ? 's' : ''} n&apos;{docCompliance.noDocsSubmitted > 1 ? 'ont' : 'a'} soumis aucun document
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Ces comptes sont actifs mais non vérifiés</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Establishment Quality */}
          {activeSection === 'quality' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Fiches à corriger ({qualityIssues.length})
              </h3>
              {qualityIssues.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Toutes les fiches sont conformes</p>
                </div>
              ) : (
                qualityIssues.map(est => (
                  <motion.div
                    key={est.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{est.name}</span>
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">{TYPE_LABELS[est.type] || est.type}</span>
                        </div>
                        <p className="text-sm text-gray-500">{est.city}{est.claimedByName ? ` — ${est.claimedByName}` : ''}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        est.issues.length >= 3 ? 'bg-red-500/20 text-red-400' : est.issues.length >= 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {est.issues.length} problème{est.issues.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {est.issues.map(issue => {
                        const config = ISSUE_LABELS[issue]
                        if (!config) return null
                        const IssueIcon = config.icon
                        return (
                          <span key={issue} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e1e2e] rounded-lg text-xs">
                            <IssueIcon className={`w-3 h-3 ${config.color}`} />
                            <span className="text-gray-400">{config.label}</span>
                          </span>
                        )
                      })}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
