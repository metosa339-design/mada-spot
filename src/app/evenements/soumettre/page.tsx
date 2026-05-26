'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Calendar } from 'lucide-react';
import { useTrans } from '@/i18n';

export default function SoumettreEvenementPage() {
  const t = useTrans('events');
  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <Link
          href="/evenements"
          className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.backToEvents}
        </Link>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-[#FFF7ED] border border-[#FF6B35]/25 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <h1 className="text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-2">
            {t.adminOnlyTitle}
          </h1>
          <p className="text-[#64748B] text-[14px] mb-6 leading-relaxed">
            {t.adminOnlyDesc}
          </p>
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
          >
            <Calendar className="w-4 h-4" />
            {t.seeEvents}
          </Link>
        </div>
      </div>
    </div>
  );
}
