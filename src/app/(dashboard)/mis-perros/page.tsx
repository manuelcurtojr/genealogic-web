/**
 * /mis-perros — FUSIONADO con /dogs.
 *
 * Antes existían dos listas separadas: "Perros" (criados) y "Mis perros"
 * (recibidos como propietario). Se unificaron en /dogs, que ya muestra
 * ambos. Esta ruta se mantiene solo como redirect para no romper enlaces
 * antiguos.
 */
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MisPerrosPage() {
  redirect('/dogs')
}
