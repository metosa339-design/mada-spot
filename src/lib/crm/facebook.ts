// Publication sur la page Facebook via l'API Graph (jeton META_PAGE_ACCESS_TOKEN).
// Si le jeton est invalide/absent, on renvoie le texte prêt à copier-coller.

const SITE = 'https://madaspot.com';

export interface PostInput {
  title: string;
  description?: string | null;
  city?: string | null;
  dateLabel?: string | null;
  link?: string | null;
  imageUrl?: string | null;
}

function hashtag(s: string): string {
  return '#' + s.replace(/[^\p{L}\p{N}]/gu, '');
}

export function buildPostText(p: PostInput): string {
  const lines: string[] = [];
  lines.push(p.title.trim());
  if (p.description) lines.push('', p.description.trim());
  const meta: string[] = [];
  if (p.city) meta.push(`📍 ${p.city}`);
  if (p.dateLabel) meta.push(`🗓️ ${p.dateLabel}`);
  if (meta.length) lines.push('', meta.join('   '));
  const link = p.link || SITE;
  lines.push('', `👉 ${link}`);
  const tags = ['#MadaSpot', '#Madagascar'];
  if (p.city) tags.push(hashtag(p.city));
  lines.push('', tags.join(' '));
  return lines.join('\n');
}

export interface PostResult {
  posted: boolean;
  postId?: string;
  text: string;
  reason?: string;
}

export async function postToFacebook(p: PostInput): Promise<PostResult> {
  const text = buildPostText(p);
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const version = process.env.META_GRAPH_VERSION || 'v19.0';
  if (!token) return { posted: false, text, reason: 'Aucun jeton Facebook configuré' };

  try {
    // Résoudre l'ID de la page à partir du jeton
    const meRes = await fetch(`https://graph.facebook.com/${version}/me?fields=id&access_token=${encodeURIComponent(token)}`);
    const me = await meRes.json();
    if (!me?.id) return { posted: false, text, reason: 'Jeton Facebook invalide ou expiré — reconnectez la page' };
    const pageId = me.id;

    let endpoint: string;
    const body: Record<string, string> = { access_token: token };
    if (p.imageUrl) {
      endpoint = `https://graph.facebook.com/${version}/${pageId}/photos`;
      body.url = p.imageUrl;
      body.caption = text;
    } else {
      endpoint = `https://graph.facebook.com/${version}/${pageId}/feed`;
      body.message = text;
      if (p.link) body.link = p.link;
    }
    const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });
    const data = await res.json();
    if (data?.id || data?.post_id) return { posted: true, postId: data.id || data.post_id, text };
    return { posted: false, text, reason: data?.error?.message || 'Échec de la publication' };
  } catch (e) {
    return { posted: false, text, reason: e instanceof Error ? e.message : 'Erreur réseau' };
  }
}
