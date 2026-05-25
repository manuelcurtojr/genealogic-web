import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Em, A } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'afijo-criadero-kennel-espana',
  title: 'Afijo, criadero y kennel: qué necesitas para empezar a criar legalmente en España',
  excerpt:
    'RSCE, FCI, registro de afijo, núcleo zoológico, condiciones de instalaciones. La checklist completa para pasar de aficionado a criador con papeles en regla.',
  date: '2026-05-12',
  category: 'Legal',
  heroImage:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Mesa de trabajo con portátil y documentación sobre madera clara',
  readMinutes: 8,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Tener una hembra de raza y querer sacar una camada no te convierte en criador. Para
        operar legalmente en España hace falta afijo, núcleo zoológico y cumplir con la
        normativa autonómica de bienestar animal. Esta es la checklist.
      </Lead>

      <H2>1. ¿Qué es un afijo?</H2>
      <P>
        El afijo es el «apellido» de tu criadero. Es una palabra (o expresión corta) que se añade
        al nombre de todos los cachorros que nazcan bajo tu cría. Por ejemplo: si tu afijo es{' '}
        <Em>«de El Nie»</Em>, todos tus cachorros se llamarán Goya de El Nie, Trueno de El Nie,
        Estrella de El Nie...
      </P>
      <P>
        El afijo se registra en la <Strong>RSCE</Strong> (Real Sociedad Canina de España) y se
        homologa internacionalmente a través de la FCI, lo que lo hace válido en todos los países
        miembros (más de 90).
      </P>

      <H3>Cómo se solicita</H3>
      <UL>
        <LI>
          Eliges 3 propuestas de afijo por orden de preferencia. Tienen que ser únicas a nivel FCI
          (la RSCE comprueba que no estén en uso en ningún país miembro).
        </LI>
        <LI>
          Rellenas el formulario en la web de la RSCE y pagas la tasa de registro (alrededor de
          150 € en el momento de escribir esto; consulta el importe vigente).
        </LI>
        <LI>
          El proceso tarda entre 2 y 4 meses. Si tu primera opción está libre, te la asignan.
        </LI>
      </UL>
      <Callout kind="tip" title="Elige bien">
        El afijo te acompaña toda la vida. No lo puedes cambiar. Piensa en algo corto, fácil de
        pronunciar internacionalmente y que no se confunda con el nombre del perro. Los afijos
        descriptivos («de los Pinos», «del Valle») envejecen mejor que los irónicos.
      </Callout>

      <H2>2. Núcleo zoológico</H2>
      <P>
        El <Strong>núcleo zoológico</Strong> es una autorización administrativa (de la comunidad
        autónoma, no del Estado) que necesitas si <Em>vas a vender</Em> animales con cierta
        frecuencia. La definición de «frecuencia» varía por comunidad: en algunas basta con tener
        2 hembras reproductoras, en otras es a partir de una camada al año, en otras a partir de
        actividad comercial declarada.
      </P>
      <P>
        Lo que la inspección verifica:
      </P>
      <UL>
        <LI>
          <Strong>Instalaciones</Strong>: superficie mínima por animal, zonas de ejercicio,
          aislamiento térmico, drenaje, ventilación.
        </LI>
        <LI>
          <Strong>Documentación sanitaria</Strong>: cartillas vacunales al día, contrato con
          veterinario, libro de tratamientos.
        </LI>
        <LI>
          <Strong>Identificación</Strong>: todos los animales con microchip y registrados en el
          censo autonómico.
        </LI>
        <LI>
          <Strong>Plan de gestión</Strong>: protocolo de limpieza, desinsectación,
          desratización, eliminación de cadáveres.
        </LI>
      </UL>
      <P>
        Sin núcleo zoológico no puedes anunciar cachorros públicamente (la ley estatal y casi
        todas las autonómicas lo prohíben). Sin él, lo que estás haciendo es venta particular,
        que tiene un máximo legal por año muy bajo y suele estar limitada a la propia camada de tu
        perra.
      </P>

      <H2>3. La Ley de Bienestar Animal (Ley 7/2023)</H2>
      <P>
        La ley estatal de bienestar animal entró en vigor en 2023 y ha redefinido el marco para
        cría. Lo más relevante:
      </P>
      <UL>
        <LI>
          <Strong>Prohibición de venta en escaparates</Strong> y tiendas físicas. Los cachorros
          solo pueden venderse directamente desde el criador.
        </LI>
        <LI>
          <Strong>Obligación de identificación electrónica</Strong> (microchip) antes de la
          entrega.
        </LI>
        <LI>
          <Strong>Edad mínima de separación de la madre</Strong>: 8 semanas para perros (la FCI
          recomienda 10).
        </LI>
        <LI>
          <Strong>Registro centralizado</Strong> (Registro de Identificación de Animales de
          Compañía, RIAC) en proceso de despliegue.
        </LI>
        <LI>
          <Strong>Curso obligatorio de tenencia responsable</Strong> para los compradores (en
          desarrollo reglamentario; consulta normativa actual antes de prometer nada al cliente).
        </LI>
      </UL>
      <Callout kind="warning" title="Ojo a las autonómicas">
        Cada comunidad autónoma tiene su propia ley. Andalucía, Cataluña, Madrid, País Vasco y
        Canarias tienen requisitos específicos que <Strong>se suman</Strong> a los estatales. Si
        crías en una comunidad y vendes a otra, te aplican las dos normativas.
      </Callout>

      <H2>4. Fiscalidad básica</H2>
      <P>
        Si vendes camadas con regularidad, Hacienda te puede considerar actividad económica.
        Indicadores típicos:
      </P>
      <UL>
        <LI>Tienes núcleo zoológico activo.</LI>
        <LI>Vendes más de una camada al año.</LI>
        <LI>Anuncias en plataformas comerciales.</LI>
        <LI>Tienes web con catálogo de servicios de cría.</LI>
      </UL>
      <P>
        En ese caso, lo correcto es darte de alta como autónomo en el <Strong>epígrafe del IAE</Strong>{' '}
        correspondiente (suelen aplicarse 962.1 o 999, pero confírmalo con un asesor) y emitir
        factura por cada venta. Tributas por IRPF en estimación directa simplificada con módulos
        si aplica. Una asesoría especializada en autónomos te lo gestiona por 50 - 80 €/mes.
      </P>

      <H2>5. Documentación que entregas al comprador</H2>
      <P>Un criador en regla entrega con cada cachorro:</P>
      <UL>
        <LI>
          <Strong>Pedigree FCI/RSCE</Strong> con sello (o resguardo de tramitación si aún no llegó).
        </LI>
        <LI>
          <Strong>Cartilla sanitaria oficial</Strong> con vacunas, desparasitación interna y
          externa.
        </LI>
        <LI>
          <Strong>Certificado de microchip</Strong> e inscripción en el censo autonómico, con
          cambio de titularidad ya iniciado.
        </LI>
        <LI>
          <Strong>Contrato de compraventa</Strong> firmado por ambas partes (ver{' '}
          <A href="/blog/5-errores-arruinan-camada">5 errores que arruinan una camada</A>).
        </LI>
        <LI>
          <Strong>Factura</Strong> con tu CIF/NIF de autónomo y los datos del cachorro.
        </LI>
        <LI>
          <Strong>Carpeta de bienvenida</Strong>: pauta alimentaria, manual de socialización,
          recomendaciones de las primeras 4 semanas.
        </LI>
      </UL>

      <H2>6. Cómo ayuda Genealogic a llevar todo esto</H2>
      <UL>
        <LI>
          <Strong>Afijo y kennel</Strong>: configura una vez en tu perfil; se aplica
          automáticamente al nombre de todos los cachorros que registres.
        </LI>
        <LI>
          <Strong>Pedigree verificable</Strong>: cada perro con árbol de hasta 5 generaciones,
          datos sanitarios y pruebas oficiales.
        </LI>
        <LI>
          <Strong>Microchip y registro</Strong>: campo dedicado en la ficha de cada cachorro,
          exportable a tu cartilla y a tu contrato.
        </LI>
        <LI>
          <Strong>Contratos automáticos</Strong> (tier Pro): plantilla legal personalizada con
          los datos del cachorro y del comprador, lista para firmar.
        </LI>
        <LI>
          <Strong>Web pública del criadero</Strong>: tu afijo en el dominio, tu núcleo zoológico
          visible, tu trayectoria pública. Es la mejor carta de presentación al inspector y al
          comprador.
        </LI>
      </UL>

      <Hr />

      <P>
        Hacer las cosas en regla no es burocrático: es la diferencia entre ser tomado en serio o
        ser confundido con un revendedor. Y, francamente, te ahorra disgustos.
      </P>

      <PostCta variant="register" />
    </>
  )
}
