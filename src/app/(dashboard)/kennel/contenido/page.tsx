import { redirect } from 'next/navigation'

// El hub no tiene contenido propio — manda directo a la primera sección.
export default function KennelContenidoIndex() {
  redirect('/kennel/contenido/sobre')
}
