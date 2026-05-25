import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'rin-tin-tin-pastor-aleman-hollywood',
  title: 'Rin Tin Tin (1918): el cachorro de trinchera que salvó a la Warner Bros',
  excerpt:
    'Lo encontraron entre los escombros de una perrera bombardeada de la Primera Guerra Mundial. Diez años después protagonizaba 27 películas y su sueldo era el más alto de Hollywood. La historia real de Rin Tin Tin.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/rin-tin-tin-1929.jpg',
  heroAlt: 'Rin Tin Tin, pastor alemán actor de Hollywood, retrato publicitario',
  readMinutes: 6,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        15 de septiembre de 1918. El cabo norteamericano <Strong>Lee Duncan</Strong> entra en una
        perrera militar alemana bombardeada en Flirey (Lorena, Francia). Entre los escombros
        encuentra a una pastora alemana muerta y a cinco cachorros recién nacidos. Se lleva dos
        consigo. El macho lo bautiza <Strong>Rin Tin Tin</Strong>, el nombre de los muñecos
        amuleto que llevaban los soldados franceses. Diez años más tarde, ese cachorro será la
        estrella mejor pagada de Hollywood.
      </Lead>

      <H2>De Lorena a California</H2>
      <P>
        Duncan se llevó a Rin Tin Tin (y a su hermana Nanette) de vuelta a Los Ángeles tras la
        guerra. Nanette murió a las pocas semanas por neumonía. Rin Tin Tin sobrevivió y empezó a
        entrenarse en obediencia básica. Duncan era un entusiasta sin formación cinematográfica,
        pero se dio cuenta de que el perro tenía algo: <Strong>seguía órdenes complejas a
        distancia</Strong> sin gestos visibles, y soportaba el caos de un rodaje (focos, gritos,
        cables) con calma absoluta.
      </P>
      <P>
        En 1922 le consigue un papel pequeño en <Em>The Man from Hell's River</Em>. Llamativo, pero
        sin más. Su gran oportunidad llega en <Strong>1923</Strong> con{' '}
        <Em>Where the North Begins</Em>, dirigida por Chester Franklin para los entonces
        agonizantes <Strong>Warner Brothers Studios</Strong>.
      </P>

      <H2>La estrella que rescató a Warner</H2>
      <P>
        La película fue un éxito tan grande que Warner — al borde de la quiebra — pudo amortizar
        deuda y rodar más. Entre 1923 y 1929, Rin Tin Tin protagonizó <Strong>27 películas
        mudas</Strong>, todas para Warner Brothers, todas taquillazos. Su sueldo llegó a ser de{' '}
        <Strong>$1.000 por semana</Strong> (más que el de la mayoría de actores humanos de la
        época) y tenía limusina propia, chef personal, y un contrato con cláusula de
        responsabilidad civil.
      </P>
      <P>
        El humorista Jack Warner lo dijo así años después:{' '}
        <Em>«Rin Tin Tin no salvó a la Warner. Rin Tin Tin construyó la Warner»</Em>.
      </P>

      <H2>Cómo se rodaba</H2>
      <P>
        Lee Duncan dirigía a Rin Tin Tin directamente, fuera de cámara, con un sistema de silbidos
        y gestos imperceptibles para el espectador. El perro hacía escenas de:
      </P>
      <UL>
        <LI>
          <Strong>Saltar por ventanas</Strong> de primer piso aterrizando en marca exacta
        </LI>
        <LI>
          <Strong>Forcejear con actores</Strong> humanos sin morder de verdad
        </LI>
        <LI>
          <Strong>Subir escaleras</Strong> y abrir puertas con la pata
        </LI>
        <LI>
          <Strong>«Llorar»</Strong> simulando tristeza (Duncan le enseñó a frotarse el ojo con la
          pata a la orden)
        </LI>
      </UL>
      <P>
        En los <Strong>primeros Premios Óscar</Strong> de 1929, recibió el máximo número de votos
        a Mejor Actor. La Academia tuvo que cambiar las normas al día siguiente para excluir
        animales y dárselo a Emil Jannings.
      </P>

      <PedigreePreview
        dog={{ name: 'Rin Tin Tin', slug: 'rin-tin-tin', birthYear: 1918 }}
      />

      <H2>El cine sonoro y el ocaso</H2>
      <P>
        La llegada del cine sonoro en 1927 fue un golpe duro para todas las estrellas mudas — pero
        especialmente para un actor canino que no podía «hablar». Rin Tin Tin hizo tres películas
        sonoras a regañadientes y se retiró parcialmente. Murió el <Strong>10 de agosto de
        1932</Strong> en Los Ángeles, a los 14 años. Hubo cobertura en directo por radio nacional.
        Algunas emisoras interrumpieron música para anunciarlo.
      </P>

      <H2>La saga</H2>
      <P>
        Lee Duncan crió a partir de Rin Tin Tin durante el resto de su vida. La línea «Rin Tin
        Tin» tuvo continuidad:
      </P>
      <UL>
        <LI>
          <Strong>Rin Tin Tin Jr.</Strong> (hijo) — protagonizó varias películas en los 30
        </LI>
        <LI>
          <Strong>Rin Tin Tin III</Strong> (nieto) — actuó durante la Segunda Guerra Mundial
        </LI>
        <LI>
          <Strong>Rin Tin Tin IV</Strong> (bisnieto) — protagonizó la serie de TV de 1954-1959
        </LI>
        <LI>
          La línea de cría sigue activa hoy en una perrera de Texas, como{' '}
          <Em>«Rin Tin Tin Bloodline»</Em>
        </LI>
      </UL>

      <H2>Lo que enseñó al cine</H2>
      <P>
        Rin Tin Tin estableció el género del «perro protagonista» que después daría Lassie,
        Beethoven, Marley o Hachi. Pero también algo más importante: demostró que un{' '}
        <Strong>animal entrenado podía sostener un guion de 90 minutos</Strong> sin que el público
        se aburriera. Antes de él, los perros en cine eran atrezo. Después de él, podían ser
        cabezas de cartel.
      </P>
      <P>
        Hoy tiene estrella en el Paseo de la Fama de Hollywood. Está enterrado en el{' '}
        <Em>Cimetière des Chiens</Em> de Asnières-sur-Seine, cerca de París — su deseo final, ser
        repatriado a la tierra donde nació.
      </P>
    </>
  )
}
