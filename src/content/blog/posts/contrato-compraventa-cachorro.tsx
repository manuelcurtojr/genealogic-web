import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'contrato-compraventa-cachorro',
  title: 'Contrato de compraventa de cachorro: qué debe incluir (y por qué te protege)',
  excerpt:
    'Vender un cachorro sin contrato es buscarse problemas. Punto por punto, qué debe incluir un contrato de compraventa que os proteja a ti y al comprador.',
  date: '2026-09-05',
  category: 'Legal',
  heroImage:
    '/blog/contrato-compraventa-cachorro.jpg',
  heroAlt: 'Un contrato de compraventa de cachorro sobre una mesa, listo para firmar',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Todavía hay muchos criadores que entregan un cachorro con un apretón de manos y poco más. Va
        bien… hasta que va mal.
      </Lead>
      <P>
        Un malentendido sobre la garantía de salud, una devolución, una discusión sobre si el perro
        se podía criar o no. Un buen contrato no es desconfianza: es dejar claro, por escrito y de
        mutuo acuerdo, qué esperáis cada uno. Protege al comprador y te protege a ti. Esto es lo que
        no debería faltar.
      </P>

      <H2>Las partes y el animal</H2>
      <UL>
        <LI>
          <Strong>Datos de las dos partes:</Strong> criador y comprador, con identificación.
        </LI>
        <LI>
          <Strong>Identificación del cachorro:</Strong> nombre, fecha de nacimiento, sexo, color,
          número de microchip y su <Strong>genealogía</Strong> (padres y ascendencia). Que no haya
          duda de qué animal se vende.
        </LI>
      </UL>

      <H2>Precio y forma de pago</H2>
      <UL>
        <LI>
          <Strong>Precio total</Strong> y desglose: cuánto es la reserva/señal y cuánto queda a la
          entrega.
        </LI>
        <LI>
          <Strong>Qué pasa si el comprador se echa atrás:</Strong> ¿la señal se devuelve o no?
          Déjalo escrito y evitas el conflicto más clásico.
        </LI>
      </UL>

      <H2>Salud y garantías</H2>
      <UL>
        <LI>
          <Strong>Estado sanitario en la entrega:</Strong> vacunas, desparasitaciones, revisión
          veterinaria.
        </LI>
        <LI>
          <Strong>Garantía de salud:</Strong> qué cubres y durante cuánto tiempo, y qué pruebas ha
          pasado la camada. Sé realista y honesto: una garantía clara vale más que una promesa
          vaga.
        </LI>
      </UL>

      <H2>Condiciones de uso y entrega</H2>
      <UL>
        <LI>
          <Strong>Documentación que entregas:</Strong> cartilla, genealogía, el documento de la
          genealogía oficial del club si la hay.
        </LI>
        <LI>
          <Strong>Condiciones especiales</Strong>, si las pactáis: destino como compañía o cría,
          esterilización, derecho de tanteo si el comprador se deshace del perro…
        </LI>
        <LI>
          <Strong>Fecha y condiciones de entrega.</Strong>
        </LI>
      </UL>

      <Callout kind="warning" title="Un apunte">
        Esto es una guía general, no asesoramiento legal. Para cláusulas concretas o casos
        delicados, que le eche un ojo un profesional.
      </Callout>

      <H2>Que no te dé pereza hacerlo</H2>
      <P>
        El motivo real por el que muchos no usan contrato es que da pereza redactarlo cada vez. En
        Genealogic esto está resuelto: por cada reserva se generan{' '}
        <Strong>dos contratos ya rellenados</Strong> —el de reserva y el de entrega— con los datos
        del cachorro, su genealogía y las condiciones, listos para firmar. El comprador rellena sus
        datos y el documento se regenera solo.
      </P>
      <P>
        Pasas de «algún día hago una plantilla» a tener el contrato hecho en cada venta, sin
        esfuerzo. Y esa profesionalidad, el comprador la nota.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
