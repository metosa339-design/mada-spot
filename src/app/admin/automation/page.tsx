'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Zap, Play, Activity, Database, Wifi, WifiOff, TrendingUp, FileText, Rss, Bot, Calendar, ArrowLeft, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface AutomationStatus {
  success: boolean;
  timestamp: string;
  health: {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    lastSyncHoursAgo: number;
  };
  articles: {
    total: number;
    today: number;
    last24h: number;
    last7days: number;
    fromRSS: number;
    aiEnhanced: number;
    breaking: number;
    scheduled: number;
    drafts: number;
  };
  automation: {
    tasks: {
      sync_rss: { completed: number; failed: number; lastRun: string | null };
      enhance_articles: { completed: number; failed: number; lastRun: string | null };
      publish_scheduled: { completed: number; failed: number; lastRun: string | null };
    };
    recentErrors: Array<{ type: string; error: string; timestamp: string }>;
    rssSources: Array<{
      id: string;
      name: string;
      url: string;
      isActive: boolean;
      autoPublish: boolean;
      lastFetchedAt: string | null;
    }>;
  };
  content: {
    breakingNews: Array<{ id: string; title: string; publishedAt: string }>;
    upcomingScheduled: Array<{ id: string; title: string; scheduledAt: string }>;
  };
}

interface TaskResult {
  success: boolean;
  timestamp: string;
  totalFetched?: number;
  totalSaved?: number;
  totalEnhanced?: number;
  processed?: number;
  enhanced?: number;
  articlesPublished?: number;
  duration?: number;
  error?: string;
}

interface SchedulerStatus {
  isStarted: boolean;
  baseUrl: string;
  jobs: Record<string, {
    intervalMinutes: number;
    lastRun: string | null;
    isRunning: boolean;
  }>;
}

