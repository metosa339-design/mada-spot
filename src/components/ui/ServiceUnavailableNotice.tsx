'use client';

import { RefreshCw, ServerCrash } from 'lucide-react';

interface ServiceUnavailableNoticeProps {
  /** Ce que le visiteur cherchait : « les hotels », « les restaurants »... */
  subject?: string;
  onRetry?: () => void;
}

/**
 * Ecran servi quand la base ne repond pas.
 *
 * Le but est de ne pas mentir au visiteur. Un etat « aucun resultat » sur une panne
 * lui fait croire que Madagascar n'a pas d'hotels a proposer, et il ne revient pas.
 * Un message d'indisponibilite assume le probleme et l'invite a repasser.
 */
export default function ServiceUnavailableNotice({
  subject = 'ces contenus',
  onRetry,
}: ServiceUnavailableNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 px-6 py-14 text-center dark:border-orange-900/40 dark:bg-orange-950/20"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B35]/10">
        <ServerCrash className="h-7 w-7 text-[#FF6B35]" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Service momentanement indisponible
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Nous ne parvenons pas a charger {subject} pour le moment. Le probleme vient de chez
          nous, pas de votre connexion. Nos equipes sont dessus, reessayez dans quelques minutes.
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E85A28] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reessayer
        </button>
      )}
    </div>
  );
}
