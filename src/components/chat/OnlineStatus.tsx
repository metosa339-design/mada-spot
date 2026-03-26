'use client'

import type { PresenceState } from './types'

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'Hors ligne'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Vu à l\'instant'
  if (diff < 3600) return `Vu il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Vu il y a ${Math.floor(diff / 3600)}h`
  return `Vu il y a ${Math.floor(diff / 86400)}j`
}

export function OnlineStatus({ presence }: { presence: PresenceState | null }) {
  if (!presence) return null

  if (presence.online) {
    return (
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-green-400">En ligne</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-gray-500" />
      <span className="text-[10px] text-gray-500">{formatLastSeen(presence.lastSeen)}</span>
    </div>
  )
}
