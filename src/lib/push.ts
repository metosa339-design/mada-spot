import webpush from 'web-push';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@madaspot.mg';

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Send a push notification to all subscribed devices for a given user.
 * Best-effort: failures are logged but never thrown.
 */
export async function sendPushToUser(userId: string, payload: {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  threadId?: string | null;
}): Promise<void> {
  if (!ensureVapidConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          ...payload,
          icon: payload.icon || '/icons/icon-192x192.png',
        })
      );
    } catch (err: any) {
      // 410 Gone or 404 Not Found means the subscription is no longer valid
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        logger.error(`Push failed for subscription ${sub.id}:`, err);
      }
    }
  }
}
