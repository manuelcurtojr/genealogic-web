import { H2, P, Lead, Strong, Em, UL, LI } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'muhlbauers-flocki-fundador-boxer',
  title: 'Mühlbauer\'s Flocki (1895): el primer Bóxer del libro genealógico',
  excerpt:
    'En Múnich, año 1895, nació un cachorro fruto de cruzar un Bullenbeisser bávaro con una Bulldog inglesa importada. Recibió el número 1 del recién creado Boxer-Klub. Sin él, el bóxer moderno no existiría.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/flocki-boxer-1895.jpg',
  heroAlt: 'Mühlbauer\'s Flocki, primer bóxer inscrito en libro de orígenes',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        El bóxer moderno no es alemán por casualidad. Es alemán porque tres veterinarios de
        Múnich — Friedrich Roberth, Elard König y Rudolf Höpner — se obsesionaron en 1895 con
        salvar al moribundo <Em>Bullenbeisser bávaro</Em> y crear con él una raza unificada de
        agarre y trabajo. El primer perro de ese programa fue{' '}
        <Strong>Mühlbauer's Flocki</Strong>.
      </Lead>

      <H2>El Bullenbeisser, ancestro al borde de la extinción</H2>
      <P>
        El <Strong>Bullenbeisser</Strong> («mordedor de toros» en alemán) era un molosoide medio
        usado durante siglos para sujetar caza mayor (jabalí, ciervo, toro). Hubo dos variantes:
        el grande de Danzig (extinto a mediados del XIX) y el pequeño de Brabant. Eran perros
        atléticos, ágiles, de mordida frontal por el sistema de prognatismo, similares al actual
        bóxer en silueta pero más pequeños y rústicos.
      </P>
      <P>
        Hacia 1880 el Bullenbeisser estaba al borde de la extinción: la caza mayor con perros se
        prohibió, los cazadores perdieron interés, y los pocos ejemplares quedaban en granjas
        rurales bávaras sin programa de cría organizado.
      </P>

      <H2>El cruce fundador</H2>
      <P>
        En 1894, el carnicero <Strong>Georg Alt</Strong> de Múnich poseía a una de las últimas
        hembras Bullenbeisser auténticas: <Strong>Alt's Schecken</Strong>, hija a su vez de{' '}
        <Em>Lechner's Box</Em> (Bullenbeisser puro) y <Em>Flora</Em> (importada francesa, también
        Bullenbeisser). Alt la cruzó con <Strong>Dr. Toneissen's Tom</Strong>, un Bulldog inglés
        macho importado del Reino Unido — más pequeño que un bóxer actual, con el morro menos
        chato que el bulldog moderno.
      </P>
      <P>
        De esa camada de febrero de 1895 nació Flocki. El cachorro fue comprado por{' '}
        <Strong>Friedrich Mühlbauer</Strong>, aficionado cinófilo muniqués, que le dio su apellido.
      </P>

      <H2>El primer libro de orígenes</H2>
      <P>
        En enero de <Strong>1895</Strong> los tres veterinarios mencionados antes habían fundado en
        Múnich el <Strong>Deutscher Boxer-Klub</Strong>. Su objetivo era crear un libro genealógico
        cerrado para el nuevo tipo derivado del Bullenbeisser, abriendo cruces controlados con
        Bulldog inglés para añadir tamaño y vigor.
      </P>
      <P>
        Flocki recibió el número de inscripción <Strong>1</Strong> en el libro de orígenes del
        club. Pesaba 28 kg, tenía manto atigrado-fuego con marcas blancas, y un temperamento
        descrito en los registros como <Em>«temperado pero firme»</Em>.
      </P>

      <H2>El primer Sieger</H2>
      <P>
        El club organizó su <Strong>primera exposición monográfica en 1896</Strong> en Múnich.
        Flocki ganó la categoría macho y se proclamó <Strong>Sieger fundador del Boxer-Klub</Strong>.
        A partir de ahí fue solicitado como semental: cubrió decenas de hembras en los siguientes
        cuatro años.
      </P>
      <P>
        Su hija más influyente, <Strong>Mühlbauer's Blanka</Strong>, sería madre de la línea
        Norbert von Riedinger — la base genética del bóxer moderno tipo «show».
      </P>

      <PedigreePreview
        dog={{ name: "Mühlbauer's Flocki", slug: 'muhlbauers-flocki', birthYear: 1895 }}
        father={{ name: "Dr. Toneissen's Tom", slug: 'dr-toneissen-tom-bulldog' }}
        mother={{ name: "Alt's Schecken", slug: 'alts-schecken' }}
        motherFather={{ name: "Lechner's Box", slug: 'lechners-box' }}
        motherMother={{ name: 'Flora', slug: 'flora-import-francia-boxer' }}
      />

      <H2>El bóxer como raza de utilidad</H2>
      <P>
        El Boxer-Klub siguió un programa muy similar al que paralelamente desarrollaba Stephanitz
        con el pastor alemán (<Em>ver nuestro artículo sobre Horand von Grafrath</Em>): libro
        cerrado tras unas cuantas camadas iniciales, pruebas de carácter obligatorias antes de
        cubrir, y selección rigurosa para utilidad (policía, ejército, guarda).
      </P>
      <P>
        Para 1910 ya había bóxers en cuerpos de policía alemanes. En las dos guerras mundiales
        se usaron como <Strong>mensajeros, sanitarios de trinchera y guardas de prisioneros</Strong>.
        El primer bóxer en cruzar el Atlántico, <Em>Dampf vom Dom</Em>, llegó a Nueva York en 1903.
        En EEUU la raza explotó en popularidad tras la Segunda Guerra Mundial cuando los soldados
        americanos regresaron con ejemplares europeos.
      </P>

      <H2>Los problemas modernos del bóxer</H2>
      <P>
        El bóxer del siglo XXI tiene una base genética estrecha — todo se concentra en
        descendientes de unos 20 perros del entorno de Flocki + Blanka. Eso ha generado prevalencia
        elevada de:
      </P>
      <UL>
        <LI>
          <Strong>Cardiomiopatía dilatada (DCM)</Strong> — pérdida progresiva de contractilidad
          ventricular
        </LI>
        <LI>
          <Strong>ARVC (cardiomiopatía arritmogénica)</Strong> — arritmias súbitas, frecuente en
          la raza
        </LI>
        <LI>
          <Strong>Mastocitoma cutáneo</Strong> — tumor de los más comunes en bóxer
        </LI>
        <LI>
          <Strong>Espondilosis y displasia coxofemoral</Strong> moderadas
        </LI>
      </UL>
      <P>
        Cualquier criador serio de bóxer hace ecocardio + Holter de 24h + screening genético DCM y
        ARVC antes de criar. Sin esas pruebas, un bóxer es una lotería.
      </P>

      <H2>El final</H2>
      <P>
        Flocki murió hacia 1903, a los 8 años. No hay tumba conservada — los carniceros y
        veterinarios de la Múnich de la época no marcaban tumbas de perros. Pero su número de
        inscripción <Strong>«BK 1»</Strong> sigue siendo el primer renglón del libro genealógico
        del Deutscher Boxer-Klub, vigente sin interrupción durante 130 años.
      </P>
      <P>
        Todos los bóxers con genealogía del mundo, incluyendo a Rex (el bóxer de las películas de
        Disney) y al famoso Tyson (el de Sylvester Stallone en <Em>Rocky</Em>), llevan su sangre.
      </P>
    </>
  )
}
