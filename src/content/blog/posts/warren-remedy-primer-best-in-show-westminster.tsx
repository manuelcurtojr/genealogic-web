import { H2, P, Lead, Strong, Em, UL, LI } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'warren-remedy-primer-best-in-show-westminster',
  title: 'Ch. Warren Remedy (1905): la fox terrier que inauguró el Best in Show del Westminster',
  excerpt:
    'En 1907, en la 31ª edición del Westminster Kennel Club Dog Show, se concedió por primera vez en la historia el Best in Show. Lo ganó una fox terrier hembra de 21 meses. Y lo volvió a ganar al año siguiente. Y al siguiente. Hazaña jamás repetida.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/warren-remedy.jpg',
  heroAlt: 'Ch. Warren Remedy, fox terrier smooth, tricampeona Westminster',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        En la edición de febrero de 1907 del <Strong>Westminster Kennel Club Dog Show</Strong> —
        ya entonces la exposición canina más prestigiosa del mundo — se concedió por primera vez
        en la historia el <Strong>Best in Show</Strong>. Lo ganó una fox terrier smooth llamada{' '}
        <Strong>Ch. Warren Remedy</Strong>. Al año siguiente, lo volvió a ganar. Y al siguiente.{' '}
        <Strong>Único caso de tricampeonato consecutivo</Strong> en los 119 años de historia del
        torneo.
      </Lead>

      <H2>El Westminster antes del Best in Show</H2>
      <P>
        El Westminster Kennel Club se fundó en 1877 en Nueva York como club de aficionados a la
        caza. Su exposición canina anual empezó ese mismo año y rápidamente se convirtió en el
        evento canino más importante de Estados Unidos. Durante las primeras 30 ediciones se
        repartieron premios por raza, por grupo, y por categorías especiales (mejor cabeza, mejor
        movimiento), pero <Strong>nunca un premio absoluto</Strong> que coronara al «mejor del
        mejor».
      </P>
      <P>
        En 1907 el comité decidió implementar el <Em>Best in Show</Em>: una ronda final entre los
        ganadores de cada grupo (en aquel momento: Sporting, Sporting Terrier, Working, Toy,
        Hound...). El juez de honor sería <Strong>Reverend H. F. Williams</Strong>, autoridad
        respetada en cinofilia.
      </P>

      <H2>La candidata sorpresa</H2>
      <P>
        Warren Remedy era una <Strong>Smooth Fox Terrier</Strong> hembra nacida en 1905, criada
        por <Strong>Winthrop Rutherfurd</Strong> en su perrera Warren Kennels (Allamuchy, New
        Jersey). Hija de <Em>Sabine Resist</Em> y <Em>Routon Dainty</Em>, ambos campeones de
        línea inglesa importada. Pesaba 7,5 kg, color blanco con marcas atigradas y negras
        clásicas del fox terrier.
      </P>
      <P>
        En las eliminatorias de Westminster 1907 ganó su clase, ganó la raza, ganó el grupo
        Terrier... y se metió en la primera final del Best in Show de la historia. Compitió
        contra: un Pomerania, un Cocker Spaniel, un Bulldog, un Boston Terrier y un Pointer. El
        Reverend Williams la eligió por unanimidad.
      </P>

      <H2>El triplete imposible</H2>
      <P>
        Lo extraordinario no fue ganar una vez. Fue volver a hacerlo:
      </P>
      <UL>
        <LI>
          <Strong>1907</Strong> — Best in Show (juez: Rev. H. F. Williams)
        </LI>
        <LI>
          <Strong>1908</Strong> — Best in Show (juez: G. Raper)
        </LI>
        <LI>
          <Strong>1909</Strong> — Best in Show (juez: Charles G. Hopton)
        </LI>
      </UL>
      <P>
        Tres jueces distintos, tres años consecutivos, mismo resultado. Ese triplete sigue siendo
        el récord absoluto del Westminster en 119 años de historia. Solo otra perra ha repetido
        Best in Show dos años (Sealyham Terrier en 1929-1931), pero con un año de pausa.
      </P>

      <H2>El fenómeno fox terrier</H2>
      <P>
        Warren Remedy no estuvo sola en su éxito. El <Strong>Smooth Fox Terrier</Strong> dominó
        Westminster durante las primeras décadas: ganó el Best in Show <Strong>14 veces entre
        1907 y 1946</Strong>, más que cualquier otra raza en la historia. Las razones:
      </P>
      <UL>
        <LI>
          <Strong>Estructura ideal</Strong> para los criterios de juez de la época (cuadrado,
          aplomado, movimiento limpio)
        </LI>
        <LI>
          <Strong>Manto fácil de presentar</Strong> (corto, denso, no requiere trimming complejo)
        </LI>
        <LI>
          <Strong>Temperamento alerta</Strong> que se traduce en buena «expresión» en ring
        </LI>
        <LI>
          <Strong>Presencia social</Strong>: los criadores de fox terrier eran de la alta sociedad
          de la Costa Este (mismo perfil que los socios del Westminster Kennel Club)
        </LI>
      </UL>

      <PedigreePreview
        dog={{ name: 'Ch. Warren Remedy', slug: 'warren-remedy', birthYear: 1905 }}
        father={{ name: 'Sabine Resist', slug: 'sabine-resist' }}
        mother={{ name: 'Routon Dainty', slug: 'routon-dainty' }}
      />

      <H2>El legado como reproductora</H2>
      <P>
        Tras retirarse del ring en 1910 con cinco años, Warren Remedy se dedicó a la cría en las
        perreras Warren. Tuvo seis camadas documentadas. Sus hijas más destacadas:
      </P>
      <UL>
        <LI>
          <Strong>Warren Remedy II</Strong> — ganadora de varios grupos en exposiciones AKC
        </LI>
        <LI>
          <Strong>Warren Sabine</Strong> — base de la línea Warren para la siguiente generación
        </LI>
      </UL>
      <P>
        Su sangre está en casi todas las líneas modernas de fox terrier smooth americano. Los
        criadores serios de la raza pueden trazar pedigrees verificados hasta ella en 7-9
        generaciones.
      </P>

      <H2>El fox terrier hoy</H2>
      <P>
        El Smooth Fox Terrier ha decaído en popularidad desde los años 50 — desplazado por razas
        más amigables familiarmente como el Jack Russell o el Beagle. Pero sigue siendo una raza
        muy estable de salud, longeva (12-15 años de media), con pocos problemas hereditarios
        importantes y temperamento equilibrado para vida activa.
      </P>
      <P>
        Si te interesa la raza, los criadores serios usan referencias morfológicas que se remontan
        a Warren Remedy: estructura cuadrada, frente plana, ojos pequeños y oscuros, expresión
        alerta. El estándar FCI (#12) y AKC siguen describiendo lo que ella era.
      </P>

      <H2>El final</H2>
      <P>
        Warren Remedy murió en 1916 a los 11 años en las perreras Warren. Está enterrada en la
        finca Warren en Allamuchy, New Jersey, en un pequeño cementerio canino familiar que sigue
        existiendo. Su lápida es modesta — solo nombre, fechas, y la inscripción{' '}
        <Em>«First Best in Show, Westminster, 1907»</Em>.
      </P>
      <P>
        Su trofeo original — la primera Best in Show de Westminster jamás concedida — se conserva
        en el American Kennel Club Museum of the Dog (St. Louis, Missouri).
      </P>
    </>
  )
}
