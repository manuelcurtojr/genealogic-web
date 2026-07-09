/**
 * Redirect: /clientes → /contactos
 *
 * El antiguo módulo "Clientes" (que solo mostraba la tabla owners del CRM)
 * fue absorbido por /contactos, que unifica:
 *   - Leads (solicitudes en estado temprano)
 *   - Clientes (owners + reservas avanzadas)
 *
 * Mantenemos esta ruta como redirect para no romper bookmarks/enlaces
 * externos antiguos.
 */
import { redirect } from 'next/navigation'

export const metadata = { title: 'Contactos · Genealogic' }

export default function ClientesRedirect() {
  redirect('/contactos')
}
