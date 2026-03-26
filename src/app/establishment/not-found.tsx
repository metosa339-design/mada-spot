import Link from 'next/link';

export default function EstablishmentNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Établissement introuvable</h1>
        <p className="text-gray-400 mb-8">
          L&apos;établissement que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/bons-plans"
            className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors min-h-[44px]"
          >
            Voir les bons plans
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-white/20 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-colors min-h-[44px]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
