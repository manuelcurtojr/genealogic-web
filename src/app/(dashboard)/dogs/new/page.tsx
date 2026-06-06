import { redirect } from 'next/navigation'

// La página manual de "Crear perro" se retiró: ahora "Añadir perro" es un popup a
// pantalla completa (Manual / Importador) que se abre desde /dogs. Cualquier enlace
// que aún apunte aquí se redirige al popup vía el deeplink ?new=1.
export default function NewDogPage() {
  redirect('/dogs?new=1')
}
