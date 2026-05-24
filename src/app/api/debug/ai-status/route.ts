/**
 * Diagnóstico: qué providers de IA están configurados en el servidor.
 * Público. Solo expone booleans (¿hay key o no?), no la key.
 * Si todo va bien, este endpoint se puede borrar después.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GOOGLE_GENERATIVE_AI_KEY,
    timestamp: new Date().toISOString(),
    deployment_id: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || 'local',
  })
}
