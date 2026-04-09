import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
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
          backgroundColor: '#030712',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            backgroundColor: '#D74709', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', color: 'white', fontWeight: 'bold',
          }}>
            G
          </div>
          <span style={{ fontSize: '60px', fontWeight: 'bold', color: 'white' }}>Genealogic</span>
        </div>
        <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '700px' }}>
          La plataforma definitiva para criadores y propietarios de perros
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
