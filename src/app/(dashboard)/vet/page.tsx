import { redirect } from 'next/navigation'

/**
 * La página suelta "Veterinario" (/vet) se retiró: la cartilla veterinaria y
 * sus recordatorios viven ahora UNIFICADOS en la pestaña "Salud" de cada perro
 * (se crean ahí y se ven en el calendario + la ficha). La agenda global está en
 * /calendar. Redirigimos para no romper enlaces antiguos ni accesos directos.
 */
export default function VetPage() {
  redirect('/calendar')
}
