import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mada Spot — Bons Plans à Madagascar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Madagascar flag accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            display: 'flex',
          }}
        >
          <div style={{ flex: 1, background: '#ffffff' }} />
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, background: '#fc3d32' }} />
            <div style={{ flex: 1, background: '#007e3a' }} />
          </div>
        </div>

        {/* Logo text */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 16 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#e63946' }}>Mada</span>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#2a9d8f' }}>Spot</span>
          <span style={{ fontSize: 40, fontWeight: 700, color: '#e63946' }}>.mg</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            marginBottom: 40,
            letterSpacing: 1,
          }}
        >
          Bons Plans à Madagascar
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['Restaurants', 'Hôtels', 'Attractions'].map(
            (item) => (
              <div
                key={item}
                style={{
                  padding: '10px 24px',
                  borderRadius: 50,
                  background: 'rgba(255, 107, 53, 0.15)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  color: '#ff8f66',
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            fontSize: 18,
            color: '#64748b',
          }}
        >
          madaspot.com
        </div>
      </div>
    ),
    { ...size }
  );
}
