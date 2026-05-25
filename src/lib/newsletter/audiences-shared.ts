/**
 * Tipos + labels de audiencias (importables desde client components).
 * La lógica server-side vive en `./audiences.ts`.
 */

export type AudienceType = 'all' | 'customers' | 'leads' | 'delivered' | 'custom'

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  all:        'Todos',
  customers:  'Clientes (con reserva)',
  leads:      'Leads (sin reserva)',
  delivered:  'Recibieron cachorro',
  custom:     'Segmento custom',
}

export const AUDIENCE_HINTS: Record<AudienceType, string> = {
  all:        'Todos los suscriptores activos',
  customers:  'Suscriptores que han hecho al menos una reserva (cualquier estado)',
  leads:      'Suscriptores que NUNCA han reservado — ideal para conversión',
  delivered:  'Clientes que ya recibieron cachorro — ideal para repeat sales y referrals',
  custom:     'Filtro custom (próximamente)',
}