export default function AutomationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [taskResults, setTaskResults] = useState<Record<string, TaskResult>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cron/scheduler');
      if (res.ok) {
        const data = await res.json();
        setSchedulerStatus(data.scheduler);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes] = await Promise.all([
        fetch('/api/cron/status'),
        fetchSchedulerStatus()
      ]);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const runTask = async (taskType: 'sync-rss' | 'enhance-articles' | 'publish') => {
    setRunningTask(taskType);
    try {
      const res = await fetch(`/api/cron/${taskType}`, { method: 'POST' });
      const data = await res.json();
      setTaskResults(prev => ({ ...prev, [taskType]: data }));
      // Refresh status after task
      await fetchStatus();
    } catch (error) {
      setTaskResults(prev => ({
        ...prev,
        [taskType]: { success: false, timestamp: new Date().toISOString(), error: (error as Error).message }
      }));
    } finally {
      setRunningTask(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12121a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12121a]">
      {/* Header */}
      <header className="bg-[#1a1a24] border-b border-[#2a2a36] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-orange-500" />
                <h1 className="text-xl font-bold text-white">Automatisation</h1>
              </div>
            </div>

            <button
              onClick={() => { setRefreshing(true); fetchStatus(); }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scheduler Status */}
        <div className={`mb-4 p-4 rounded-xl flex items-center justify-between ${
          schedulerStatus?.isStarted ? 'bg-green-500/10 border border-green-500/30' : 'bg-[#12121a] border border-[#2a2a36]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${schedulerStatus?.isStarted ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <div>
              <span className="font-medium text-white">
                Scheduler interne : {schedulerStatus?.isStarted ? 'ACTIF' : 'INACTIF'}
              </span>
              <p className="text-xs text-gray-500">
                {schedulerStatus?.isStarted
                  ? 'Les tâches s\'exécutent automatiquement sans intervention'
                  : 'Le scheduler n\'est pas démarré'}
              </p>
            </div>
          </div>
          {schedulerStatus?.isStarted && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-4 h-4 text-green-500" />
              <span>Auto-refresh: 30s</span>
            </div>
          )}
        </div>

        {/* Health Status Banner */}
        {status && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-4 ${
            status.health.status === 'healthy' ? 'bg-green-500/10 border border-green-500/30' :
            status.health.status === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/30' :
            'bg-red-500/10 border border-red-500/30'
          }`}>
            {status.health.status === 'healthy' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : status.health.status === 'warning' ? (
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <h2 className={`font-semibold ${
                status.health.status === 'healthy' ? 'text-green-800' :
                status.health.status === 'warning' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                {status.health.status === 'healthy' ? 'Système opérationnel' :
                 status.health.status === 'warning' ? 'Attention requise' :
                 'Problème détecté'}
              </h2>
              <p className={`text-sm ${
                status.health.status === 'healthy' ? 'text-green-600' :
                status.health.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {status.health.message}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Sync RSS */}
          <div className="bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Rss className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sync RSS</h3>
                  <p className="text-xs text-gray-500">Scraper les sources</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Dernière exécution:</span>
                <span className="font-medium">
                  {formatDate(status?.automation.tasks.sync_rss.lastRun || null)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Succès (7j):</span>
                <span className="text-green-600 font-medium">
                  {status?.automation.tasks.sync_rss.completed || 0}
                </span>
              </div>
            </div>
            {taskResults['sync-rss'] && (
              <div className={`text-xs p-2 rounded mb-3 ${
                taskResults['sync-rss'].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {taskResults['sync-rss'].success
                  ? `${taskResults['sync-rss'].totalSaved} nouveaux articles en ${formatDuration(taskResults['sync-rss'].duration || 0)}`
                  : taskResults['sync-rss'].error}
              </div>
            )}
            <button
              onClick={() => runTask('sync-rss')}
              disabled={runningTask !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {runningTask === 'sync-rss' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Lancer maintenant
            </button>
          </div>

          {/* Enhance Articles */}
          <div className="bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">IA Enhancement</h3>
                  <p className="text-xs text-gray-500">Améliorer avec l'IA</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Dernière exécution:</span>
                <span className="font-medium">
                  {formatDate(status?.automation.tasks.enhance_articles.lastRun || null)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Succès (7j):</span>
                <span className="text-green-600 font-medium">
                  {status?.automation.tasks.enhance_articles.completed || 0}
                </span>
              </div>
            </div>
            {taskResults['enhance-articles'] && (
              <div className={`text-xs p-2 rounded mb-3 ${
                taskResults['enhance-articles'].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {taskResults['enhance-articles'].success
                  ? `${taskResults['enhance-articles'].enhanced}/${taskResults['enhance-articles'].processed} améliorés`
                  : taskResults['enhance-articles'].error}
              </div>
            )}
            <button
              onClick={() => runTask('enhance-articles')}
              disabled={runningTask !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {runningTask === 'enhance-articles' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Lancer maintenant
            </button>
          </div>

          {/* Publish Scheduled */}
          <div className="bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Publication</h3>
                  <p className="text-xs text-gray-500">Articles programmés</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              <div className="flex justify-between">
                <span>Dernière exécution:</span>
                <span className="font-medium">
                  {formatDate(status?.automation.tasks.publish_scheduled.lastRun || null)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>En attente:</span>
                <span className="text-orange-600 font-medium">
                  {status?.articles.scheduled || 0}
                </span>
              </div>
            </div>
            {taskResults['publish'] && (
              <div className={`text-xs p-2 rounded mb-3 ${
                taskResults['publish'].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {taskResults['publish'].success
                  ? `${taskResults['publish'].articlesPublished} articles publiés`
                  : taskResults['publish'].error}
              </div>
            )}
            <button
              onClick={() => runTask('publish')}
              disabled={runningTask !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {runningTask === 'publish' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Lancer maintenant
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Total articles"
            value={status?.articles.total || 0}
            color="gray"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Aujourd'hui"
            value={status?.articles.today || 0}
            color="green"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="24 dernières h"
            value={status?.articles.last24h || 0}
            color="blue"
          />
          <StatCard
            icon={<Rss className="w-5 h-5" />}
            label="Via RSS"
            value={status?.articles.fromRSS || 0}
            color="orange"
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Améliorés IA"
            value={status?.articles.aiEnhanced || 0}
            color="purple"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5" />}
            label="Breaking"
            value={status?.articles.breaking || 0}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Breaking News */}
          {status?.content.breakingNews && status.content.breakingNews.length > 0 && (
            <div className="bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Breaking News récents
              </h3>
              <div className="space-y-3">
                {status.content.breakingNews.map((article) => (
                  <div key={article.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <Zap className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{article.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(article.publishedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Articles */}
          {status?.content.upcomingScheduled && status.content.upcomingScheduled.length > 0 && (
            <div className="bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Articles programmés
              </h3>
              <div className="space-y-3">
                {status.content.upcomingScheduled.map((article) => (
                  <div key={article.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{article.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Programmé: {formatDate(article.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Errors Section */}
        {status?.automation.recentErrors && status.automation.recentErrors.length > 0 && (
          <div className="mt-8 bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Erreurs récentes ({status.automation.recentErrors.length})
              </h3>
              {showErrors ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showErrors && (
              <div className="mt-4 space-y-2">
                {status.automation.recentErrors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-700">{error.type}</span>
                      <span className="text-xs text-red-500">{formatDate(error.timestamp)}</span>
                    </div>
                    <p className="text-red-600 mt-1 text-xs">{error.error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RSS Sources Section */}
        {status?.automation.rssSources && status.automation.rssSources.length > 0 && (
          <div className="mt-8 bg-[#1a1a24] rounded-xl p-6 shadow-sm border border-[#2a2a36]">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Sources RSS configurées ({status.automation.rssSources.length})
              </h3>
              {showSources ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showSources && (
              <div className="mt-4 space-y-2">
                {status.automation.rssSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-[#12121a] rounded-lg">
                    <div className="flex items-center gap-3">
                      {source.isActive ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-sm text-gray-900">{source.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{source.url}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Dernier fetch:</div>
                      <div className="font-medium">{formatDate(source.lastFetchedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl text-sm border border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="font-semibold text-green-800">100% Automatique - Aucune intervention requise</p>
          </div>
          <p className="text-gray-400 mb-3">
            Le scheduler interne s'exécute automatiquement au démarrage du serveur. Les tâches tournent en arrière-plan :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#1a1a24]/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Rss className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-white">Sync RSS</span>
              </div>
              <p className="text-xs text-gray-500">Toutes les 30 minutes</p>
            </div>
            <div className="bg-[#1a1a24]/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-white">Enhancement IA</span>
              </div>
              <p className="text-xs text-gray-500">Toutes les 2 heures</p>
            </div>
            <div className="bg-[#1a1a24]/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="font-medium text-white">Publication</span>
              </div>
              <p className="text-xs text-gray-500">Toutes les 15 minutes</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Pour désactiver : définir <code className="bg-white/10 px-1 rounded">AUTOMATION_ENABLED=false</code> dans les variables d'environnement.
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'gray' | 'green' | 'blue' | 'orange' | 'purple' | 'red';
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-[#1a1a24] rounded-xl p-4 shadow-sm border border-[#2a2a36]">
      <div className={`p-2 rounded-lg ${colors[color]} w-fit mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
