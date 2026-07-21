import React from 'react';

/**
 * Rendu propre d'une description d'établissement.
 * Convertit un Markdown léger — liens [texte](url), paragraphes (double saut de
 * ligne) et retours simples — en JSX cadré et aéré, sans dépendance externe
 * (react-markdown n'est pas installé). Les marqueurs gras/italique bruts sont
 * nettoyés plutôt qu'affichés tels quels.
 */

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [, label, url] = match;
    nodes.push(
      <a
        key={`${keyBase}-a${i++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#FF6B35] font-medium underline decoration-[#FF6B35]/30 underline-offset-2 hover:decoration-[#FF6B35] transition-colors"
      >
        {label}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function EstablishmentDescription({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text || !text.trim()) return null;

  // Nettoyage léger : retire les marqueurs gras/italique Markdown bruts.
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(?!\s)(.+?)\*/g, '$1$2');

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-4 text-[15px] leading-relaxed text-slate-600 ${className}`}>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n');
        return (
          <p key={pi}>
            {lines.flatMap((line, li) => {
              const parts = renderInline(line, `p${pi}l${li}`);
              return li < lines.length - 1
                ? [...parts, <br key={`br${pi}-${li}`} />]
                : parts;
            })}
          </p>
        );
      })}
    </div>
  );
}
