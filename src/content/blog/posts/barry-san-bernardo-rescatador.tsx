import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'barry-san-bernardo-rescatador',
  title: 'Barry der Menschenretter (1800): el san bernardo que salvó 40 vidas',
  excerpt:
    'Entre 1800 y 1812, un san bernardo rescató a 40 personas perdidas en los pasos alpinos del hospicio del Gran San Bernardo. Su cuerpo embalsamado aún se exhibe en Berna. Esta es su historia.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/barry-saint-bernard.jpg',
  heroAlt: 'Barry der Menschenretter, san bernardo rescatador, taxidermia del Museo de Berna',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Cuando piensas en un san bernardo con un barrilito de brandy colgado del cuello en la
        nieve, estás imaginando a <Strong>Barry</Strong>. El barrilito es ficción victoriana — los
        monjes del hospicio nunca colgaron alcohol a los perros, porque empeora la hipotermia —
        pero el resto es real: Barry rescató a unas 40 personas perdidas entre 1800 y 1812 en uno
        de los pasos más letales de los Alpes.
      </Lead>

      <H2>El hospicio del Gran San Bernardo</H2>
      <P>
        Fundado en el siglo XI por el monje agustino <Em>Bernardo de Menthon</Em>, el hospicio se
        sitúa en el paso del Gran San Bernardo (2.469 m), entre la actual Suiza y el valle de
        Aosta. Durante mil años fue el único refugio para peregrinos, mercaderes y soldados que
        cruzaban a pie los Alpes en dirección a Roma. La meteorología en invierno mata: tormentas
        de nieve, aludes, niebla cero. Cada año morían varios viajeros.
      </P>
      <P>
        Los monjes empezaron a usar perros grandes de molosoide alpino (los <Em>Talhund</Em> o{' '}
        <Em>Bauernhund</Em>) para guarda y carga desde el siglo XVII. Hacia 1700, esos perros se
        revelaron además como{' '}
        <Strong>excepcionales para localizar personas enterradas en la nieve</Strong> y descongelar
        cuerpos con su calor corporal.
      </P>

      <H2>Las 40 vidas de Barry</H2>
      <P>
        Barry nació en el hospicio en 1800. Era un macho de unos 80 kg, color marrón-blanco
        clásico. Trabajaba en pareja con otro perro y un monje guía. Los registros del hospicio (un
        diario llevado durante siglos por los monjes) le atribuyen el rescate documentado de{' '}
        <Strong>40 personas</Strong> durante sus 12 años de servicio activo (1800-1812).
      </P>
      <P>
        El rescate más famoso, posiblemente apócrifo: encontró a un niño semicongelado entre la
        nieve, lo lamió hasta despertarlo, y el niño se subió a su lomo. Barry lo llevó así hasta
        el hospicio, salvándole la vida. La historia se publicó en periódicos de toda Europa y
        consolidó la imagen del «perro rescatador».
      </P>

      <PedigreePreview
        dog={{ name: 'Barry der Menschenretter', slug: 'barry-menschenretter', birthYear: 1800 }}
      />

      <H2>La muerte y el museo</H2>
      <P>
        Barry murió en Berna en 1814, retirado del hospicio dos años antes por agotamiento. Los
        monjes encargaron su <Strong>taxidermia al naturalista Friedrich Meisner</Strong>, que la
        montó con menos rigor del deseable (la cabeza la rehízo de memoria años después, así que
        no representa exactamente al perro original).
      </P>
      <P>
        Esa pieza se exhibe hoy en el <Strong>Museo de Historia Natural de Berna</Strong>, donde
        ha sido la principal atracción durante 200 años. La sala lleva su nombre.
      </P>

      <H2>El tipo morfológico</H2>
      <P>
        Aquí viene una sorpresa: <Strong>Barry no era el san bernardo gigante que conocemos hoy</Strong>.
        Pesaba unos 40-50 kg menos. La raza moderna se hizo más grande, más pesada y con cabeza
        más cúbica a partir de 1830, cuando se introdujeron cruces con Mastín Inglés y Terranova
        para «reforzar» el tipo. Esos cruces deformaron las proporciones originales y trajeron los
        problemas articulares y la corta esperanza de vida que padece la raza hoy (~8 años).
      </P>
      <P>
        El san bernardo de Barry era un perro de trabajo funcional. El de exposición de hoy
        difícilmente sobreviviría un día patrullando el paso a 2.500 m.
      </P>

      <H2>El final del programa de cría del hospicio</H2>
      <UL>
        <LI>
          El hospicio crió san bernardos sin interrupción <Strong>desde 1670 hasta 2004</Strong>
        </LI>
        <LI>
          En 2004 la cría se transfirió a la <Strong>Fondation Barry</Strong> en Martigny, donde
          sigue activa
        </LI>
        <LI>
          Hoy los perros del programa ya no rescatan (el helicóptero los desplazó), pero participan
          en exhibiciones educativas y trabajo terapéutico
        </LI>
      </UL>

      <P>
        Cuando vayas a Berna, búscalo. Sigue ahí, en su vitrina, con la pose ligeramente extraña
        que le dio Meisner. La cabeza no es exacta. El perro sí.
      </P>
    </>
  )
}
