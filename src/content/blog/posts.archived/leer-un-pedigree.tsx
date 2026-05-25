import { H2, H3, P, Lead, UL, LI, Strong, Em, Callout, PostCta, Hr } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'leer-un-pedigree',
  title: 'Cómo leer un pedigree: guía visual para principiantes',
  excerpt:
    'Generaciones, símbolos, registros LOE/RSCE/FCI y los detalles que distinguen un papel serio de un papel de relleno. En 5 minutos sabrás interpretar cualquier árbol.',
  date: '2026-05-20',
  category: 'Para compradores',
  heroImage:
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Documento con anotaciones y bolígrafo sobre una mesa',
  readMinutes: 6,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Un pedigree es el árbol genealógico oficial de un perro de raza. Si te has cruzado con uno y
        no sabías por dónde mirar, esta guía te enseña a leerlo como un criador con 30 años de
        experiencia.
      </Lead>

      <H2>Qué es exactamente un pedigree</H2>
      <P>
        Un pedigree (o «papel» en jerga de criadores) es un documento emitido por una entidad
        cinológica reconocida que certifica la ascendencia de un perro durante al menos{' '}
        <Strong>3 generaciones</Strong>, normalmente 4 o 5. En España la entidad de referencia es la{' '}
        <Strong>RSCE</Strong> (Real Sociedad Canina de España), filial española de la{' '}
        <Strong>FCI</Strong> (Fédération Cynologique Internationale). En EEUU y Reino Unido la
        emiten <Strong>AKC</Strong> y <Strong>The Kennel Club</Strong> respectivamente.
      </P>
      <P>
        Sin pedigree, un perro <Em>puede</Em> ser de raza pura genéticamente, pero no está
        <Strong> certificado</Strong>. Y sin certificación no participa en exposiciones, no transmite
        derechos de cría reconocidos, ni vale lo que vale un perro con papeles.
      </P>

      <H2>Estructura de un pedigree de 5 generaciones</H2>
      <P>
        El formato estándar FCI es un árbol horizontal que se lee de izquierda a derecha. El perro
        protagonista está a la izquierda; sus padres en la siguiente columna; sus 4 abuelos en la
        tercera; los 8 bisabuelos en la cuarta; los 16 tatarabuelos en la quinta.
      </P>
      <P>
        Convención universal: <Strong>el padre arriba, la madre abajo</Strong>. Si te dan un papel
        donde la madre está arriba, sospecha — o el emisor no es serio, o es un formato no
        estándar.
      </P>

      <H2>Qué información lleva cada perro</H2>
      <P>De cada antepasado, un pedigree serio incluye al menos:</P>
      <UL>
        <LI>
          <Strong>Nombre completo</Strong> con afijo (el «apellido» del criadero, por ejemplo «de El
          Nie», «of Aldenham», «du Lac»).
        </LI>
        <LI>
          <Strong>Número de registro</Strong>: LOE (Libro de Orígenes Español) en España, formato
          «LOE 2189437». En otros países LO, KCS, AKC, etc.
        </LI>
        <LI>
          <Strong>Fecha de nacimiento</Strong>: imprescindible para calcular consanguinidad cruzada
          y trazar líneas.
        </LI>
        <LI>
          <Strong>Color y manto</Strong>: codificado según el estándar de raza.
        </LI>
        <LI>
          <Strong>Títulos</Strong>: campeón nacional (Ch.), campeón internacional (Ch.Int.), prueba
          de trabajo (T.R.), etc. Suelen ir como prefijo del nombre.
        </LI>
        <LI>
          <Strong>Pruebas sanitarias</Strong> oficiales: HD-A (cadera sin displasia), ED-0 (codos
          sanos), DCM, MDR1, según raza.
        </LI>
      </UL>

      <H2>Las 5 banderas rojas</H2>
      <P>
        No todos los pedigrees son iguales. Estos son los detalles que distinguen un papel sólido de
        uno de relleno:
      </P>

      <H3>1. Nombres repetidos en pocas generaciones</H3>
      <P>
        Si el mismo perro aparece en la 3ª y 4ª generación por dos ramas distintas (paterna y
        materna), hay consanguinidad. No es necesariamente malo (la cría en línea es una técnica
        legítima), pero si se repite 3 o más veces el coeficiente sube rápido y puede empezar a
        comprometer la salud. Más sobre esto en{' '}
        <Strong>nuestro artículo sobre coeficiente de consanguinidad</Strong>.
      </P>

      <H3>2. Falta de números de registro en ramas profundas</H3>
      <P>
        Si los bisabuelos solo tienen nombre y no LOE, el árbol no es verificable más allá de las 3
        primeras generaciones. Papel a medias.
      </P>

      <H3>3. Sin sello ni firma oficial</H3>
      <P>
        Un pedigree FCI/RSCE auténtico lleva el sello en relieve de la entidad emisora y firma del
        secretario. Las fotocopias sin sello son <Em>copia de cortesía</Em>, no documento oficial.
      </P>

      <H3>4. Pruebas sanitarias ausentes en razas con problemas conocidos</H3>
      <P>
        Si compras un Pastor Alemán, Bulldog Francés o Cane Corso y los padres no tienen lectura HD
        oficial, malo. En razas con dilatación cardíaca (Cavalier, Dóberman), exige test DCM.
      </P>

      <H3>5. Afijo dudoso o inexistente</H3>
      <P>
        Un afijo registrado en FCI/RSCE es público y comprobable. Si el criadero te dice que «cría
        desde 1990» pero no tiene afijo, o el afijo no aparece en el registro oficial, está
        operando informalmente.
      </P>

      <Callout kind="tip" title="Atajo">
        En Genealogic puedes buscar un afijo y ver inmediatamente todas las camadas registradas
        bajo él, los perros vendidos, sus pruebas sanitarias y los datos de contacto del criador.
        Es la forma más rápida de verificar una historia.
      </Callout>

      <H2>Cómo verificar un pedigree paso a paso</H2>
      <P>Si te pasan un pedigree antes de comprar un cachorro, haz esto:</P>
      <UL>
        <LI>
          <Strong>Pide la foto del original con sello</Strong>, no solo la digitalización del árbol.
        </LI>
        <LI>
          <Strong>Comprueba el número LOE del padre y la madre</Strong> en el registro público.
        </LI>
        <LI>
          <Strong>Busca el afijo del criadero</Strong> en RSCE o en Genealogic.
        </LI>
        <LI>
          <Strong>Pide los resultados sanitarios</Strong> de los padres con el certificado del
          veterinario oficial.
        </LI>
        <LI>
          <Strong>Calcula el COI</Strong> (coeficiente de consanguinidad). Si supera el 12,5 % en 5
          generaciones, pregunta por qué.
        </LI>
      </UL>

      <Hr />

      <P>
        Leer un pedigree no es magia: es saber dónde mirar. Con esta guía y un poco de práctica vas
        a distinguir en menos de un minuto un criador serio de uno que improvisa.
      </P>

      <PostCta variant="import" />
    </>
  )
}
