import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'hachiko-akita-inu-perro-fiel',
  title: 'Hachikō (1923): el akita que esperó 9 años en la estación de Shibuya',
  excerpt:
    'El profesor Hidesaburō Ueno murió de hemorragia cerebral el 21 de mayo de 1925. Su perro Hachikō siguió yendo cada tarde a la estación de Shibuya a esperarle. Lo hizo durante 9 años, 9 meses y 15 días.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/hachiko.jpg',
  heroAlt: 'Hachikō, akita inu símbolo de fidelidad, fotografía original',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Hay perros famosos por hacer algo extraordinario una vez. Hachikō es famoso por hacer algo
        ordinario — ir a la estación a recibir a su dueño — todos los días durante{' '}
        <Strong>nueve años, nueve meses y quince días</Strong>. Después de que su dueño ya estuviera
        muerto.
      </Lead>

      <H2>Un cachorro de Akita</H2>
      <P>
        Hachikō nació el <Strong>10 de noviembre de 1923</Strong> en una granja de la prefectura
        de Akita (norte de Honshu, Japón), en la región donde se cría desde el siglo XVII el akita
        inu — un perro de tipo spitz, color trigo, originalmente usado para cazar oso y jabalí.
        Sus padres fueron <Strong>Ōshinai-yama-gō</Strong> y <Strong>Goma-gō</Strong>.
      </P>
      <P>
        En enero de 1924, con dos meses, fue enviado a Tokio en tren para entregárselo a su nuevo
        dueño: <Strong>Hidesaburō Ueno</Strong>, profesor de ingeniería agrícola en la Universidad
        Imperial de Tokio. Ueno era un apasionado de los akita y llevaba años intentando
        conseguir uno de pureza genealógica. El cachorro recibió el nombre Hachi («ocho» en
        japonés, número de la suerte en su cultura) con el sufijo honorífico「kō」.
      </P>

      <H2>La rutina diaria</H2>
      <P>
        Cada mañana Hachikō acompañaba a Ueno hasta la estación de tren de{' '}
        <Strong>Shibuya</Strong>, le veía partir hacia el campus, y volvía a casa. Cada tarde,
        sobre las 4, volvía solo a la estación a esperar el tren de regreso. Lo hacía sin que
        nadie se lo pidiera. Los empleados de la estación y los vendedores del entorno le
        conocían y le daban restos de comida.
      </P>

      <H2>21 de mayo de 1925</H2>
      <P>
        Esa tarde, durante una clase, Ueno sufrió una <Strong>hemorragia cerebral masiva</Strong> y
        murió a los 53 años. Hachikō, que ese día estaba en Shibuya como siempre, esperó hasta
        bien entrada la noche. Volvió a la mañana siguiente. Y a la siguiente. Y a la siguiente.
      </P>
      <P>
        La familia de Ueno lo recogió y se lo llevó a vivir con familiares fuera de Tokio. Hachikō
        escapaba una y otra vez para volver a la antigua casa, y de ahí a la estación. Tras varios
        intentos lo dejaron quedarse con un antiguo jardinero de Ueno cerca de Shibuya. A partir
        de entonces, cada tarde durante <Strong>9 años, 9 meses y 15 días</Strong>, Hachikō
        recorrió el mismo trayecto hasta la estación, se sentó en el mismo punto, y esperó al
        tren de las 4.
      </P>

      <PedigreePreview
        dog={{ name: 'Hachikō', slug: 'hachiko', birthYear: 1923 }}
        father={{ name: 'Ōshinai-yama-gō', slug: 'oshinai-yama-go' }}
        mother={{ name: 'Goma-gō', slug: 'goma-go' }}
      />

      <H2>La fama nacional</H2>
      <P>
        En 1932, el periodista <Strong>Hirokichi Saitō</Strong> — que había estudiado akitas
        durante años — publicó un reportaje en el periódico Asahi Shimbun titulado{' '}
        <Em>«La conmovedora historia del viejo perro: aún espera a su amo durante siete años»</Em>.
        El artículo convirtió a Hachikō en un símbolo nacional. Los maestros lo usaban en clase
        como ejemplo de <Strong>lealtad y fidelidad</Strong> (虫義, <Em>chūgi</Em>, una virtud
        confuciana japonesa).
      </P>
      <P>
        En abril de 1934, mientras Hachikō aún vivía, se inauguró una estatua suya en bronce en la
        misma estación, en presencia del propio perro. El escultor fue Teru Andō.
      </P>

      <H2>La muerte</H2>
      <P>
        Hachikō murió el <Strong>8 de marzo de 1935</Strong> a los 11 años. Se encontró su cuerpo
        en una calle cerca de la estación. La autopsia reveló: filaria y cáncer terminal. Pero
        también, en el estómago,{' '}
        <Strong>cuatro pinchos de yakitori</Strong> (su comida favorita) que aún no había
        digerido.
      </P>
      <P>
        Su cuerpo fue embalsamado y se exhibe hoy en el{' '}
        <Strong>Museo Nacional de Naturaleza y Ciencia de Tokio</Strong>. Sus restos óseos fueron
        enterrados junto a los de Ueno en el cementerio de Aoyama.
      </P>

      <H2>La estatua y el símbolo</H2>
      <UL>
        <LI>
          La estatua original de 1934 fue <Strong>fundida durante la Segunda Guerra Mundial</Strong>{' '}
          para hacer munición
        </LI>
        <LI>
          La actual, en la estación de Shibuya, es de 1948 — réplica del escultor Takeshi Andō
          (hijo del original)
        </LI>
        <LI>
          La salida de la estación que da a la plaza se llama <Strong>«Hachikō Exit»</Strong>{' '}
          desde 1948. Sigue siendo el punto de encuentro más popular de Tokio
        </LI>
        <LI>
          Cada año, el 8 de marzo (aniversario de su muerte) se celebra una ceremonia en la estatua
        </LI>
      </UL>

      <H2>El akita inu después de Hachikō</H2>
      <P>
        La popularidad de Hachikō a finales de los años 30 disparó la demanda de akita inu en
        Japón. Esa demanda, paradójicamente, casi destruyó la raza: durante la Segunda Guerra
        Mundial el gobierno japonés ordenó el sacrificio masivo de perros grandes (excepto
        pastores alemanes, considerados militares). Solo unos pocos criadores escondieron sus
        akitas en zonas rurales.
      </P>
      <P>
        Tras la guerra quedaban menos de 100 akita inu puros. Los que sobrevivieron son los
        antecesores del akita inu moderno (la línea «Akita Japonés» del FCI). Los soldados
        americanos se llevaron también ejemplares mestizos con pastor alemán que dieron origen al{' '}
        <Strong>American Akita</Strong> (raza diferenciada por la FCI en 1999).
      </P>

      <P>
        Si vas alguna vez a Shibuya, la estatua sigue ahí. Y delante de ella, casi siempre, hay
        gente esperando.
      </P>
    </>
  )
}
