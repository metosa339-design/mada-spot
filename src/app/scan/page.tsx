'use client';

// Mada Spot — App Scanner Hors-Ligne (spec §4, Interface 4).
// PWA offline-first : préchargement chiffré/signé du manifeste dans IndexedDB
// (Dexie), décodage QR 60 fps délégué à un Web Worker, feedback vert/rouge
// haptique + sonore, recours manuel par code à 6 chiffres, auto-sync cloud.

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Download,
  Loader2,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  storeManifest,
  validateQr,
  validateBySecurityCode,
  getStats,
  syncPendingScans,
  scannerDb,
  type ValidationOutcome,
  type ScanStats,
} from '@/lib/ticketing/scanner-db';

interface ActiveEvent {
  id: string;
  title: string;
}

interface ScanFeedback {
  kind: 'VALID' | 'INVALID';
  title: string;
  subtitle: string;
  at: number;
}

const SCAN_COOLDOWN_MS = 1500; // anti double-lecture du même QR
const FRAME_WIDTH = 640; // résolution de décodage (perf)

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <ScanInner />
    </Suspense>
  );
}

function ScanInner() {
  const params = useSearchParams();

  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [eventIdInput, setEventIdInput] = useState('');
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [online, setOnline] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);

  const [manualCode, setManualCode] = useState('');
  const [manualBusy, setManualBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const frameIdRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const lastHandledRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const eventRef = useRef<ActiveEvent | null>(null);
  eventRef.current = event;

  // -- État réseau ----------------------------------------------------------
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // -- Restauration hors-ligne de l'événement courant -----------------------
  useEffect(() => {
    (async () => {
      const paramId = params.get('event');
      try {
        const db = scannerDb();
        const stored = await db.events.orderBy('eventId').toArray();
        let chosen = stored.find((e) => e.eventId === paramId) ?? stored[0];
        if (chosen) {
          setEvent({ id: chosen.eventId, title: chosen.title });
          setStats(await getStats(chosen.eventId));
        } else if (paramId) {
          setEventIdInput(paramId);
        }
      } catch {
        /* IndexedDB indisponible : l'agent devra saisir l'ID */
      }
    })();
  }, [params]);

  // -- Auto-sync dès que la connexion revient --------------------------------
  useEffect(() => {
    if (online && event) void handleSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, event?.id]);

  // ------------------------------------------------------------------------
  // Feedback sonore + haptique
  // ------------------------------------------------------------------------
  const beep = useCallback((kind: 'VALID' | 'INVALID') => {
    try {
      if (!audioRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new Ctx();
      }
      const ac = audioRef.current;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'square';
      osc.frequency.value = kind === 'VALID' ? 880 : 220;
      gain.gain.setValueAtTime(0.001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.01);
      const dur = kind === 'VALID' ? 0.12 : 0.4;
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch {
      /* audio indisponible */
    }
    try {
      navigator.vibrate?.(kind === 'VALID' ? 80 : [120, 60, 200]);
    } catch {
      /* pas de vibration */
    }
  }, []);

  // ------------------------------------------------------------------------
  // Traitement d'une détection (QR ou code manuel)
  // ------------------------------------------------------------------------
  const presentOutcome = useCallback(
    (outcome: ValidationOutcome) => {
      if (outcome.result === 'VALID') {
        beep('VALID');
        setFeedback({
          kind: 'VALID',
          title: outcome.ticket.holderName || 'Billet valide',
          subtitle: outcome.ticket.category,
          at: Date.now(),
        });
      } else if (outcome.result === 'ALREADY_SCANNED') {
        beep('INVALID');
        const t = outcome.firstScannedAt
          ? new Date(outcome.firstScannedAt).toLocaleTimeString('fr-MG')
          : 'inconnue';
        setFeedback({
          kind: 'INVALID',
          title: 'Déjà scanné',
          subtitle: `Premier passage à ${t}`,
          at: Date.now(),
        });
      } else if (outcome.result === 'WRONG_EVENT') {
        beep('INVALID');
        setFeedback({ kind: 'INVALID', title: 'Autre événement', subtitle: 'Ce billet n’est pas valable ici', at: Date.now() });
      } else {
        beep('INVALID');
        setFeedback({ kind: 'INVALID', title: 'Billet invalide', subtitle: 'Introuvable dans la liste', at: Date.now() });
      }
    },
    [beep]
  );

  const handleDetection = useCallback(
    async (text: string) => {
      const now = Date.now();
      if (lastHandledRef.current.code === text && now - lastHandledRef.current.at < SCAN_COOLDOWN_MS) {
        return; // même QR encore dans le champ : on ignore
      }
      lastHandledRef.current = { code: text, at: now };
      const ev = eventRef.current;
      if (!ev) return;
      const outcome = await validateQr(ev.id, text);
      presentOutcome(outcome);
      setStats(await getStats(ev.id));
      if (navigator.onLine) void handleSyncSilent(ev.id);
    },
    [presentOutcome]
  );

  // ------------------------------------------------------------------------
  // Boucle caméra + Web Worker
  // ------------------------------------------------------------------------
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const worker = workerRef.current;
    if (video && canvas && worker && !inFlightRef.current && video.readyState >= 2) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw && vh) {
        const scale = FRAME_WIDTH / vw;
        const w = FRAME_WIDTH;
        const h = Math.round(vh * scale);
        canvas.width = w;
        canvas.height = h;
        const c2d = canvas.getContext('2d', { willReadFrequently: true });
        if (c2d) {
          c2d.drawImage(video, 0, 0, w, h);
          const imageData = c2d.getImageData(0, 0, w, h);
          inFlightRef.current = true;
          const id = ++frameIdRef.current;
          worker.postMessage(
            { id, width: w, height: h, buffer: imageData.data.buffer },
            [imageData.data.buffer]
          );
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Web Worker de décodage (créé à la volée).
      if (!workerRef.current) {
        const worker = new Worker(new URL('./qr-decoder.worker.ts', import.meta.url));
        worker.onmessage = (e: MessageEvent<{ id: number; text: string | null }>) => {
          inFlightRef.current = false;
          if (e.data.text) void handleDetection(e.data.text);
        };
        worker.onerror = () => {
          inFlightRef.current = false;
        };
        workerRef.current = worker;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setScanning(true);
      // Débloque l'audio (autoplay policies) au geste utilisateur.
      audioRef.current?.resume?.();
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setCameraError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Accès caméra refusé. Autorisez la caméra pour scanner.'
          : 'Caméra indisponible sur cet appareil.'
      );
    }
  }, [handleDetection, tick]);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    inFlightRef.current = false;
    setScanning(false);
  }, []);

  // Nettoyage au démontage.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // ------------------------------------------------------------------------
  // Téléchargement du manifeste
  // ------------------------------------------------------------------------
  const handleDownload = useCallback(async () => {
    const id = event?.id || eventIdInput.trim();
    if (!id) {
      setMessage('Renseignez l’identifiant de l’événement.');
      return;
    }
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/ticketing/scan/manifest?eventId=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        setMessage('Accès refusé : connectez-vous avec un compte agent/organisateur.');
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMessage(json.error || 'Téléchargement impossible.');
        return;
      }
      const data = json.data;
      await storeManifest(
        {
          eventId: data.event.id,
          title: data.event.title,
          startDate: data.event.startDate,
          generatedAt: data.generatedAt,
          signature: data.signature,
          count: data.count,
        },
        data.tickets.map((t: {
          qrHash: string;
          securityCode: string;
          holderName: string;
          category: string;
          scannedAt: string | null;
        }) => ({
          qrHash: t.qrHash,
          securityCode: t.securityCode,
          holderName: t.holderName,
          category: t.category,
          serverScannedAt: t.scannedAt,
        }))
      );
      setEvent({ id: data.event.id, title: data.event.title });
      setStats(await getStats(data.event.id));
      setMessage(`Liste chargée : ${data.count} billet(s) prêts pour le contrôle hors-ligne.`);
    } catch {
      setMessage('Connexion impossible. Réessayez une fois en ligne.');
    } finally {
      setDownloading(false);
    }
  }, [event?.id, eventIdInput]);

  // ------------------------------------------------------------------------
  // Synchronisation
  // ------------------------------------------------------------------------
  const handleSyncSilent = useCallback(async (eventId: string) => {
    try {
      const r = await syncPendingScans(eventId);
      if (r) setStats(await getStats(eventId));
    } catch {
      /* réessai au prochain retour réseau */
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (!event) return;
    setSyncing(true);
    try {
      const r = await syncPendingScans(event.id);
      if (r) {
        setStats(await getStats(event.id));
        setMessage(
          r.synced === 0
            ? 'Tout est déjà synchronisé.'
            : `Synchronisé : ${r.synced} scan(s)${r.conflicts ? `, ${r.conflicts} conflit(s)` : ''}.`
        );
      } else {
        setMessage('Synchronisation impossible pour le moment.');
      }
    } finally {
      setSyncing(false);
    }
  }, [event]);

  // ------------------------------------------------------------------------
  // Recours manuel (code à 6 chiffres)
  // ------------------------------------------------------------------------
  const handleManual = useCallback(async () => {
    if (!event || !/^\d{6}$/.test(manualCode)) return;
    setManualBusy(true);
    try {
      const outcome = await validateBySecurityCode(event.id, manualCode);
      presentOutcome(outcome);
      setStats(await getStats(event.id));
      setManualCode('');
      if (navigator.onLine) void handleSyncSilent(event.id);
    } finally {
      setManualBusy(false);
    }
  }, [event, manualCode, presentOutcome, handleSyncSilent]);

  // Masque le feedback après 2,5 s.
  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback((f) => (f && f.at === feedback.at ? null : f)), 2500);
    return () => clearTimeout(id);
  }, [feedback]);

  // ------------------------------------------------------------------------
  // Rendu
  // ------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-md mx-auto px-4 pt-20 pb-24">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Accueil
          </Link>
          <span
            className={`inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full ${
              online ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? 'En ligne' : 'Hors-ligne'}
          </span>
        </div>

        <h1 className="text-[22px] font-semibold tracking-[-0.02em] mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF6B35]" /> Contrôle d’accès
        </h1>
        <p className="text-[13px] text-white/50 mb-5">
          {event ? event.title : 'Aucun événement chargé'}
        </p>

        {/* Préchargement */}
        {!event && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
            <label className="block text-[12px] text-white/60 mb-1.5">Identifiant de l’événement</label>
            <input
              value={eventIdInput}
              onChange={(e) => setEventIdInput(e.target.value)}
              placeholder="ID de l’événement"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[14px] outline-none focus:border-[#FF6B35] mb-3"
            />
            <button
              onClick={handleDownload}
              disabled={downloading || !online}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] disabled:opacity-50 font-semibold text-[14px] transition-all"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Télécharger la liste
            </button>
          </div>
        )}

        {/* Statistiques */}
        {event && stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat label="Billets" value={stats.total} />
            <Stat label="Scannés" value={stats.scanned} accent />
            <Stat label="À sync." value={stats.pendingSync} warn={stats.pendingSync > 0} />
          </div>
        )}

        {/* Zone caméra */}
        {event && (
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-square mb-4">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Réticule */}
            {scanning && !feedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}

            {/* Overlay de résultat plein écran */}
            {feedback && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 ${
                  feedback.kind === 'VALID' ? 'bg-emerald-600/95' : 'bg-red-600/95'
                }`}
              >
                {feedback.kind === 'VALID' ? (
                  <CheckCircle2 className="w-20 h-20 mb-3" />
                ) : (
                  <XCircle className="w-20 h-20 mb-3" />
                )}
                <p className="text-[24px] font-bold leading-tight">{feedback.title}</p>
                <p className="text-[15px] text-white/90 mt-1">{feedback.subtitle}</p>
              </div>
            )}

            {!scanning && !feedback && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-white/30" />
              </div>
            )}
          </div>
        )}

        {cameraError && (
          <p className="text-[13px] text-red-400 mb-3 text-center">{cameraError}</p>
        )}

        {/* Contrôles caméra */}
        {event && (
          <div className="flex gap-2 mb-4">
            {!scanning ? (
              <button
                onClick={startCamera}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] font-semibold text-[14px] transition-all"
              >
                <Camera className="w-4 h-4" /> Démarrer le scan
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 font-semibold text-[14px] transition-all"
              >
                <CameraOff className="w-4 h-4" /> Arrêter
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={syncing || !online}
              aria-label="Synchroniser"
              className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Recours manuel */}
        {event && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
            <p className="text-[13px] font-medium mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#FF6B35]" /> Vérification manuelle
            </p>
            <p className="text-[12px] text-white/50 mb-3">
              Si le téléphone du client est cassé ou déchargé, saisissez son code à 6 chiffres.
            </p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[18px] tracking-[0.3em] text-center outline-none focus:border-[#FF6B35] tabular-nums"
              />
              <button
                onClick={handleManual}
                disabled={manualBusy || !/^\d{6}$/.test(manualCode)}
                className="px-5 py-2.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] disabled:opacity-40 font-semibold text-[14px] transition-all"
              >
                {manualBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider'}
              </button>
            </div>
          </div>
        )}

        {/* Rechargement du manifeste + message */}
        {event && (
          <button
            onClick={handleDownload}
            disabled={downloading || !online}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-[13px] text-white/70 transition-all mb-3"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Recharger la liste
          </button>
        )}

        {message && (
          <p className="text-[12px] text-white/60 text-center bg-white/5 rounded-lg py-2 px-3">{message}</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
      <p
        className={`text-[22px] font-bold tabular-nums ${
          accent ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] text-white/50">{label}</p>
    </div>
  );
}
