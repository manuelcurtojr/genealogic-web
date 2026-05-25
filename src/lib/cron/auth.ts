/**
 * Helper para autorizar las llamadas a /api/cron/*.
 *
 * Vercel Cron añade `Authorization: Bearer ${CRON_SECRET}` cuando dispara
 * un cron definido en vercel.json. Verificamos eso aquí.
 *
 * Si alguien intenta llamar el endpoint manualmente sin el header → 401.
 * En desarrollo (sin CRON_SECRET configurado) permitimos para poder
 * testear con curl local.
 */
import 'server-only'
import { NextResponse } from 'next/server'

export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Modo dev: permitimos sin auth (solo si NODE_ENV != production)
    return process.env.NODE_ENV !== 'production'
  }
  const header = req.headers.get('authorization')
  return header === `Bearer ${secret}`
}

export function cronUnauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
