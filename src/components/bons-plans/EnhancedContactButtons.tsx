'use client';

import { Phone, MessageCircle, Mail } from 'lucide-react';

interface EnhancedContactButtonsProps {
  phone?: string | null;
  phone2?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  establishmentName: string;
  establishmentId?: string;
}

function trackClick(establishmentId: string | undefined, clickType: string) {
  if (!establishmentId) return;
  try {
    const data = JSON.stringify({ establishmentId, clickType });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track-click', new Blob([data], { type: 'application/json' }));
    } else {
      fetch('/api/track-click', { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch { /* best effort */ }
}

export default function EnhancedContactButtons({
  phone,
  phone2,
  whatsapp,
  email,
  establishmentName,
  establishmentId,
}: EnhancedContactButtonsProps) {
  const whatsappMsg = encodeURIComponent(
    `Bonjour, je vous contacte via Mada Spot concernant ${establishmentName}. Je souhaite avoir plus d'informations.`
  );

  return (
    <>
      {/* Desktop sidebar buttons */}
      <div className="space-y-2 mt-3">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(establishmentId, 'whatsapp')}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            onClick={() => trackClick(establishmentId, 'phone')}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/20"
          >
            <Phone className="w-5 h-5" />
            {phone}
          </a>
        )}
        {phone2 && (
          <a
            href={`tel:${phone2}`}
            onClick={() => trackClick(establishmentId, 'phone')}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#2a2a36] text-slate-300 font-medium rounded-xl hover:bg-[#2a2a36] transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            {phone2}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            onClick={() => trackClick(establishmentId, 'email')}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#2a2a36] text-slate-300 font-medium rounded-xl hover:bg-[#2a2a36] transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}
      </div>

      {/* Mobile sticky footer bar */}
      {(phone || whatsapp) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0a0f]/95 backdrop-blur-md border-t border-[#2a2a36] px-4 py-3 flex items-center gap-3">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(establishmentId, 'whatsapp')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-semibold rounded-xl text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => trackClick(establishmentId, 'phone')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl text-sm"
            >
              <Phone className="w-4 h-4" />
              Appeler
            </a>
          )}
        </div>
      )}
    </>
  );
}
