import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Em, Table, THead, TBody, TR, TH, TD } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'calendario-pruebas-salud-hd-dcm',
  title: 'Displasia, DCM, MDR1: el calendario de pruebas que todo criador serio debería tener',
  excerpt:
    'Las pruebas sanitarias oficiales no son opcionales — son la diferencia entre criar bien y criar a ciegas. Tabla por raza con qué prueba, a qué edad y con qué frecuencia.',
  date: '2026-05-01',
  category: 'Salud',
  heroImage:
    'https://images.unsplash.com/photo-1612531822818-7e2c5e7dabc1?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Perro siendo examinado por un veterinario con estetoscopio',
  readMinutes: 9,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        El 90 % de los problemas que aparecen en una camada se podrían haber detectado en los
        padres con una prueba de 80 - 150 €. Este artículo enumera qué prueba toca por raza, a
        qué edad y cómo gestionarlo sin volverse loco con el calendario.
      </Lead>

      <H2>Las 4 pruebas estructurales</H2>
      <P>
        Hay cuatro categorías de prueba que cualquier criador serio debería conocer y aplicar
        según la raza:
      </P>

      <H3>1. HD — Displasia de cadera</H3>
      <P>
        Radiografía oficial bajo sedación. Se hace a partir de los <Strong>12 meses</Strong> en
        razas pequeñas y medianas, <Strong>18 meses</Strong> en grandes y gigantes. Lee un
        veterinario certificado FCI o equivalente, no el de cabecera. La graduación va de A
        (sin displasia) a E (severa).
      </P>
      <UL>
        <LI>Solo se debería criar con <Strong>HD-A o HD-B</Strong>.</LI>
        <LI>HD-C es discutible y depende de las líneas de la raza.</LI>
        <LI>HD-D y HD-E son cría irresponsable.</LI>
      </UL>

      <H3>2. ED — Displasia de codo</H3>
      <P>
        Misma sesión radiográfica que la HD, otro plano. Imprescindible en razas grandes y
        gigantes que ya saltan la HD por estatura. Graduación 0 (sin displasia) a 3.
      </P>
      <UL>
        <LI>Solo cría con ED-0.</LI>
        <LI>ED-1 con precaución y siempre acoplando a un ED-0 contrastado.</LI>
      </UL>

      <H3>3. Cardiología — Ecocardiograma</H3>
      <P>
        Doppler ecocardiográfico realizado por cardiólogo veterinario certificado. Detecta
        cardiomiopatía dilatada (DCM) en Dóberman, Boxer, Gran Danés. Detecta enfermedad de la
        válvula mitral (MMVD) en Cavalier King Charles. Se hace anualmente a partir del año.
      </P>
      <P>
        El sistema más usado en Europa es el <Strong>protocolo Holter de 24 h</Strong> para DCM en
        Dóberman: detecta arritmias precoces. Las hembras y machos reproductores deben tener
        Holter actualizado anual.
      </P>

      <H3>4. Genéticas — Paneles ADN</H3>
      <P>
        Análisis de saliva (Embark, Wisdom Panel, Laboklin). Detectan mutaciones recesivas
        específicas de cada raza. Permiten cruzar de forma «libre» y «portador» con seguridad,
        evitando dos copias en los cachorros.
      </P>

      <H2>Tabla por raza</H2>
      <P>Resumen de las pruebas indispensables para las razas más comunes en cría en España:</P>

      <Table>
        <THead>
          <TR>
            <TH>Raza</TH>
            <TH>Pruebas mínimas</TH>
            <TH>Edad mínima</TH>
            <TH>Frecuencia</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>
              <Strong>Pastor Alemán</Strong>
            </TD>
            <TD>HD, ED, mielopatía degenerativa (DM), MDR1</TD>
            <TD>12 m HD/ED, ADN cualquier edad</TD>
            <TD>HD/ED una vez. ADN una vez.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Cane Corso</Strong>
            </TD>
            <TD>HD, ED, cardio, entropión/ectropión, hiperuricosuria</TD>
            <TD>18 m HD/ED, cardio anual</TD>
            <TD>Cardio: anual reproductores.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Bulldog Francés / Inglés</Strong>
            </TD>
            <TD>BOAS (test funcional respiratorio), columna (RX), HD, oftalmológico</TD>
            <TD>12 m BOAS, 18 m HD</TD>
            <TD>BOAS anual.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Cocker Spaniel</Strong>
            </TD>
            <TD>HD, oftalmológico (PRA, catarata), prcd-PRA por ADN, AIHA</TD>
            <TD>12 m HD, oftalmo anual</TD>
            <TD>Oftalmo anual.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Dóberman</Strong>
            </TD>
            <TD>HD, cardio + Holter 24 h, DCM ADN, von Willebrand</TD>
            <TD>12 m HD, cardio desde 18 m</TD>
            <TD>Cardio + Holter: anual.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Pastor Australiano / Border Collie</Strong>
            </TD>
            <TD>HD, ED, CEA, MDR1, prcd-PRA, ojo de Collie</TD>
            <TD>12 m HD, ADN cualquier edad</TD>
            <TD>Una vez ADN. Oftalmo anual.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Cavalier King Charles</Strong>
            </TD>
            <TD>Cardio (MMVD), siringomielia (RM), DE/CC</TD>
            <TD>Cardio anual desde 12 m, RM 30 m</TD>
            <TD>Cardio anual.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Presa Canario</Strong>
            </TD>
            <TD>HD, ED, cardio, entropión</TD>
            <TD>18 m HD/ED</TD>
            <TD>Cardio anual recomendado.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Bull Terrier</Strong>
            </TD>
            <TD>Cardio (estenosis subaórtica, mitral), riñón (BUN/Cr), sordera (BAER)</TD>
            <TD>BAER 6 sem cachorros, cardio anual</TD>
            <TD>Cardio anual. BAER cachorros.</TD>
          </TR>
          <TR>
            <TD>
              <Strong>Mastín / razas gigantes</Strong>
            </TD>
            <TD>HD, ED, cardio, panosteítis (clínico), torsión gástrica (info)</TD>
            <TD>24 m HD/ED por madurez ósea</TD>
            <TD>Cardio anual reproductores.</TD>
          </TR>
        </TBody>
      </Table>

      <Callout kind="info" title="Esto no es una lista cerrada">
        Cada raza tiene su club nacional con un protocolo sanitario oficial. Antes de programar
        cría consulta el del tuyo: a menudo añaden pruebas específicas (test conductual, BOAS,
        evaluación ocular ECVO) que no aparecen en la tabla genérica.
      </Callout>

      <H2>Cuándo se hacen y por qué hay edades mínimas</H2>
      <P>
        Las edades no son arbitrarias. Tienen que ver con el desarrollo:
      </P>
      <UL>
        <LI>
          <Strong>HD/ED</Strong> requiere que el esqueleto esté cerrado. Antes de los 12 meses
          (razas pequeñas) o 18 - 24 (grandes), la lectura es poco fiable.
        </LI>
        <LI>
          <Strong>Cardio funcional</Strong> (no anatómico): a partir del año la cámara cardíaca
          ya tiene su forma adulta. Antes hay riesgo de falsos positivos.
        </LI>
        <LI>
          <Strong>Oftalmológico</Strong>: a partir de las 8 semanas se puede hacer screening
          inicial (descartar cataratas juveniles, microftalmia), pero el seguimiento serio
          empieza a los 12 meses.
        </LI>
        <LI>
          <Strong>ADN</Strong>: a cualquier edad. Un cachorro de 4 semanas puede tener ya el
          test genético completo, válido toda la vida.
        </LI>
      </UL>

      <H2>Cómo organizarlo sin volverse loco</H2>
      <P>
        Un criadero con 3 reproductores activos puede tener fácilmente 8 - 12 pruebas anuales
        entre todos. Si no llevas calendario, te olvidas. Genealogic incluye un
        <Strong> calendario sanitario por perro</Strong> que:
      </P>
      <UL>
        <LI>
          Pre-rellena las pruebas recomendadas para cada raza al añadir un perro nuevo.
        </LI>
        <LI>
          Te recuerda con 30 días de antelación cuando toca una prueba anual.
        </LI>
        <LI>
          Almacena los certificados oficiales escaneados, vinculados al perro.
        </LI>
        <LI>
          Los muestra automáticamente en la ficha pública del perro (los compradores pueden
          verlos), reforzando tu credibilidad.
        </LI>
      </UL>
      <Callout kind="tip" title="Truco">
        Centraliza todas las pruebas anuales en el mismo trimestre. Pides cita en el centro
        veterinario una sola mañana y aprovechas para hacer HD, ED, cardio y panel ocular al
        mismo perro. Te ahorras visitas y desplazamientos.
      </Callout>

      <Hr />

      <P>
        El argumento «mi línea no tiene problemas, no necesito pruebas» es exactamente el que
        precede a una camada con tres cachorros con HD-C. Las pruebas sanitarias no son una
        carga: son la red de seguridad sin la cual no se puede llamar criador a uno mismo.
      </P>

      <PostCta variant="register" />
    </>
  )
}
