'use client';

import { memo } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import ClaimButton from './ClaimButton';

interface SourceAttributionProps {
  establishmentId: string;
  establishmentName: string;
  sourceAttribution?: string | null;
  sourceUrl?: string | null;
  isClaimed?: boolean;
  dataSource?: string | null;
}

export default memo(function SourceAttribution({
  establishmentId,
  establishmentName,
  sourceAttribution,
  sourceUrl,
  isClaimed,
  dataSource,
}: SourceAttributionProps) {
  // Only show for imported establishments
  if (!dataSource || dataSource === 'manual') return null;

  return (
    <div className="border-t border-slate-200 pt-4 mt-6 space-y-3">
      {sourceAttribution && (
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Source des informations : {sourceAttribution} via Mada Spot API.
            Les informations peuvent avoir changé depuis la dernière mise à jour.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir la fiche originale
          </a>
        )}

        {!isClaimed && (
          <ClaimButton
            establishmentId={establishmentId}
            establishmentName={establishmentName}
            isClaimed={isClaimed}
          />
        )}
      </div>
    </div>
  );
});
