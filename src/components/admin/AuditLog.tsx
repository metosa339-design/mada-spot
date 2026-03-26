'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Shield,
} from 'lucide-react';

interface LogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Création', color: 'bg-green-100 text-green-700' },
  update: { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  delete: { label: 'Suppression', color: 'bg-red-100 text-red-700' },
  approve: { label: 'Approbation', color: 'bg-emerald-100 text-emerald-700' },
  reject: { label: 'Rejet', color: 'bg-orange-100 text-orange-700' },
  login: { label: 'Connexion', color: 'bg-indigo-100 text-indigo-700' },
  logout: { label: 'Déconnexion', color: 'bg-gray-100 text-gray-700' },
};

const ENTITY_LABELS: Record<string, string> = {
  establishment: 'Établissement',
  review: 'Avis',
  booking: 'Réservation',
  user: 'Utilisateur',
  claim: 'Revendication',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (entityFilter !== 'all') params.set('entityType', entityFilter);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const res = await fetch(`/api/admin/audit?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.includes(q) ||
      log.entityType.includes(q) ||
      (log.entityId && log.entityId.includes(q)) ||
      (log.userId && log.userId.includes(q))
    );
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans les logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Toutes les actions</option>
          <option value="create">Création</option>
          <option value="update">Modification</option>
          <option value="delete">Suppression</option>
          <option value="approve">Approbation</option>
          <option value="reject">Rejet</option>
          <option value="login">Connexion</option>
          <option value="logout">Déconnexion</option>
        </select>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Toutes les entités</option>
          <option value="establishment">Établissement</option>
          <option value="review">Avis</option>
          <option value="booking">Réservation</option>
          <option value="user">Utilisateur</option>
          <option value="claim">Revendication</option>
        </select>
        <button onClick={fetchLogs} className="p-2 hover:bg-gray-100 rounded-lg" title="Rafraîchir" aria-label="Rafraîchir les logs">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Total */}
      <div className="text-sm text-gray-500">
        {total} entrée{total > 1 ? 's' : ''} au total
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun log trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const actionConf = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };
            const isExpanded = expanded === log.id;

            return (
              <div key={log.id} className="bg-white border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 font-mono">{formatDate(log.createdAt)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionConf.color}`}>
                    {actionConf.label}
                  </span>
                  <span className="text-sm text-gray-700">
                    {ENTITY_LABELS[log.entityType] || log.entityType}
                  </span>
                  {log.entityId && (
                    <span className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                      {log.entityId}
                    </span>
                  )}
                  <div className="ml-auto">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-gray-50 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">User ID : </span>
                      <span className="font-mono text-xs">{log.userId || 'Système'}</span>
                    </div>
                    {log.ipAddress && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">IP : </span>
                        <span className="font-mono text-xs">{log.ipAddress}</span>
                      </div>
                    )}
                    {log.details && (
                      <div>
                        <div className="text-gray-600 mb-1">Détails :</div>
                        <pre className="bg-white border rounded p-2 text-xs overflow-x-auto max-h-40">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.userAgent && (
                      <div className="text-xs text-gray-400 truncate">
                        UA: {log.userAgent}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Précédent
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
