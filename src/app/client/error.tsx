'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Une erreur est survenue</h2>
        <p className="text-slate-400 mb-4">
          Nous nous excusons pour ce désagrément. Veuillez réessayer.
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <pre className="text-left text-xs text-red-400 bg-red-500/10 rounded-lg p-3 mb-6 max-h-40 overflow-auto whitespace-pre-wrap break-words">
            {error?.message || 'Erreur inconnue'}
            {error?.stack && `\n\n${error.stack}`}
          </pre>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            Réessayer
          </button>
          <Link
            href="/client"
            className="px-6 py-3 bg-[#1a1a24] border border-[#2a2a36] text-slate-300 font-medium rounded-xl hover:border-orange-500/50 transition-all"
          >
            Mon espace
          </Link>
        </div>
      </div>
    </div>
  );
}
