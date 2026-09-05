import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'importar-genealogia-con-ia',
  title: 'Sube una foto de la genealogía y ten el árbol en segundos',
  excerpt:
    'Pasar un pedigree a mano es un suplicio. En Genealogic haces una foto y la IA extrae el árbol completo —perro y ancestros—, listo para revisar. Gratis.',
  date: '2026-09-05',
  category: 'Plataforma',
  heroImage: '/blog/importar-genealogia-con-ia.jpg',
  heroAlt: 'Ilustración de una foto de pedigree convirtiéndose en un árbol genealógico digital',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Pasar la genealogía de un perro a mano —tecleando nombre por nombre, generación por
        generación— es de esas tareas que dejas «para otro día» y nunca haces. Genealogic te lo quita
        de encima: haces una foto y la IA hace el resto.
      </Lead>

      <H2>Cómo funciona</H2>
      <P>
        Al dar de alta un perro, en lugar de escribir el árbol, <Strong>subes una foto del
        pedigree</Strong>. La IA lo lee y extrae automáticamente el ejemplar y toda su ascendencia
        —padres, abuelos, bisabuelos— con sus datos: nombre, sexo, registro, raza, color, fecha de
        nacimiento. En segundos tienes el árbol montado.
      </P>
      <UL>
        <LI>
          <Strong>Cualquier formato.</Strong> Planos de FCI, RSCE, AKC… incluso pedigríes
          manuscritos.
        </LI>
        <LI>
          <Strong>Revisión antes de guardar.</Strong> Te muestra una vista previa editable y marca
          los campos de los que no está seguro, para que los repases tú. Tú tienes la última palabra.
        </LI>
        <LI>
          <Strong>Doble pasada de IA.</Strong> Un modelo extrae y otro verifica, para reducir
          errores de lectura.
        </LI>
      </UL>

      <Callout kind="tip" title="Es el camino por defecto">
        Cuando creas un perro en Genealogic, el modo de importar por foto ya viene activado. Lo raro
        es teclear a mano; lo normal es fotografiar y revisar.
      </Callout>

      <H2>Por qué importa</H2>
      <P>
        Porque la excusa de siempre para no digitalizar el criadero es el tiempo. Si meter una línea
        entera cuesta una foto, la excusa desaparece. Y una vez tus perros están dentro con su
        genealogía, se te abre todo lo demás: fichas para compartir con compradores, el simulador de
        cruces, el cálculo de consanguinidad…
      </P>

      <P>
        Importar genealogías con IA es <Strong>gratis y para todos</Strong> —no necesitas plan de
        pago—. Sube la primera foto y verás el árbol aparecer solo.
      </P>

      <PostCta variant="import" />
    </>
  )
}
