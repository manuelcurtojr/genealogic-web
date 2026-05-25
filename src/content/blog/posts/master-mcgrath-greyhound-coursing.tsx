import { H2, P, Lead, Strong, Em, UL, LI } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'master-mcgrath-greyhound-coursing',
  title: 'Master McGrath (1866): el greyhound irlandés que conoció a la reina Victoria',
  excerpt:
    'Un perro escuálido y sin pedigree de origen humilde llegó a ganar tres Waterloo Cups, el campeonato de coursing más prestigioso del siglo XIX. La reina Victoria lo recibió en Windsor. Su nombre sigue apareciendo en los pubs y canciones populares de Irlanda.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/master-mcgrath.jpg',
  heroAlt: 'Master McGrath, greyhound irlandés tricampeón Waterloo Cup',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Antes de las carreras con liebre mecánica en pista oval, el deporte de los greyhounds era
        el <Strong>coursing</Strong>: dos perros sueltos en campo abierto persiguiendo a una
        liebre real, juzgados por la calidad de la persecución. El campeonato del mundo era el{' '}
        <Strong>Waterloo Cup</Strong>, disputado en Lancashire. Master McGrath lo ganó tres veces.
        Nadie más lo ha hecho.
      </Lead>

      <H2>El cachorro casi sacrificado</H2>
      <P>
        Master McGrath nació en 1866 en una granja del condado de Waterford (Irlanda), propiedad
        del aristócrata <Strong>Lord Lurgan</Strong>. Era un cachorro pequeño, esquelético, y a las
        pocas semanas el cuidador <Strong>James Galwey</Strong> recomendó sacrificarlo por
        considerarlo no viable. Lurgan se opuso a última hora.
      </P>
      <P>
        El perro fue confiado a un chico de 12 años llamado <Strong>Patrick McGrath</Strong>{' '}
        («Master» — joven amo — McGrath en el habla de la época), que lo crió con leche caliente
        y cuidado obsesivo. El cachorro sobrevivió, creció con cuerpo modesto (24 kg, muy ligero
        para un greyhound de coursing) pero con una velocidad terminal y una agilidad para girar
        que sus rivales no podían igualar.
      </P>

      <H2>El Waterloo Cup</H2>
      <P>
        El Waterloo Cup se disputaba cada año desde 1836 en Altcar, cerca de Liverpool. Era el
        equivalente al Derby de Epsom para los greyhounds: la copa más antigua, más prestigiosa,
        con el mayor pozo de premios. 64 perros entraban al torneo en sistema de copas (knockout)
        sobre 6 rondas.
      </P>
      <P>
        Master McGrath debutó allí en 1868 con apenas dos años. Llegó a la final y perdió por
        muy poco. Al año siguiente — <Strong>1869</Strong> — la ganó. Y la volvió a ganar en{' '}
        <Strong>1870</Strong> y <Strong>1871</Strong>. Tres títulos consecutivos: hazaña no
        igualada en los 150 años de historia del torneo.
      </P>

      <H2>La visita a Windsor</H2>
      <P>
        La fama de Master McGrath atravesó el Mar de Irlanda. La <Strong>reina Victoria</Strong>,
        gran aficionada a perros (tuvo más de 70 distintos a lo largo de su vida), pidió
        conocerlo personalmente. El 5 de febrero de 1871, Lord Lurgan llevó al perro a{' '}
        <Strong>Windsor Castle</Strong>. La reina lo recibió en sus aposentos privados y le ofreció
        bizcocho de su propia mano. Boletines oficiales documentaron la visita.
      </P>
      <P>
        Era la primera vez en la historia británica que un perro de deporte recibía audiencia real
        formal.
      </P>

      <PedigreePreview
        dog={{ name: 'Master McGrath', slug: 'master-mcgrath', birthYear: 1866 }}
      />

      <H2>El palmarés y los números</H2>
      <UL>
        <LI>
          <Strong>3 Waterloo Cups</Strong> (1869, 1870, 1871) — único en la historia
        </LI>
        <LI>
          <Strong>37 victorias en 38 carreras</Strong> documentadas. La única derrota: la final
          del Waterloo de 1870 (sí, ese mismo año), donde cayó al hielo de un arroyo durante una
          carrera previa y se retiró. Por norma cuenta como derrota
        </LI>
        <LI>
          Estimación de premios totales: <Strong>£10.000</Strong> (equivalente a £1,2M actuales)
        </LI>
      </UL>

      <H2>La canción</H2>
      <P>
        En el folclore irlandés, Master McGrath ocupa un lugar muy alto. Hay una <Strong>balada
        popular</Strong> de 1869 — todavía cantada en pubs de Waterford y Wexford — que narra su
        primera victoria en Waterloo con tono épico:
      </P>
      <blockquote className="my-6 border-l-2 border-hairline pl-6 italic text-body">
        <P>
          <Em>
            «Eighteen sixty-nine, being the date of the year,
            <br />
            These Waterloo sportsmen and gentry appear;
            <br />
            For to gain the great prizes which they had in view,
            <br />
            They were counting their chances to beat Master McGrath…»
          </Em>
        </P>
      </blockquote>
      <P>
        El pub <strong>Master McGrath</strong> en Lurgan (Northern Ireland) sigue abierto y tiene
        un mural del perro en la fachada.
      </P>

      <H2>El final</H2>
      <P>
        Master McGrath murió el <Strong>22 de diciembre de 1871</Strong> a los apenas 5 años y
        medio, pocos meses después de su tercera victoria en Waterloo. La causa oficial fue
        neumonía; el periódico Belfast News-Letter sugirió que la pulmonía empezó en la propia
        final, corrida en condiciones de frío extremo.
      </P>
      <P>
        Le enterraron en la finca de Lord Lurgan con una <Strong>lápida monumental</Strong> que
        sigue en pie. La forma del Waterloo Cup actual lleva su silueta grabada.
      </P>

      <H2>El fin del coursing</H2>
      <P>
        El coursing con liebre viva fue progresivamente vetado en Reino Unido por motivos de
        bienestar animal. Inglaterra y Gales lo prohibieron en 2005. Escocia en 2002. Irlanda lo
        permite aún en formato regulado con liebre liberada (sin garras de captura). El Waterloo
        Cup original se disputó por última vez en 2005.
      </P>
      <P>
        Master McGrath pertenece a una era cerrada del deporte canino. Pero su nombre, en cualquier
        pub irlandés rural, sigue significando algo. Y eso, para un perro, es bastante.
      </P>
    </>
  )
}
