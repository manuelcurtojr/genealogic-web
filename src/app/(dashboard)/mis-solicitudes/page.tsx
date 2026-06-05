/**
 * /mis-solicitudes — fusionado en /soporte (pestaña "Mis solicitudes").
 * Redirect permanente para mantener vivos los enlaces antiguos.
 */
import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/soporte')
}
