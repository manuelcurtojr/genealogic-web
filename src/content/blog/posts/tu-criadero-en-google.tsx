import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'tu-criadero-en-google',
  title: 'Tu criadero en Google: el escaparate que trabaja por ti mientras duermes',
  excerpt:
    'El comprador te busca en internet antes de escribirte. En Genealogic tu criadero tiene una ficha pública, cuidada y posicionada en Google, sin que hagas nada.',
  date: '2026-09-05',
  category: 'Plataforma',
  heroImage: '/blog/tu-criadero-en-google.jpg',
  heroAlt: 'Ilustración de la ficha pública de un criadero apareciendo en una búsqueda de Google',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Antes de escribirte, el comprador teclea el nombre de tu criadero en Google. Lo que
        encuentre —o no encuentre— decide si te toma en serio. En Genealogic eso ya está resuelto.
      </Lead>

      <H2>Una ficha pública, sin montar una web</H2>
      <P>
        Cada criadero en Genealogic tiene su <Strong>página pública</Strong>, automática. No hay que
        contratar a nadie ni pelearse con un gestor de webs. Muestra:
      </P>
      <UL>
        <LI>Tu criadero: nombre, ubicación, año de fundación, razas y un sello de <Strong>verificado</Strong> cuando lo reclamas.</LI>
        <LI>Tu trayectoria en números: años activo, nº de perros, camadas.</LI>
        <LI>Tu catálogo por pestañas: reproductores, ejemplares en venta, camadas y todo lo que has criado —cada uno con su genealogía.</LI>
        <LI>Botón de contacto y enlaces a tu web e Instagram.</LI>
      </UL>

      <H2>Y lo importante: te posiciona en Google</H2>
      <P>
        La ficha está construida para <Strong>aparecer en buscadores</Strong>: título y descripción
        optimizados, datos estructurados que Google entiende y presencia en el mapa del sitio junto a
        miles de criaderos. Traducción: cuando alguien busca tu criadero —o tu raza en tu zona—,
        tienes muchas más posibilidades de salir. Es marketing que trabaja por ti mientras duermes.
      </P>

      <Callout kind="tip" title="Reclamar da confianza">
        Un criadero reclamado y verificado transmite mucha más seriedad al comprador que una ficha
        anónima. Y reclamar tu criadero es gratis.
      </Callout>

      <H2>Gratis, para todos</H2>
      <P>
        No es una función de pago: cualquier criadero en Genealogic tiene su ficha pública. Cuanto
        más completa la tengas —perros con foto y genealogía, tu historia, tus camadas—, mejor
        escaparate y mejor posicionamiento.
      </P>

      <PostCta variant="register" />
    </>
  )
}
