// Envoi e-mail transactionnel via l'API Brevo (côté serveur).
// Utilise BREVO_API_KEY (déjà présent dans le .env pour les scripts d'outreach).

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export interface BrevoSendResult {
  ok: boolean;
  status: number;
  messageId?: string;
  error?: string;
  ipBlocked?: boolean;
}

export async function sendBrevoEmail(params: {
  to: string;
  subject: string;
  html: string;
  senderName?: string;
  senderEmail?: string;
  tag?: string;
}): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, status: 0, error: 'BREVO_API_KEY manquant' };

  try {
    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: params.senderName || 'Mada Spot',
          email: params.senderEmail || 'contact@madaspot.com',
        },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        headers: params.tag ? { 'X-Mailin-Tag': params.tag } : undefined,
      }),
    });

    const text = await res.text();
    if (res.status === 200 || res.status === 201) {
      let messageId: string | undefined;
      try {
        messageId = JSON.parse(text).messageId;
      } catch {
        /* ignore */
      }
      return { ok: true, status: res.status, messageId };
    }
    return {
      ok: false,
      status: res.status,
      error: text.slice(0, 200),
      ipBlocked: /unrecognised IP|unrecognized IP/i.test(text),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'Erreur réseau' };
  }
}
