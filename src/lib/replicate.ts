/**
 * Cliente ligero de Replicate (REST, sin SDK) para upscale de imágenes.
 *
 * Usamos Real-ESRGAN (nightmareai/real-esrgan), que multiplica la resolución
 * x2–x4 y opcionalmente mejora caras. Llamamos al endpoint por modelo (sin
 * fijar version hash) con `Prefer: wait` para resolver de forma síncrona; si
 * Replicate no termina dentro de la ventana, hacemos polling corto.
 *
 * Setup (env var):
 *   REPLICATE_API_TOKEN — token r8_… de replicate.com
 *
 * El output de Replicate es una URL temporal (~1h). Quien llame a
 * upscaleImageUrl() DEBE descargar el resultado y subirlo a su propio
 * storage; no guardar la URL de Replicate directamente.
 */

const REPLICATE_API = 'https://api.replicate.com/v1'
const MODEL = 'nightmareai/real-esrgan'

export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN
}

function authHeader(): Record<string, string> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN no configurada')
  return { Authorization: `Bearer ${token}` }
}

type Prediction = {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[] | null
  error?: string | null
  urls?: { get?: string }
}

/** Extrae la URL de salida (Real-ESRGAN devuelve string; por si acaso array). */
function outputUrl(p: Prediction): string | null {
  if (!p.output) return null
  return Array.isArray(p.output) ? (p.output[0] ?? null) : p.output
}

/**
 * Mejora una imagen con Real-ESRGAN y devuelve la URL del resultado en
 * Replicate (temporal). Lanza si falla o si no termina a tiempo.
 *
 * @param imageUrl  URL pública de la imagen a mejorar
 * @param scale     factor de escala (2 por defecto; 4 = más pesado)
 */
export async function upscaleImageUrl(imageUrl: string, scale: 2 | 4 = 2): Promise<string> {
  // 1) Crear predicción con Prefer: wait (espera hasta ~60s a que termine).
  const res = await fetch(`${REPLICATE_API}/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({
      input: { image: imageUrl, scale, face_enhance: false },
    }),
  })

  const json = (await res.json()) as Prediction
  if (!res.ok) {
    throw new Error((json as any)?.detail || (json as any)?.error || `Replicate error ${res.status}`)
  }

  let prediction = json

  // 2) Si con Prefer: wait no llegó a término, hacemos polling corto.
  let tries = 0
  while (
    (prediction.status === 'starting' || prediction.status === 'processing') &&
    prediction.urls?.get &&
    tries < 20
  ) {
    await new Promise((r) => setTimeout(r, 2500))
    const poll = await fetch(prediction.urls.get, { headers: authHeader() })
    prediction = (await poll.json()) as Prediction
    tries++
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(prediction.error || `El upscale no se completó (estado: ${prediction.status})`)
  }

  const url = outputUrl(prediction)
  if (!url) throw new Error('Replicate no devolvió imagen de salida')
  return url
}
