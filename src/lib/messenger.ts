// Facebook Messenger Send API helper
// Docs: https://developers.facebook.com/docs/messenger-platform/send-messages
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.META_APP_SECRET || '';
export const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || '';

export function isMessengerConfigured(): boolean {
  return Boolean(PAGE_ACCESS_TOKEN);
}

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on webhook events.
 * Returns true if the signature matches the raw body using APP_SECRET.
 */
export function verifyMessengerSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!APP_SECRET) {
    logger.warn('META_APP_SECRET is not set — signature verification skipped');
    return process.env.NODE_ENV !== 'production';
  }
  if (!signatureHeader) return false;

  const [algo, signature] = signatureHeader.split('=');
  if (algo !== 'sha256' || !signature) return false;

  const expected = crypto.createHmac('sha256', APP_SECRET).update(rawBody, 'utf8').digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a text message to a Messenger user via the Send API.
 * Uses MESSAGE_TAG / RESPONSE messaging type by default.
 */
export async function sendMessengerMessage(
  recipientPsid: string,
  text: string,
  opts: { messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG'; tag?: string } = {}
): Promise<SendResult> {
  if (!PAGE_ACCESS_TOKEN) {
    return { ok: false, error: 'META_PAGE_ACCESS_TOKEN non configuré' };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;
  const body = {
    recipient: { id: recipientPsid },
    messaging_type: opts.messagingType || 'RESPONSE',
    ...(opts.tag ? { tag: opts.tag } : {}),
    message: { text },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      logger.error('Messenger send failed', data);
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, messageId: data.message_id };
  } catch (err) {
    logger.error('Messenger send threw', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' };
  }
}

/**
 * Fetch the public profile of a Messenger user (first_name, last_name, profile_pic).
 * Used to enrich a Prospect when we receive a first inbound message.
 */
export async function fetchMessengerProfile(psid: string): Promise<{
  firstName?: string;
  lastName?: string;
  profilePic?: string;
  locale?: string;
} | null> {
  if (!PAGE_ACCESS_TOKEN) return null;
  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(psid)}?fields=first_name,last_name,profile_pic,locale&access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      firstName: data.first_name,
      lastName: data.last_name,
      profilePic: data.profile_pic,
      locale: data.locale,
    };
  } catch {
    return null;
  }
}
