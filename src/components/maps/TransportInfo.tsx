'use client';

import { useMemo, useState } from 'react';
import { Bus, ChevronDown, ChevronUp, MapPin, Banknote } from 'lucide-react';
import { findBusLinesNearZone, type BusLine } from '@/lib/data/antananarivo-bus-lines';

interface TransportInfoProps {
  city: string;
  district?: string;
  destinationName?: string;
}

export default function TransportInfo({ city, district, destinationName: _destinationName }: TransportInfoProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  const nearbyLines = useMemo(() => {
    // Only show for Antananarivo
    if (!city.toLowerCase().includes('antananarivo') && !city.toLowerCase().includes('tana')) {
      return [];
    }

    const lines: BusLine[] = [];

    // Search by district first
    if (district) {
      lines.push(...findBusLinesNearZone(district));
    }

    // If no results from district, try city name
    if (lines.length === 0) {
      lines.push(...findBusLinesNearZone('Analakely')); // Default central lines
    }

    // Deduplicate
    const seen = new Set<string>();
    return lines.filter((l) => {
      if (seen.has(l.lineNumber)) return false;
      seen.add(l.lineNumber);
      return true;
    });
  }, [city, district]);

  if (nearbyLines.length === 0) return null;

  const displayedLines = showAll ? nearbyLines : nearbyLines.slice(0, 4);
  const hasMore = nearbyLines.length > 4;

  return (
    <div className="bg-[#0a0a0f] border border-[#2a2a36] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="w-4 h-4 text-[#ff6b35]" />
          <h4 className="text-sm font-semibold text-white">Taxi-Be à proximité</h4>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a2e] rounded-md">
          <Banknote className="w-3 h-3 text-green-400" />
          <span className="text-[10px] text-gray-400">~500 Ar</span>
        </div>
      </div>

      <div className="space-y-2">
        {displayedLines.map((line) => (
          <div key={line.lineNumber}>
            <button
              onClick={() => setExpandedLine(expandedLine === line.lineNumber ? null : line.lineNumber)}
              className="flex items-center gap-3 w-full px-3 py-2.5 bg-[#1a1a2e] rounded-lg hover:bg-[#1e1e35] transition-colors text-left"
            >
              <div
                className="flex-shrink-0 w-10 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: line.color }}
              >
                {line.lineNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{line.name}</p>
                <p className="text-xs text-gray-500 truncate">{line.route.join(' → ')}</p>
              </div>
              {expandedLine === line.lineNumber ? (
                <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>

            {/* Expanded route details */}
            {expandedLine === line.lineNumber && (
              <div className="mt-1 ml-4 pl-4 border-l-2 border-[#2a2a36] space-y-1.5 py-2">
                {line.route.map((stop, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === line.route.length - 1;
                  const isNearDestination = district && stop.toLowerCase().includes(district.toLowerCase());

                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isNearDestination
                            ? 'bg-[#ff6b35] ring-2 ring-[#ff6b35]/30'
                            : isFirst || isLast
                            ? 'bg-white'
                            : 'bg-gray-600'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isNearDestination
                            ? 'text-[#ff6b35] font-semibold'
                            : isFirst || isLast
                            ? 'text-white font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        {stop}
                      </span>
                      {isNearDestination && (
                        <MapPin className="w-3 h-3 text-[#ff6b35]" />
                      )}
                    </div>
                  );
                })}
                <div className="pt-1">
                  <p className="text-[10px] text-gray-600">
                    Quartiers desservis : {line.zones.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more / less button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Voir les {nearbyLines.length - 4} autres lignes
            </>
          )}
        </button>
      )}
    </div>
  );
}
