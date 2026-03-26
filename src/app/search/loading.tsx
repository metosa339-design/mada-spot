import { Loader2 } from 'lucide-react';

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Recherche en cours...</p>
      </div>
    </div>
  );
}
