import { H2, H3, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'horand-von-grafrath-pastor-aleman',
  title: 'Horand von Grafrath: el pastor alemán #1',
  excerpt:
    'El 22 de abril de 1899, el capitán Max von Stephanitz vio a un perro en una exposición de Karlsruhe y lo compró en el acto. Esa decisión fundó la raza más popular del mundo. Esta es la historia de Horand y su genealogía.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/horand-cropped.jpg',
  heroAlt: 'Horand von Grafrath, primer pastor alemán inscrito (SZ 1)',
  readMinutes: 7,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Karlsruhe, 22 de abril de 1899. El capitán de caballería <Strong>Max von Stephanitz</Strong>{' '}
        — un militar prusiano obsesionado con la idea de crear un perro de utilidad alemán
        unificado — recorre los pasillos de una exposición canina y se detiene ante un macho de tres
        años llamado <Em>Hektor Linksrhein</Em>. Lo compra en el acto, lo renombra{' '}
        <Strong>Horand von Grafrath</Strong>, y esa misma tarde funda el <Strong>Verein für Deutsche
        Schäferhunde (SV)</Strong>. Horand recibe el número de inscripción SZ 1. Acaba de nacer la raza
        más numerosa del mundo.
      </Lead>

      <H2>El sueño de un militar</H2>
      <P>
        A finales del XIX, en Alemania convivían decenas de tipos regionales de perro pastor: el
        Thüringer (pelo corto, gris lobo), el Württemberger (pelo largo, robusto), el Suabo, el de
        Sajonia... Cada granja tenía el suyo. Max von Stephanitz, formado en zootecnia y con
        experiencia en remontas militares, llevaba años defendiendo que Alemania necesitaba
        consolidar todos esos tipos en una raza única, estandarizada, criada{' '}
        <Strong>para la función</Strong> (pastoreo + protección + obediencia) y no para la
        apariencia.
      </P>
      <P>
        Cuando vio a Horand, supo que tenía el ejemplar fundador. Era un perro de mediano-grande
        tamaño (61 cm), color sable oscuro, estructura cuadrada, espalda recta, andar potente y
        sobre todo: <Strong>temperamento de hierro</Strong>. Stephanitz escribió de él:{' '}
        <Em>«Era todo lo que un perro de pastor alemán debía ser y, sobre todo, lo que un perro
        debía ser, en términos de carácter»</Em>.
      </P>

      <H2>El sistema Stephanitz</H2>
      <P>
        Stephanitz no se limitó a registrar a Horand. Diseñó un sistema completo:
      </P>
      <UL>
        <LI>
          Libro de orígenes <Strong>cerrado</Strong>: solo descendientes inscritos podían ser
          inscritos
        </LI>
        <LI>
          Pruebas de carácter obligatorias antes de cubrir (lo que hoy llamamos{' '}
          <Strong>BH y IPO/IGP</Strong>)
        </LI>
        <LI>
          Calificación morfológica (<Em>Körung</Em>) que decidía qué perros podían cruzarse
        </LI>
        <LI>
          Vigilancia de displasia de cadera décadas antes de que existiera la radiografía oficial
        </LI>
      </UL>
      <P>
        Cualquier criador europeo de hoy reconoce ese esquema: es el modelo que copiaron casi todas
        las razas de utilidad alemanas (boxer, doberman, schnauzer, rottweiler) y luego el resto
        del mundo.
      </P>

      <H2>La descendencia inmediata</H2>
      <P>
        Horand cubrió decenas de hembras durante 1899-1903. Sus dos hijos más influyentes fueron{' '}
        <Strong>Hektor von Schwaben</Strong> (SZ 13, ganador del primer Sieger en 1900) y{' '}
        <Strong>Beowulf</Strong>, que a su vez engendró a la generación que estableció la raza.
        Estudios genealógicos modernos calculan que <Strong>el 100% de los pastores alemanes con
        genealogía del mundo</Strong> descienden de Horand por al menos una línea, y la mayoría por
        múltiples.
      </P>

      <PedigreePreview
        dog={{ name: 'Horand von Grafrath', slug: 'horand-von-grafrath', birthYear: 1895 }}
        father={{ name: 'Kastor', slug: 'kastor-padre-horand' }}
        mother={{ name: 'Lene', slug: 'lene-madre-horand' }}
        fatherFather={{ name: 'Pollux', slug: 'pollux-abuelo-horand' }}
        fatherMother={{ name: 'Prima', slug: 'prima-abuela-horand' }}
      />

      <H2>El conflicto con el ring</H2>
      <P>
        Stephanitz luchó toda su vida contra una tendencia que él mismo no podía detener: la
        especialización entre el perro de trabajo (línea checa/DDR/working) y el perro de
        exposición (línea alemana «show», con la grupa cada vez más caída). Antes de morir en
        1936, escribió en su libro:
      </P>
      <P>
        <Em>«Cría perros de utilidad. El pastor alemán existe para ser útil. Si una vez se cría por
        belleza, la raza estará perdida»</Em>.
      </P>
      <P>
        La grieta entre líneas que advirtió es hoy una realidad: los pastores alemanes de
        competición de obediencia/protección casi no se parecen a los que ganan las exposiciones
        FCI. Horand probablemente se habría puesto del lado de la línea checa.
      </P>

      <H2>El legado</H2>
      <UL>
        <LI>
          <Strong>SV — Verein für Deutsche Schäferhunde</Strong>: el club que fundó es hoy el más
          grande del mundo (~80.000 socios)
        </LI>
        <LI>
          La raza tiene <Strong>~500.000 cachorros nuevos al año</Strong> registrados oficialmente
        </LI>
        <LI>
          Es la <Strong>raza más usada en cuerpos de policía y ejército</Strong> del mundo
          occidental
        </LI>
        <LI>
          El estándar moderno (FCI #166) sigue basándose en la descripción de Horand
        </LI>
      </UL>

      <P>
        Cuando Horand murió en 1899, Stephanitz no le hizo lápida. La consideraba innecesaria. Su
        legado, decía, era cada cachorro pastor alemán que se vendía en el mundo. Algo más de cien
        años después, esa apuesta sigue dando réditos.
      </P>
    </>
  )
}
