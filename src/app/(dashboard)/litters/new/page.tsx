/**
 * /litters/new — FUSIONADO con el panel lateral de /litters.
 *
 * La creación de camadas se hace ahora desde el panel lateral que se abre
 * en /litters (botón "Nueva camada"). Esta ruta redirige y auto-abre el
 * panel con ?new=1 para no romper enlaces antiguos.
 */
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewLitterPage() {
  redirect('/litters?new=1')
}
