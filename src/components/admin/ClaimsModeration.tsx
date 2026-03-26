'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import { Loader2, Building2, Flag, CheckCircle, XCircle } from 'lucide-react';

export default function ClaimsModeration() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/claims?status=${filter}`);
      const data = await res.json();
      setClaims(data.claims || []);
    } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleAction = async (claimId: string, action: 'approve' | 'reject') => {
    setActionLoading(claimId);
    try {
      await fetch('/api/admin/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action }),
      });
      fetchClaims();
    } catch {}
    setActionLoading(null);
  };

  const roleLabels: Record<string, string> = {
    owner: 'Proprietaire',
    manager: 'Gerant',
    employee: 'Employe',
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s
                ? 'bg-[#ff6b35] text-white'
                : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'
            }`}
          >
            {s === 'PENDING' ? 'En attente' : s === 'APPROVED' ? 'Approuvees' : 'Refusees'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Aucune revendication {filter === 'PENDING' ? 'en attente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {claims.map((claim: any) => (
            <div key={claim.id} className="p-5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl space-y-3">
              {/* Establishment info */}
              <div className="flex items-center gap-3">
                {claim.establishment?.coverImage ? (
                  <div className="relative w-12 h-12 rounded-lg">
                    <Image src={getImageUrl(claim.establishment.coverImage)} alt={claim.establishment.name || 'Etablissement'} fill sizes="48px" className="rounded-lg object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#080810] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{claim.establishment?.name || 'Etablissement inconnu'}</p>
                  <p className="text-xs text-gray-500">{claim.establishment?.city}</p>
                </div>
              </div>

              {/* Claimant info */}
              <div className="p-3 bg-[#080810] rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{claim.claimantName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    {roleLabels[claim.claimantRole] || claim.claimantRole}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{claim.claimantEmail}</p>
                {claim.claimantPhone && <p className="text-xs text-gray-400">{claim.claimantPhone}</p>}
                {claim.proofDescription && (
                  <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-[#1e1e2e]">{claim.proofDescription}</p>
                )}
              </div>

              <p className="text-[10px] text-gray-600">
                Soumis le {new Date(claim.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              {/* Actions */}
              {filter === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAction(claim.id, 'approve')}
                    disabled={actionLoading === claim.id}
                    className="flex-1 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approuver
                  </button>
                  <button
                    onClick={() => handleAction(claim.id, 'reject')}
                    disabled={actionLoading === claim.id}
                    className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                </div>
              )}

              {claim.status === 'REJECTED' && claim.rejectionReason && (
                <p className="text-xs text-red-400 bg-red-500/5 p-2 rounded-lg">
                  Motif : {claim.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
