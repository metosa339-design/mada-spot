'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: '+261', flag: '🇲🇬', name: 'Madagascar', short: 'MG', placeholder: '34 XX XXX XX' },
  { code: '+33', flag: '🇫🇷', name: 'France', short: 'FR', placeholder: '6 12 34 56 78' },
  { code: '+1', flag: '🇺🇸', name: 'États-Unis', short: 'US', placeholder: '202 555 0123' },
  { code: '+44', flag: '🇬🇧', name: 'Royaume-Uni', short: 'GB', placeholder: '7911 123456' },
  { code: '+32', flag: '🇧🇪', name: 'Belgique', short: 'BE', placeholder: '470 12 34 56' },
  { code: '+41', flag: '🇨🇭', name: 'Suisse', short: 'CH', placeholder: '76 123 45 67' },
  { code: '+1', flag: '🇨🇦', name: 'Canada', short: 'CA', placeholder: '514 555 0123' },
  { code: '+262', flag: '🇷🇪', name: 'La Réunion', short: 'RE', placeholder: '692 12 34 56' },
  { code: '+269', flag: '🇰🇲', name: 'Comores', short: 'KM', placeholder: '321 23 45' },
  { code: '+230', flag: '🇲🇺', name: 'Maurice', short: 'MU', placeholder: '5251 1234' },
  { code: '+27', flag: '🇿🇦', name: 'Afrique du Sud', short: 'ZA', placeholder: '71 123 4567' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya', short: 'KE', placeholder: '712 345678' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzanie', short: 'TZ', placeholder: '712 345 678' },
  { code: '+86', flag: '🇨🇳', name: 'Chine', short: 'CN', placeholder: '131 1234 5678' },
  { code: '+81', flag: '🇯🇵', name: 'Japon', short: 'JP', placeholder: '90 1234 5678' },
  { code: '+49', flag: '🇩🇪', name: 'Allemagne', short: 'DE', placeholder: '151 1234 5678' },
  { code: '+39', flag: '🇮🇹', name: 'Italie', short: 'IT', placeholder: '312 345 6789' },
  { code: '+34', flag: '🇪🇸', name: 'Espagne', short: 'ES', placeholder: '612 34 56 78' },
  { code: '+91', flag: '🇮🇳', name: 'Inde', short: 'IN', placeholder: '98765 43210' },
  { code: '+971', flag: '🇦🇪', name: 'Émirats arabes unis', short: 'AE', placeholder: '50 123 4567' },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  error?: string
  variant?: 'dark' | 'light'
}

export default function PhoneInput({
  value,
  onChange,
  placeholder,
  className,
  id,
  error,
  variant = 'dark',
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Parse current country from value
  const getSelected = () => {
    for (const c of COUNTRIES) {
      if (value.startsWith(c.code)) return c
    }
    return COUNTRIES[0] // Default Madagascar
  }

  const selected = getSelected()

  // Get the number part (without country code)
  const numberPart = value.startsWith(selected.code)
    ? value.slice(selected.code.length).trimStart()
    : value.replace(/^\+\d+\s*/, '')

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    onChange(`${country.code} ${numberPart}`)
    setOpen(false)
    setSearch('')
  }

  const handleNumberChange = (num: string) => {
    onChange(`${selected.code} ${num}`)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search) ||
        c.short.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES

  const isDark = variant === 'dark'

  return (
    <div ref={ref} className="relative">
      <div className={`flex ${className || ''}`}>
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 px-3 rounded-l-xl border-r-0 text-sm shrink-0 transition-colors ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              : 'bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100'
          } ${error ? (isDark ? 'border-red-500/50' : 'border-red-400') : ''}`}
        >
          <span className="text-base">{selected.flag}</span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selected.code}</span>
          <ChevronDown className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'} transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Number input */}
        <input
          id={id}
          type="tel"
          value={numberPart}
          onChange={e => handleNumberChange(e.target.value)}
          placeholder={placeholder || selected.placeholder || '34 XX XXX XX'}
          className={`flex-1 min-w-0 px-3 py-2.5 rounded-r-xl text-sm focus:outline-none transition-colors ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/50'
              : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500'
          } ${error ? (isDark ? 'border-red-500/50' : 'border-red-400') : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className={`absolute top-full left-0 mt-1 w-72 rounded-xl shadow-xl border overflow-hidden z-50 ${
          isDark ? 'bg-[#1a1a24] border-white/10' : 'bg-white border-gray-200'
        }`}>
          {/* Search */}
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              autoFocus
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'
              }`}
            />
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((country, i) => (
              <button
                key={`${country.short}-${i}`}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isDark
                    ? 'hover:bg-white/5 text-white'
                    : 'hover:bg-gray-50 text-gray-700'
                } ${country.short === selected.short ? (isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600') : ''}`}
              >
                <span className="text-base">{country.flag}</span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{country.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className={`px-4 py-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aucun pays trouvé</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
