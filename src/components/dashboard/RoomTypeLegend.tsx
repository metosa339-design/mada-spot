import type { RoomTypeColor } from '@/lib/data/room-type-colors'

interface RoomTypeLegendProps {
  roomTypes: { id: string; name: string }[]
  colorMap: Map<string, RoomTypeColor>
}

export default function RoomTypeLegend({ roomTypes, colorMap }: RoomTypeLegendProps) {
  if (roomTypes.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {roomTypes.map(rt => {
        const color = colorMap.get(rt.id)
        if (!color) return null
        return (
          <span key={rt.id} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
            {rt.name}
          </span>
        )
      })}
    </div>
  )
}
