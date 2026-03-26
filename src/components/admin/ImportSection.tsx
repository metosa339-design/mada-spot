'use client';

import { useState, useEffect } from 'react';
import { Upload, Loader2, FileDown, Hotel, UtensilsCrossed, Compass } from 'lucide-react';

// ============================================================
// IMPORT UPLOAD ZONE
// ============================================================
function ImportUploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import/establishments', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) setFile(null);
    } catch {
      setResult({ error: 'Erreur de connexion' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-[#2e2e3e] rounded-xl p-8 text-center hover:border-[#ff6b35]/50 transition-colors cursor-pointer"
        onClick={() => document.getElementById('import-file-input')?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#ff6b35]'); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#ff6b35]'); }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-[#ff6b35]');
          const f = e.dataTransfer.files[0];
          if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) setFile(f);
        }}
      >
        <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-300">
          {file ? file.name : 'Glissez un fichier CSV ou JSON ici'}
        </p>
        <p className="text-xs text-gray-500 mt-1">ou cliquez pour selectionner</p>
        <input
          id="import-file-input"
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
        />
      </div>

      {file && (
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 bg-[#080810] border border-[#1e1e2e] rounded-xl">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} Ko</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#ff1493] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Import...' : 'Importer'}
          </button>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-xl border ${result.error ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          {result.error ? (
            <p className="text-sm text-red-400">{result.error}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-400">Import termine</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-300">Total : {result.total}</span>
                <span className="text-green-400">Reussis : {result.success}</span>
                <span className="text-red-400">Erreurs : {result.errors}</span>
              </div>
              {result.errorDetails?.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Voir les erreurs</summary>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {result.errorDetails.map((err: any, i: number) => (
                      <p key={i} className="text-xs text-red-300">
                        Ligne {err.row}: {err.errors.join(', ')}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// IMPORT HISTORY
// ============================================================
function ImportHistory() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/import/batches')
      .then(r => r.json())
      .then(data => setBatches(data.batches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>;
  if (batches.length === 0) return <p className="text-sm text-gray-500 text-center py-8">Aucun import effectue</p>;

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {batches.map((batch: any) => (
        <div key={batch.id} className="flex items-center gap-4 p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl">
          <div className={`w-3 h-3 rounded-full ${batch.status === 'completed' ? 'bg-green-500' : batch.status === 'failed' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{batch.fileName || `Import ${batch.source}`}</p>
            <p className="text-xs text-gray-500">{new Date(batch.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-gray-400">{batch.totalRecords} total</span>
            <span className="text-green-400">{batch.successCount} ok</span>
            {batch.errorCount > 0 && <span className="text-red-400">{batch.errorCount} err</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function ImportSection() {
  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-bold">Import d&apos;Etablissements</h3>
        <p className="text-sm text-gray-500">Importez des hotels, restaurants et attractions en masse via CSV ou JSON</p>
      </div>

      {/* CSV Upload */}
      <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
        <h4 className="text-lg font-semibold mb-4">Importer un fichier</h4>
        <ImportUploadZone />
      </div>

      {/* Templates */}
      <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
        <h4 className="text-lg font-semibold mb-4">Telecharger un template CSV</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { type: 'RESTAURANT', label: 'Restaurants', icon: UtensilsCrossed, color: '#f97316' },
            { type: 'HOTEL', label: 'Hotels', icon: Hotel, color: '#3b82f6' },
            { type: 'ATTRACTION', label: 'Attractions', icon: Compass, color: '#10b981' },
          ].map(({ type, label, icon: Icon, color }) => (
            <a
              key={type}
              href={`/api/admin/import/template?type=${type}`}
              download
              className="flex items-center gap-3 p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl hover:border-[#2e2e3e] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-500">Template CSV</p>
              </div>
              <FileDown className="w-4 h-4 text-gray-500 ml-auto" />
            </a>
          ))}
        </div>
      </div>

      {/* Import History */}
      <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6">
        <h4 className="text-lg font-semibold mb-4">Historique des imports</h4>
        <ImportHistory />
      </div>
    </div>
  );
}
