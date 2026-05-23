import { redirect } from 'next/navigation'

/**
 * Ruta legacy /planner — redirige a /cruces.
 * Mantenida para no romper bookmarks, enlaces compartidos o referencias
 * en correos antiguos. Ver commit del rename para el contexto.
 */
export default function PlannerLegacyRedirect() {
  redirect('/cruces')
}
