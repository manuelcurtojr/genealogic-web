import { H2, P, Lead, Strong, Em, UL, LI } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'pal-von-glamis-lassie',
  title: 'Pal von Glamis (1940): el collie macho que fue la primera «Lassie» de Hollywood',
  excerpt:
    'En el imaginario popular Lassie es una collie hembra. Pero el perro original que protagonizó "Lassie Come Home" en 1943 era un macho llamado Pal. La historia detrás de la icono del cine familiar.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/pal-lassie-1942.jpg',
  heroAlt: 'Pal von Glamis, collie original de las películas de Lassie',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Cuando alguien dice <Em>«Lassie»</Em>, pensamos en una collie hembra de pelo largo,
        tricolor, salvando niños caídos a pozos. Esa imagen viene de la novela de 1940{' '}
        <Em>Lassie Come-Home</Em> de Eric Knight. Pero el perro físico que la encarnó en cine —
        el que generó ese imaginario — fue un <Strong>macho llamado Pal</Strong>. Y casi no
        consigue el papel.
      </Lead>

      <H2>Un cachorro problemático</H2>
      <P>
        Pal nació el <Strong>4 de junio de 1940</Strong> en una perrera de North Hollywood. Su
        afijo era «von Glamis» (algo curioso para un perro estadounidense — el dueño era de
        ascendencia escocesa y eligió el nombre del castillo natal de la madre de Isabel II). Era
        un collie rough tricolor estándar, con la mancha blanca clásica en la frente.
      </P>
      <P>
        Sus dueños originales lo entregaron al entrenador <Strong>Rudd Weatherwax</Strong> con
        nueve meses para que le quitara una serie de hábitos: ladraba sin parar y perseguía motos.
        Weatherwax aplicó adiestramiento de obediencia exigente y, cuando los dueños no pudieron
        pagar la factura, se quedó con el perro como pago.
      </P>

      <H2>El casting de Lassie Come Home</H2>
      <P>
        En 1942, MGM compró los derechos de la novela de Knight y planeó una superproducción
        protagonizada por Roddy McDowall y Elizabeth Taylor (en uno de sus primeros papeles
        infantiles). El casting del perro fue largo: probaron <Strong>más de 300 collies</Strong>.
        Pal hizo prueba y la perdió — el director consideró que era demasiado pequeño y de
        movimientos demasiado <Em>«rápidos»</Em>. Eligieron una hembra de exposición.
      </P>
      <P>
        En el rodaje, la hembra elegida se acobardó en una escena clave en la que el perro debía
        cruzar el río San Joaquín a nado. Weatherwax fue llamado <Em>in extremis</Em> con Pal como
        sustituto. Pal cruzó el río sin dudarlo y salió por la orilla opuesta empapado y
        tranquilo. El director, F. M. Wilcox, le dio el papel ahí mismo:
      </P>
      <blockquote className="my-6 border-l-2 border-hairline pl-6 italic text-body">
        <P>
          <Em>«Pal saltó al río y Lassie salió del río»</Em>
          <br />— Rudd Weatherwax, en su biografía de 1950
        </P>
      </blockquote>

      <H2>Por qué un macho hacía de hembra</H2>
      <P>
        Razón técnica: los <Strong>collies machos de pelo largo tienen el manto más denso y
        espectacular</Strong> que las hembras. Cuando una hembra está en celo o tras una camada,
        el pelo se debilita y se cae. El cine requiere continuidad estética entre escenas que
        pueden rodarse con semanas de diferencia — un macho garantiza ese estándar visual sin
        importar la temporada.
      </P>
      <P>
        Pal lo cumplía: tenía el manto de un collie de exposición y era además{' '}
        <Strong>muy estable de carácter</Strong>, requisito imprescindible para rodajes largos con
        niños y equipos ruidosos.
      </P>

      <PedigreePreview
        dog={{ name: 'Pal von Glamis', slug: 'pal-von-glamis', birthYear: 1940 }}
      />

      <H2>El imperio Lassie</H2>
      <P>
        Tras <Em>Lassie Come Home</Em> (1943), Pal protagonizó otras seis películas para MGM:
      </P>
      <UL>
        <LI>
          <Em>Son of Lassie</Em> (1945)
        </LI>
        <LI>
          <Em>Courage of Lassie</Em> (1946)
        </LI>
        <LI>
          <Em>Hills of Home</Em> (1948)
        </LI>
        <LI>
          <Em>The Sun Comes Up</Em> (1949)
        </LI>
        <LI>
          <Em>Challenge to Lassie</Em> (1949)
        </LI>
        <LI>
          <Em>The Painted Hills</Em> (1951) — última actuación, con 11 años
        </LI>
      </UL>
      <P>
        Tras retirarse, Pal cumplió el rol de semental para mantener la línea visual. Cada Lassie
        de cine y televisión hasta hoy desciende directamente de él.
      </P>

      <H2>La dinastía</H2>
      <P>
        Weatherwax mantuvo el linaje en su perrera. Tras Pal vinieron sucesivamente:
      </P>
      <UL>
        <LI>
          <Strong>Lassie Junior</Strong> (hijo de Pal) — protagonista de la serie televisiva CBS
          de 1954-1957
        </LI>
        <LI>
          <Strong>Spook</Strong> y <Strong>Baby</Strong> — temporadas siguientes
        </LI>
        <LI>
          <Strong>Mire</Strong>, <Strong>Hey Hey</Strong>, <Strong>Boy</Strong> — décadas 60-70
        </LI>
        <LI>
          La línea sigue activa hoy con <Strong>Lassie X</Strong>, descendiente directa de Pal
          en 11ª generación, controlada por la familia Weatherwax
        </LI>
      </UL>

      <H2>El collie rough antes y después</H2>
      <P>
        Antes de Lassie, el collie rough era una raza minoritaria conocida casi solo en Escocia y
        norte de Inglaterra. Tras las películas, en los años 50-60 hubo un <Strong>boom de
        popularidad</Strong> que se mantuvo durante décadas. Hoy es una raza estable, con buena
        salud genética relativa (el gen MDR1 — sensibilidad a ciertos fármacos — es un punto a
        vigilar, pero hay test disponible) y temperamento equilibrado.
      </P>
      <P>
        Los criadores serios de collie usan en sus líneas a descendientes de la dinastía de Pal
        como referencia morfológica. La <Em>«look Lassie»</Em> es el estándar visual de la raza
        en exposiciones americanas.
      </P>

      <H2>El final</H2>
      <P>
        Pal murió en <Strong>junio de 1958</Strong> a los 18 años. Weatherwax dijo que jamás tuvo
        otro perro con la misma capacidad de aprendizaje. Está enterrado en el rancho Weatherwax
        de Canyon Country (California).
      </P>
      <P>
        En 2020 fue incluido a título póstumo en el <Strong>Animal Hall of Fame</Strong> americano.
        Cien años después, sigue siendo el perro de cine más reconocible del mundo. Y la mayoría
        del público sigue creyendo que era una hembra.
      </P>
    </>
  )
}
