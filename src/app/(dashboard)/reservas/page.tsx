import { redirect } from 'next/navigation'

/**
 * /reservas se ha fusionado en /embudo (el embudo de ventas y reservas).
 * "Reservas" es solo un estado del embudo, no la sección. Redirige.
 * (El detalle /reservas/[id] se mantiene.)
 */
export default function ReservasIndexRedirect() {
  redirect('/embudo')
}
