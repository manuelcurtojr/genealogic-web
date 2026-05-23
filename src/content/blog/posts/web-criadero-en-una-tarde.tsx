import { H2, H3, P, Lead, UL, LI, OL, Strong, Callout, PostCta, Hr, Em } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'web-criadero-en-una-tarde',
  title: 'Cómo construyo la web pública de mi criadero en una tarde',
  excerpt:
    'Tutorial paso a paso del editor visual de Genealogic. 8 páginas, 36 secciones, dominio propio y diseño coherente. Sin tocar código.',
  date: '2026-05-10',
  category: 'Plataforma',
  heroImage:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Portátil abierto con maquetas de diseño web sobre una mesa de madera',
  readMinutes: 8,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Una web profesional ya no requiere contratar a un desarrollador ni aprender Wordpress.
        Con el editor visual de Genealogic, en una tarde tienes la web de tu criadero publicada,
        en tu propio dominio, con tu marca. Te explico cómo, paso a paso.
      </Lead>

      <H2>Por qué tu criadero necesita web propia</H2>
      <P>
        Estar solo en Instagram es un problema. Cuando alguien busca «criador de Cane Corso
        Madrid» en Google, no aparecen perfiles de Instagram; aparecen webs. Y si no tienes web,
        no apareces. Punto.
      </P>
      <P>
        Una web propia te da:
      </P>
      <UL>
        <LI>
          <Strong>Posicionamiento orgánico en Google</Strong> con tu nombre, tu raza y tu zona
          geográfica.
        </LI>
        <LI>
          <Strong>Catálogo público de tus perros</Strong> con árbol genealógico verificable.
        </LI>
        <LI>
          <Strong>Formulario de contacto</Strong> que filtra a los compradores serios de los
          curiosos.
        </LI>
        <LI>
          <Strong>Anuncios de camadas próximas</Strong> indexables.
        </LI>
        <LI>
          <Strong>Tu historia, tus instalaciones, tus testimonios</Strong> — todo el contexto que
          un comprador serio quiere antes de mandarte un mensaje.
        </LI>
      </UL>

      <H2>Lo que viene de serie en Genealogic</H2>
      <P>
        Cuando activas la web pública, te aparecen <Strong>8 páginas troncales</Strong> ya
        preconfiguradas con secciones por defecto. Solo tienes que sustituir los textos, las
        fotos y los datos:
      </P>
      <UL>
        <LI>
          <Strong>Home</Strong>: hero con tu afijo, intro corta, perros destacados, CTA.
        </LI>
        <LI>
          <Strong>Perros</Strong>: catálogo automático con tus reproductores y los disponibles.
        </LI>
        <LI>
          <Strong>Razas</Strong>: si crías varias, una página por raza con explicación.
        </LI>
        <LI>
          <Strong>Historia</Strong>: cómo empezó tu criadero, generaciones, hitos.
        </LI>
        <LI>
          <Strong>Servicios</Strong>: monta, asesoría, pensión, lo que ofrezcas.
        </LI>
        <LI>
          <Strong>Instalaciones</Strong>: galería de fotos de tu kennel.
        </LI>
        <LI>
          <Strong>Blog</Strong> (opcional): para SEO orgánico de largo plazo.
        </LI>
        <LI>
          <Strong>Contacto</Strong>: formulario que llega directo a tu email + WhatsApp.
        </LI>
      </UL>

      <H2>El proceso en 4 fases</H2>

      <H3>Fase 1 — Contenido (45 min)</H3>
      <P>Antes de tocar el editor, ten preparados:</P>
      <UL>
        <LI>Foto de portada del criadero (tu mejor ejemplar o tus instalaciones).</LI>
        <LI>Logo y/o afijo con tipografía limpia.</LI>
        <LI>15 - 30 fotos de perros, instalaciones, camadas anteriores.</LI>
        <LI>2 párrafos sobre tu historia (cuándo empezaste, por qué, qué te diferencia).</LI>
        <LI>Datos: dirección, teléfono, email, número de núcleo zoológico, redes sociales.</LI>
      </UL>
      <Callout kind="tip" title="Trampa común">
        No te pongas a redactar todo en el editor. Escríbelo antes en un documento aparte y
        después lo pegas en cada sección. Te ahorra una hora de frustración.
      </Callout>

      <H3>Fase 2 — Editor (60 - 90 min)</H3>
      <OL>
        <LI>
          Entra en <Strong>Dashboard → Web</Strong>. Verás la lista de 8 páginas con su estado
          (publicada / borrador).
        </LI>
        <LI>
          Empieza por <Strong>Home</Strong>. Click en la página → se abre el editor de 3
          columnas: árbol de secciones a la izquierda, canvas en el centro, propiedades a la
          derecha.
        </LI>
        <LI>
          Click en la sección «Hero» del árbol. En el panel de propiedades cambias título,
          subtítulo, imagen de fondo y texto del botón.
        </LI>
        <LI>
          Avanza por cada sección. Para cambiar de página, click en el selector superior.
        </LI>
        <LI>
          ¿Quieres añadir una sección? Botón «+» entre cualquier dos secciones. Tienes 36 tipos
          disponibles (galería, testimonios, lista de servicios, mapa, FAQ, etc.).
        </LI>
      </OL>

      <H3>Fase 3 — Marca (20 min)</H3>
      <P>En <Strong>Ajustes → Apariencia</Strong> defines:</P>
      <UL>
        <LI>
          <Strong>Color principal</Strong> (el que se usa en botones y acentos).
        </LI>
        <LI>
          <Strong>Tipografía</Strong> de títulos y cuerpo (catálogo de 12 fuentes
          profesionales).
        </LI>
        <LI>
          <Strong>Logo</Strong> en versión clara y oscura.
        </LI>
        <LI>
          <Strong>Favicon</Strong>, OG image y meta description (para que se vea bien al
          compartir en WhatsApp y redes).
        </LI>
      </UL>

      <H3>Fase 4 — Dominio propio (15 min)</H3>
      <OL>
        <LI>
          Compra el dominio en cualquier registrador (Namecheap, DonDominio,
          Hostinger...). Cuesta entre 10 y 20 € al año.
        </LI>
        <LI>
          En Genealogic, <Strong>Cuenta → Dominio</Strong>, pega tu dominio.
        </LI>
        <LI>
          En el panel de tu registrador, añade los <Strong>registros DNS</Strong> que Genealogic
          te muestra (un A y un CNAME).
        </LI>
        <LI>
          Vuelve a Genealogic, click en «Verificar». En 5 - 30 min queda activo con HTTPS
          automático.
        </LI>
      </OL>
      <Callout kind="info" title="Nota técnica">
        El certificado SSL lo emite y renueva Vercel (nuestro hosting) automáticamente vía Let's
        Encrypt. No tienes que tocar nada.
      </Callout>

      <H2>Trucos que la mayoría no usa</H2>

      <H3>Conectar el catálogo automáticamente</H3>
      <P>
        En la sección «Perros destacados» del Home, no tienes que mantener una lista manual.
        Cambia el filtro a <Em>«Reproductores actuales»</Em> o <Em>«Disponibles para venta»</Em> y
        el catálogo se actualiza solo cuando registras un perro nuevo o cambias su estado.
      </P>

      <H3>Web bilingüe</H3>
      <P>
        Si vendes internacional (es lo habitual con razas exóticas como Presa Canario o
        Spanish Mastiff), activa la versión en inglés. Cada sección tiene un campo para el texto
        traducido. El selector de idioma aparece en el header automáticamente.
      </P>

      <H3>Previsualización antes de publicar</H3>
      <P>
        Cualquier cambio que hagas se guarda como <Em>borrador</Em>. La web pública no cambia
        hasta que pulsas «Publicar». Esto te permite trastear sin miedo y enseñarle el preview a
        alguien de confianza antes de lanzar.
      </P>

      <H3>Undo / Redo histórico</H3>
      <P>
        Cada edición se guarda en un historial. Si la cagas, vuelves atrás. No solo el último
        cambio: las últimas 50 versiones de cada página.
      </P>

      <Hr />

      <P>
        Con esto, tu web está online la misma tarde. La indexación de Google tarda 2 - 7 días en
        empezar a verte; la primera consulta orgánica suele llegar a las 2 - 3 semanas.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
