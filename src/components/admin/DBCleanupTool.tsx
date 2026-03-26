'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Trash2, AlertTriangle, RefreshCw, Users, MessageSquare,
  Eye, FileText, CheckCircle, Shield,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface CleanupPreview {
  inactiveAccounts: number;
  oldReadMessages: number;
  orphanedViews: number;
  oldAuditLogs: number;
  totalCleanable: number;
}

interface CleanupItem {
  type: string;
  label: string;
  description: string;
  icon: typeof Users;
  color: string;
  previewKey: keyof CleanupPreview;
}

const CLEANUP_ITEMS: CleanupItem[] = [
  {
    type: 'inactive_accounts',
    label: 'Comptes inactifs',
    description: '6+ mois sans login, aucune reservation ni message',
    icon: Users,
    color: '#ef4444',
    previewKey: 'inactiveAccounts',
  },
  {
    type: 'old_messages',
    label: 'Messages obsoletes',
    description: 'Messages lus de plus d\'un an',
    icon: MessageSquare,
    color: '#f59e0b',
    previewKey: 'oldReadMessages',
  },
  {
    type: 'old_views',
    label: 'Vues anciennes',
    description: 'Logs de consultations de plus d\'un an',
    icon: Eye,
    color: '#3b82f6',
    previewKey: 'orphanedViews',
  },
  {
    type: 'old_audit_logs',
    label: 'Audit logs anciens',
    description: 'Logs d\'audit de plus d\'un an',
    icon: FileText,
    color: '#8b5cf6',
    previewKey: 'oldAuditLogs',
  },
];

// ============================================================
// Main Component
// ============================================================
export default function DBCleanupTool() {
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { count: number; dryRun: boolean }>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cleanup', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPreview(data.preview || null);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const handleAction = async (type: string, dryRun: boolean) => {
    setActionLoading(type);
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, dryRun }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(prev => ({ ...prev, [type]: { count: data.count, dryRun } }));
        if (!dryRun) {
          fetchPreview(); // Refresh counts after actual cleanup
          setConfirmDelete(null);
        }
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-red-400">Zone de nettoyage</p>
          <p className="text-[10px] text-gray-500">Utilisez toujours l&apos;apercu avant de nettoyer. Les suppressions sont irreversibles.</p>
        </div>
        <button onClick={fetchPreview} className="ml-auto p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Total */}
      {preview && (
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{preview.totalCleanable.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500 mt-1">Elements nettoyables au total</p>
        </div>
      )}

      {/* Cleanup items */}
      <div className="space-y-4">
        {CLEANUP_ITEMS.map(item => {
          const Icon = item.icon;
          const count = preview ? preview[item.previewKey] : 0;
          const result = results[item.type];

          return (
            <div key={item.type} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}>
                  <Icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">{item.label}</h4>
                  <p className="text-[10px] text-gray-500">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold" style={{ color: count > 0 ? item.color : '#6b7280' }}>
                    {count.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[9px] text-gray-600">element{count > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Result display */}
              {result && (
                <div className={`mt-3 p-3 rounded-lg border ${
                  result.dryRun ? 'bg-blue-500/5 border-blue-500/20' : 'bg-green-500/5 border-green-500/20'
                }`}>
                  <p className="text-xs flex items-center gap-1.5">
                    {result.dryRun ? (
                      <><Shield className="w-3.5 h-3.5 text-blue-400" /><span className="text-blue-400">Apercu : {result.count} element{result.count > 1 ? 's' : ''} a supprimer</span></>
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">{result.count} element{result.count > 1 ? 's' : ''} supprime{result.count > 1 ? 's' : ''}</span></>
                    )}
                  </p>
                </div>
              )}

              {/* Actions */}
              {count > 0 && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAction(item.type, true)}
                    disabled={actionLoading === item.type}
                    className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === item.type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Apercu
                  </button>

                  {confirmDelete === item.type ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAction(item.type, false)}
                        disabled={actionLoading === item.type}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 flex items-center gap-1.5"
                      >
                        {actionLoading === item.type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] text-gray-400 text-xs rounded-lg"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(item.type)}
                      className="flex-1 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Nettoyer
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
