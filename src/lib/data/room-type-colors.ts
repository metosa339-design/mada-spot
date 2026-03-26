// Distinct color palette for room types in calendar & reservation table
const ROOM_TYPE_COLORS = [
  { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', dot: 'bg-cyan-400', hex: '#22d3ee' },
  { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400', hex: '#fbbf24' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400', hex: '#34d399' },
  { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', dot: 'bg-violet-400', hex: '#a78bfa' },
  { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400', hex: '#fb7185' },
  { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400', hex: '#60a5fa' },
  { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400', hex: '#fb923c' },
  { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30', dot: 'bg-teal-400', hex: '#2dd4bf' },
]

export type RoomTypeColor = (typeof ROOM_TYPE_COLORS)[number]

export function getRoomTypeColor(index: number): RoomTypeColor {
  return ROOM_TYPE_COLORS[index % ROOM_TYPE_COLORS.length]
}

export function buildRoomTypeColorMap(roomTypes: { id: string }[]): Map<string, RoomTypeColor> {
  const map = new Map<string, RoomTypeColor>()
  roomTypes.forEach((rt, i) => {
    map.set(rt.id, ROOM_TYPE_COLORS[i % ROOM_TYPE_COLORS.length])
  })
  map.set('__general__', ROOM_TYPE_COLORS[roomTypes.length % ROOM_TYPE_COLORS.length])
  return map
}
