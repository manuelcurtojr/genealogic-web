import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Table, THead, TBody, TR, TH, TD, Em } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'coeficiente-consanguinidad-coi',
  title: 'Coeficiente de consanguinidad (COI): qué es, cómo se calcula y por qué importa',
  excerpt:
    'Una métrica que separa cría seria de cría improvisada. Explicación de la fórmula de Wright, los niveles seguros por raza y cómo Genealogic lo calcula automáticamente sobre 10 generaciones.',
  date: '2026-05-18',
  category: 'Genética',
  heroImage:
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Doble hélice de ADN sobre fondo azul oscuro',
  readMinutes: 9,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Si crías perros con linaje, el coeficiente de consanguinidad (COI, por sus siglas en
        inglés) es la métrica que más impacto tiene en la salud genética de tus cachorros. Esta
        guía explica qué es, cómo se calcula y dónde están los límites razonables.
      </Lead>

      <H2>Qué mide el COI</H2>
      <P>
        El COI es la <Strong>probabilidad de que dos genes en un mismo locus sean idénticos por
        descendencia</Strong> — es decir, que ambos hayan sido heredados del mismo antepasado
        común. Se expresa en porcentaje:
      </P>
      <UL>
        <LI>
          <Strong>COI = 0 %</Strong>: padres totalmente no relacionados (en la práctica, casi
          imposible dentro de una raza pura, porque todas las razas descienden de un fundador
          común).
        </LI>
        <LI>
          <Strong>COI = 25 %</Strong>: cruce padre × hija o hermano × hermana plena. Nivel
          extremo, asociado a depresión por endogamia.
        </LI>
        <LI>
          <Strong>COI = 6,25 %</Strong>: cruce primo × prima. Considerado el umbral razonable de
          cría en línea controlada.
        </LI>
      </UL>

      <Callout kind="info" title="Por qué importa">
        Cuanto más alto el COI, más probable es que un cachorro herede <Em>dos copias</Em> del
        mismo alelo recesivo defectuoso (uno por cada padre). Eso es lo que produce los típicos
        problemas de cría endogámica: defectos cardíacos, problemas neurológicos, esterilidad,
        camadas pequeñas, mortalidad neonatal alta.
      </Callout>

      <H2>La fórmula de Wright</H2>
      <P>
        El biólogo estadounidense Sewall Wright publicó la fórmula en 1922. Para calcular el COI de
        un individuo se identifican todos los <Strong>antepasados comunes</Strong> a sus dos padres
        y se suma, para cada uno, este término:
      </P>
      <P>
        <Strong>
          F<sub>X</sub> = Σ [ (½)<sup>(n₁ + n₂ + 1)</sup> × (1 + f<sub>A</sub>) ]
        </Strong>
      </P>
      <P>donde:</P>
      <UL>
        <LI>
          <Strong>n₁</Strong> = número de generaciones del padre al antepasado común
        </LI>
        <LI>
          <Strong>n₂</Strong> = número de generaciones de la madre al antepasado común
        </LI>
        <LI>
          <Strong>f<sub>A</sub></Strong> = COI del propio antepasado común (recursivo)
        </LI>
      </UL>
      <P>
        En cristiano: cada antepasado común aporta menos COI cuantas más generaciones haya entre él
        y el individuo. Un abuelo común aporta mucho; un tatarabuelo común aporta poco.
      </P>

      <H2>Niveles seguros y de alarma</H2>
      <Table>
        <THead>
          <TR>
            <TH>COI calculado en 5+ generaciones</TH>
            <TH>Interpretación</TH>
            <TH>Riesgo</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>
              <Strong>0 – 6,25 %</Strong>
            </TD>
            <TD>Línea abierta. Cría dispersa.</TD>
            <TD>Bajo</TD>
          </TR>
          <TR>
            <TD>
              <Strong>6,25 – 12,5 %</Strong>
            </TD>
            <TD>Cría en línea controlada. Normal en razas establecidas.</TD>
            <TD>Aceptable</TD>
          </TR>
          <TR>
            <TD>
              <Strong>12,5 – 25 %</Strong>
            </TD>
            <TD>Cría endogámica fuerte. Solo justificable con razón genética.</TD>
            <TD>Alto</TD>
          </TR>
          <TR>
            <TD>
              <Strong>{'>'} 25 %</Strong>
            </TD>
            <TD>Equivalente a cruce padre × hija. Inaceptable en cría responsable.</TD>
            <TD>Crítico</TD>
          </TR>
        </TBody>
      </Table>

      <Callout kind="warning" title="Cuidado con los COI cortos">
        Un COI calculado solo con 3 generaciones puede salir 0 % y engañar. Las razas modernas
        suelen tener cuellos de botella en generaciones 5 - 10. Pide siempre el COI calculado
        sobre al menos 5 generaciones; idealmente 10.
      </Callout>

      <H2>Por qué muchos pedigrees «buenos» tienen COI alto</H2>
      <P>
        Las razas modernas se construyeron sobre un puñado de fundadores. Cuando una raza tiene
        100 años, todos los ejemplares actuales comparten un porcentaje importante de ADN. Esto se
        llama <Strong>COI poblacional</Strong>. En razas como el Bulldog Inglés, el COI promedio
        de la población supera el 25 %, según estudios del Royal Veterinary College.
      </P>
      <P>
        Esto no significa que esté <Em>bien</Em>, significa que el criador serio tiene la
        obligación de <Strong>mantener su COI individual por debajo del promedio poblacional</Strong>{' '}
        para no empeorar el problema. La regla simple: no subas el COI de tu camada por encima del
        de tus padres.
      </P>

      <H2>Cómo Genealogic calcula el COI</H2>
      <P>
        Cuando importas un perro y construyes su árbol genealógico, Genealogic identifica
        automáticamente los antepasados comunes a través de hasta <Strong>10 generaciones</Strong>{' '}
        y aplica la fórmula de Wright. El resultado aparece en el panel «Salud genética» del perfil
        del perro, junto con:
      </P>
      <UL>
        <LI>
          Un <Strong>indicador visual</Strong> (verde / amarillo / naranja / rojo) con el nivel
          de riesgo.
        </LI>
        <LI>
          La <Strong>lista de antepasados que más contribuyen</Strong> al coeficiente, para que
          sepas qué líneas están saturadas.
        </LI>
        <LI>
          Una <Strong>simulación de cruce</Strong>: selecciona padre + madre y calcula el COI que
          tendría la camada antes de programarla.
        </LI>
      </UL>

      <H2>Cómo bajar el COI sin perder tipo</H2>
      <P>
        Bajar el COI no significa abrir la cría a ejemplares mediocres. Significa elegir con
        cabeza:
      </P>
      <UL>
        <LI>
          <Strong>Cruza con líneas distintas dentro de la misma raza</Strong>. La mayoría de razas
          tienen 2 - 4 líneas históricas (por país, por criadero fundador). Mezclarlas baja COI sin
          perder tipo.
        </LI>
        <LI>
          <Strong>Usa el planificador de cruces</Strong> de Genealogic para simular antes de
          comprometer.
        </LI>
        <LI>
          <Strong>Evita el «doble back-cross»</Strong> al mismo semental famoso por más de 2
          generaciones.
        </LI>
        <LI>
          <Strong>Considera cruce inter-variedad</Strong> cuando la raza lo permite (ej.
          Dachshunds, Poodles, Collies).
        </LI>
      </UL>

      <Hr />

      <P>
        El COI no es un número mágico que diga «cría sí / cría no». Es un dato más, junto con
        salud, carácter, conformación y trayectoria, que un criador serio mira antes de programar
        una camada. Pero si lo ignoras, estás conduciendo a ciegas.
      </P>

      <PostCta variant="register" />
    </>
  )
}
