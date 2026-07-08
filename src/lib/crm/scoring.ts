// Lead scoring 0–100 pour un prospect, à partir de signaux d'engagement.

export interface ScoreSignals {
  status: string;
  contactAttempts: number;
  lastContactedAt: Date | null;
  lastInboundAt: Date | null;
  convertedAt: Date | null;
  hasConversations: boolean;
}

export function computeScore(s: ScoreSignals): number {
  let score = 0;

  // Statut = signal principal
  const statusPoints: Record<string, number> = {
    NEW: 10,
    CONTACTED: 25,
    ENGAGED: 55,
    QUALIFIED: 75,
    CONVERTED: 100,
    UNRESPONSIVE: 5,
    UNSUBSCRIBED: 0,
    REJECTED: 0,
  };
  score += statusPoints[s.status] ?? 10;

  if (s.status === 'CONVERTED') return 100;
  if (s.status === 'UNSUBSCRIBED' || s.status === 'REJECTED') return 0;

  // A répondu = très bon signal
  if (s.lastInboundAt) score += 20;
  if (s.hasConversations) score += 5;

  // Réactivité récente
  if (s.lastInboundAt) {
    const days = (Date.now() - s.lastInboundAt.getTime()) / 86400000;
    if (days <= 3) score += 10;
    else if (days <= 14) score += 5;
  }

  // Trop de relances sans réponse = refroidissement
  if (!s.lastInboundAt && s.contactAttempts >= 3) score -= 15;
  if (!s.lastInboundAt && s.contactAttempts >= 5) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}
