import { H2, H3, P, Lead, UL, LI, OL, Strong, Callout, PostCta, Hr, Em } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'importar-pedigree-ia-12-segundos',
  title: 'Importar un pedigree de 5 generaciones en 12 segundos: cómo lo hace la IA',
  excerpt:
    'Subes una foto del papel del pedigree y la IA construye el árbol completo. Cómo funciona, qué precisión tiene, qué hace cuando se equivoca y por qué cambia el trabajo del criador.',
  date: '2026-04-28',
  category: 'Plataforma',
  heroImage:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Pantalla con visualización de inteligencia artificial y nodos conectados',
  readMinutes: 7,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Hace dos años, registrar un perro con su árbol de 5 generaciones en una plataforma
        significaba escribir 31 fichas (1 perro + 2 padres + 4 abuelos + 8 bisabuelos + 16
        tatarabuelos). Con la IA de Genealogic, lo haces subiendo una foto. Esto es lo que hay
        detrás.
      </Lead>

      <H2>El problema que resuelve</H2>
      <P>
        Cualquier criador que ha intentado digitalizar su archivo histórico sabe el dolor. Un
        pedigree típico tiene <Strong>30 - 60 entradas de texto</Strong> entre nombres, números
        de registro, fechas de nacimiento, títulos, razas y colores. Multiplicado por todos los
        perros del criadero, son cientos de horas de transcripción manual.
      </P>
      <P>
        La consecuencia: la mayoría de criaderos no digitalizan. Sus pedigrees viven en una
        carpeta de plástico, y cuando hay que enseñarlos a un comprador, se manda una foto del
        papel. Sin búsqueda, sin verificación cruzada, sin cálculo automático de COI.
      </P>

      <H2>Cómo funciona la importación con IA</H2>

      <H3>1. Subes la foto</H3>
      <P>
        Desde tu dashboard, <Strong>Mis perros → Nuevo → Importar pedigree</Strong>. Aceptamos
        formatos JPG, PNG, HEIC y PDF. La foto puede ser:
      </P>
      <UL>
        <LI>Un escaneo limpio.</LI>
        <LI>Una foto con el móvil sobre la mesa.</LI>
        <LI>Una foto tomada con luz tenue, levemente inclinada (la IA hace corrección).</LI>
        <LI>Un PDF generado por el club canino.</LI>
      </UL>

      <H3>2. Claude Sonnet 4.5 procesa la imagen</H3>
      <P>
        La IA detrás es <Strong>Claude Sonnet 4.5</Strong> de Anthropic (el mismo modelo que está
        detrás del emailbot). Para cada perro detectado en el árbol, extrae:
      </P>
      <UL>
        <LI>Nombre completo con afijo.</LI>
        <LI>Número de registro (LOE, LO, AKC, KC...) si está visible.</LI>
        <LI>Fecha de nacimiento.</LI>
        <LI>Sexo (inferido de la posición en el árbol o de prefijos / sufijos).</LI>
        <LI>Color y manto.</LI>
        <LI>Títulos (Ch., Int.Ch., Camp., etc.) si aparecen.</LI>
        <LI>Pruebas sanitarias visibles (HD-A, ED-0, etc.).</LI>
        <LI>Posición en la genealogía (padre/madre/abuelos).</LI>
      </UL>
      <P>
        Tiempo medio para un pedigree de 5 generaciones (31 perros): <Strong>8 - 14 segundos</Strong>.
        Lo cobramos como uso de tokens, contado por el plan (Free tiene 5 importaciones/mes;
        Pro tiene ilimitadas).
      </P>

      <H3>3. Revisión visual</H3>
      <P>
        La IA <Em>no</Em> escribe directamente en tu base de datos. Te muestra el árbol
        extraído lado a lado con la foto original, para que valides:
      </P>
      <UL>
        <LI>
          <Strong>Nombres en verde</Strong>: alta confianza, coinciden con perros ya existentes
          en Genealogic.
        </LI>
        <LI>
          <Strong>Nombres en azul</Strong>: alta confianza, nuevos en la plataforma.
        </LI>
        <LI>
          <Strong>Nombres en naranja</Strong>: confianza media. La IA marca exactamente qué no le
          cuadra (ej.: «fecha probablemente 1995 o 1996, ilegible»).
        </LI>
        <LI>
          <Strong>Nombres en rojo</Strong>: baja confianza, requiere revisión manual.
        </LI>
      </UL>
      <Callout kind="info" title="Cruce con base de datos">
        Si un antepasado ya está registrado en Genealogic por otro criador (cosa habitual en
        razas con líneas comunes), la IA lo detecta y propone enlazarlo. Si dices que sí, no se
        crea un duplicado: tu árbol enlaza directamente con la ficha existente, que ya tiene
        fotos, pruebas y otros descendientes registrados. Conocimiento colaborativo.
      </Callout>

      <H3>4. Confirmación y guardado</H3>
      <P>
        Apruebas el árbol completo (o lo corriges manualmente lo que haga falta) y se guarda en
        tu cuenta. Todo el árbol queda enlazado en una transacción atómica: o se guarda entero o
        nada, no hay árboles a medias.
      </P>

      <H2>Qué precisión tiene</H2>
      <P>
        Datos internos sobre las primeras 5.000 importaciones reales:
      </P>
      <UL>
        <LI>
          <Strong>Pedigrees escaneados FCI/RSCE modernos (post-2000)</Strong>: 97 % de
          entradas extraídas correctamente sin intervención humana.
        </LI>
        <LI>
          <Strong>Pedigrees manuscritos antiguos (pre-1990)</Strong>: 78 - 85 %, con tasas más
          bajas en fechas y números de registro.
        </LI>
        <LI>
          <Strong>Pedigrees fotografiados con móvil con baja luz</Strong>: 88 - 92 %.
        </LI>
        <LI>
          <Strong>PDFs vectoriales de clubes oficiales</Strong>: 99,5 % (es básicamente texto
          plano).
        </LI>
      </UL>
      <P>
        Las dificultades clásicas son los <Em>nombres extranjeros con caracteres
        especiales</Em> (rusos, escandinavos, polacos), las firmas manuscritas que se cruzan
        con texto, y los pedigrees viejos con tinta desvanecida.
      </P>

      <H2>Qué pasa si se equivoca</H2>
      <P>Tres escenarios:</P>

      <H3>Error de OCR (lectura de carácter)</H3>
      <P>
        Ejemplo: lee «Rocco» en vez de «Roxo». Editas el campo en la pantalla de revisión y
        listo. La corrección queda guardada para que el modelo aprenda en futuras versiones.
      </P>

      <H3>Error de relación (padre y madre invertidos)</H3>
      <P>
        Excepcional. La IA usa la convención FCI (padre arriba, madre abajo) y verifica con
        prefijos de género en el nombre (Ch.M., Ch.H., suffix «filia» en algunos países). Si
        falla, lo corriges arrastrando las cajas en el editor visual.
      </P>

      <H3>Antepasado faltante por foto recortada</H3>
      <P>
        Si la foto no captura una rama completa, la IA marca el árbol como
        <Strong> «incompleto»</Strong> y te ofrece subir una segunda foto que cubra esa rama.
        Une los datos en un solo árbol.
      </P>

      <H2>Por qué cambia el trabajo del criador</H2>
      <P>
        Antes de la importación con IA, los criadores hacíamos una elección dolorosa: o pagar a
        alguien para digitalizar el archivo (1 - 3 € por perro, multiplicado por cientos), o
        renunciar a tener un catálogo digital. La mayoría renunciábamos.
      </P>
      <P>
        Con la IA, digitalizar todo un archivo histórico de 30 años pasa de ser un proyecto de
        2 - 4 semanas de trabajo a ser una <Strong>tarde de un fin de semana</Strong>. Y eso
        cambia tres cosas concretas:
      </P>
      <OL>
        <LI>
          <Strong>El comprador serio puede ver tu trayectoria entera</Strong>. Ya no le mandas
          fotos de papeles; le mandas un link a un árbol navegable.
        </LI>
        <LI>
          <Strong>Calculas COI cruzando cualquier semental con cualquier hembra</Strong>, sin
          tener que reconstruir mentalmente la ascendencia. Te ahorra cría endogámica
          accidental.
        </LI>
        <LI>
          <Strong>Conectas con otros criaderos que comparten líneas</Strong>. Cuando dos
          árboles se cruzan en un mismo antepasado, los dueños lo ven y pueden contactar para
          intercambio de información o cría coordinada.
        </LI>
      </OL>

      <Hr />

      <P>
        La IA no sustituye el criterio del criador. Sustituye la transcripción tediosa para que
        tú puedas dedicar el tiempo a lo que realmente importa: elegir cruces, atender clientes,
        cuidar a los perros.
      </P>

      <PostCta variant="import" />
    </>
  )
}
