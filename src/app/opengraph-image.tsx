/**
 * OG image dinámico de la home y default para toda la app.
 * Next.js lo genera al build/deploy y lo expone en /opengraph-image
 * (Next inyecta automáticamente <meta property="og:image"> en TODAS las
 * páginas que no definan su propia imagen — porque vive en src/app/).
 */
import { ImageResponse } from 'next/og'

// Convención Next.js — definen el output del PNG
export const runtime = 'edge'
export const alt = 'Genealogic — Genealogías caninas verificables'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FAFAF7',
          padding: '80px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Líneas decorativas naranjas - sutiles, evocan árbol genealógico */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '550px',
            height: '630px',
            opacity: 0.06,
          }}
          viewBox="0 0 550 630"
          fill="none"
        >
          <circle cx="400" cy="100" r="40" fill="#FE6620" />
          <circle cx="500" cy="250" r="30" fill="#FE6620" />
          <circle cx="350" cy="350" r="50" fill="#FE6620" />
          <circle cx="480" cy="480" r="35" fill="#FE6620" />
          <circle cx="280" cy="500" r="25" fill="#FE6620" />
          <line x1="400" y1="100" x2="500" y2="250" stroke="#FE6620" strokeWidth="3" />
          <line x1="400" y1="100" x2="350" y2="350" stroke="#FE6620" strokeWidth="3" />
          <line x1="500" y1="250" x2="480" y2="480" stroke="#FE6620" strokeWidth="3" />
          <line x1="350" y1="350" x2="280" y2="500" stroke="#FE6620" strokeWidth="3" />
          <line x1="350" y1="350" x2="480" y2="480" stroke="#FE6620" strokeWidth="3" />
        </svg>

        {/* Logo - símbolo Genealogic en naranja */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '60px' }}>
          <svg width="100" height="100" viewBox="0 0 320 320" fill="none">
            {/* Recreación simplificada del path original del logo */}
            <path
              d="M 54 54 L 50 57 L 44 64 L 41 71 L 39 77 L 39 85 L 40 90 L 43 98 L 47 104 L 54 110 L 61 113 L 68 114 L 81 114 L 86 116 L 91 118 L 98 125 L 104 129 L 125 130 L 129 132 L 134 139 L 134 151 L 132 158 L 129 162 L 121 167 L 116 172 L 111 179 L 109 184 L 108 192 L 108 198 L 110 206 L 113 211 L 117 217 L 122 221 L 128 224 L 133 225 L 140 226 L 146 226 L 153 224 L 158 221 L 166 214 L 171 206 L 173 198 L 174 190 L 171 181 L 167 173 L 161 167 L 153 162 L 149 156 L 148 151 L 148 141 L 150 135 L 154 131 L 158 129 L 176 129 L 182 127 L 187 123 L 193 117 L 198 114 L 203 113 L 219 113 L 226 111 L 233 106 L 240 99 L 242 95 L 245 87 L 245 76 L 240 65 L 233 57 L 224 52 L 212 50 L 202 52 L 191 58 L 187 63 L 183 69 L 181 76 L 180 84 L 183 96 L 183 101 L 181 106 L 177 111 L 169 114 L 114 114 L 106 111 L 103 108 L 101 103 L 100 97 L 103 86 L 103 77 L 101 70 L 96 61 L 87 54 L 76 50 L 64 50 Z"
              fill="#FE6620"
            />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#111111',
                letterSpacing: '-2.5px',
                lineHeight: 1,
              }}
            >
              Genealogic
            </div>
          </div>
        </div>

        {/* Tagline principal */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: '#111111',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            maxWidth: '900px',
            marginBottom: '32px',
          }}
        >
          Genealogías caninas verificables
        </div>

        {/* Descripción */}
        <div
          style={{
            fontSize: 28,
            color: '#555555',
            lineHeight: 1.4,
            maxWidth: '800px',
            fontWeight: 400,
          }}
        >
          El registro público de genealogías. Cada criador serio, cada perro,
          con su árbol genealógico verificable.
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 80,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: 24,
            color: '#FE6620',
            fontWeight: 600,
            letterSpacing: '-0.5px',
          }}
        >
          genealogic.io
        </div>

        {/* Línea decorativa inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#FE6620',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
