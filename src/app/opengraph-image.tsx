import { ImageResponse } from 'next/og';

export const alt = 'Spexly — Plan your vibe coding project visually';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spexlyapp.com';
  const logoResponse = await fetch(new URL('/spexly-logo-white.png', baseUrl));
  const logoArrayBuffer = await logoResponse.arrayBuffer();
  const logoBase64 = `data:image/png;base64,${Buffer.from(logoArrayBuffer).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #0c1425 40%, #0e1b30 100%)',
          position: 'relative',
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            right: '-50px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <img
          src={logoBase64}
          width={180}
          height={72}
          style={{ objectFit: 'contain', marginBottom: '32px' }}
        />

        {/* Tagline pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(6,182,212,0.3)',
              background: 'rgba(6,182,212,0.1)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#a5f3fc',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
            }}
          >
            Spec It Before You Ship It
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: '#f1f5f9',
            lineHeight: 1.15,
            maxWidth: '800px',
            marginBottom: '20px',
          }}
        >
          Plan your vibe coding project before you burn credits.
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: '22px',
            color: '#94a3b8',
            maxWidth: '700px',
            lineHeight: 1.4,
          }}
        >
          Visual planning workspace for Cursor, Bolt, Claude, and more.
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: '18px',
            color: '#22d3ee',
            fontWeight: 600,
          }}
        >
          spexlyapp.com
        </div>
      </div>
    ),
    { ...size },
  );
}
