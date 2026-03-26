import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Couleurs par catégorie
const categoryColors: Record<string, { bg: string; accent: string; text: string }> = {
  'Actualités': { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' },
  'Politique': { bg: '#0f3460', accent: '#e94560', text: '#ffffff' },
  'Économie': { bg: '#1a472a', accent: '#2ecc71', text: '#ffffff' },
  'Sport': { bg: '#c0392b', accent: '#e74c3c', text: '#ffffff' },
  'Culture': { bg: '#8e44ad', accent: '#9b59b6', text: '#ffffff' },
  'Société': { bg: '#2c3e50', accent: '#3498db', text: '#ffffff' },
  'International': { bg: '#1a365d', accent: '#4299e1', text: '#ffffff' },
  'Faits divers': { bg: '#44403c', accent: '#f59e0b', text: '#ffffff' },
  'Santé': { bg: '#065f46', accent: '#10b981', text: '#ffffff' },
  'Technologie': { bg: '#312e81', accent: '#6366f1', text: '#ffffff' },
  'Environnement': { bg: '#14532d', accent: '#22c55e', text: '#ffffff' },
  'Éducation': { bg: '#1e3a5f', accent: '#60a5fa', text: '#ffffff' },
};

// Génère un pattern unique basé sur le hash du titre
function generatePatternSeed(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Mada Spot Info';
  const category = searchParams.get('category') || 'Actualités';
  const width = parseInt(searchParams.get('w') || '800');
  const height = parseInt(searchParams.get('h') || '450');

  const colors = categoryColors[category] || categoryColors['Actualités'];
  const seed = generatePatternSeed(title);

  // Générer des formes géométriques basées sur le seed
  const shapes = [];
  const numShapes = 5 + (seed % 5);

  for (let i = 0; i < numShapes; i++) {
    const x = ((seed * (i + 1) * 17) % 100);
    const y = ((seed * (i + 1) * 23) % 100);
    const size = 50 + ((seed * (i + 1)) % 150);
    const opacity = 0.05 + ((seed * (i + 1)) % 10) / 100;
    shapes.push({ x, y, size, opacity });
  }

  // Tronquer le titre si trop long
  const displayTitle = title.length > 80 ? title.substring(0, 77) + '...' : title;
  const titleLines = wrapText(displayTitle, 25);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${colors.bg} 0%, ${adjustColor(colors.bg, 20)} 50%, ${colors.bg} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Formes géométriques de fond */}
        {shapes.map((shape, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              width: shape.size,
              height: shape.size,
              borderRadius: i % 2 === 0 ? '50%' : '0',
              background: colors.accent,
              opacity: shape.opacity,
              transform: `rotate(${(seed * i) % 360}deg)`,
            }}
          />
        ))}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        {/* Madagascar flag stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '8px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, background: '#ffffff' }} />
          <div style={{ flex: 1, background: '#fc3d32' }} />
          <div style={{ flex: 1, background: '#007e3a' }} />
        </div>

        {/* Contenu principal */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '40px 50px 40px 60px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Category badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                background: colors.accent,
                color: colors.text,
                padding: '8px 20px',
                borderRadius: '25px',
                fontSize: 18,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {category}
            </div>
          </div>

          {/* Titre */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: 'auto',
              marginBottom: '20px',
            }}
          >
            {titleLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: colors.text,
                  fontSize: titleLines.length > 2 ? 32 : 40,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Footer avec logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {/* Logo stylisé */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${adjustColor(colors.accent, -20)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                M
              </div>
              <div
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                Mada Spot Info
              </div>
            </div>

            {/* Mini drapeau Madagascar */}
            <div
              style={{
                display: 'flex',
                width: 36,
                height: 24,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ width: '33%', background: '#ffffff' }} />
              <div style={{ width: '67%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: '#fc3d32' }} />
                <div style={{ flex: 1, background: '#007e3a' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}

// Fonction pour ajuster la luminosité d'une couleur
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Fonction pour wrapper le texte en lignes
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 3); // Max 3 lignes
}
