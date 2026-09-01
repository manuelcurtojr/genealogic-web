export const metadata = {
  title: 'Política de Cookies',
  description: 'Información sobre las cookies y tecnologías similares que utiliza Genealogic.',
  alternates: { canonical: 'https://www.genealogic.io/cookies' },
}

export default function CookiesPage() {
  // La sección analítica SOLO aparece si GA está realmente activo
  // (NEXT_PUBLIC_GA_ID en Vercel), para que la política nunca contradiga al
  // sitio. DRAFT del texto de GA pendiente de revisión legal antes de activarlo.
  const analyticsEnabled = !!process.env.NEXT_PUBLIC_GA_ID
  return (
    <>
      <h1>Política de Cookies</h1>
      <p><strong>Última actualización:</strong> 27 de mayo de 2026</p>
      <p>
        Esta Política describe el uso de cookies y tecnologías similares por parte de
        Genealogic, conforme al art. 22.2 de la Ley 34/2002 LSSI-CE, la Guía de Cookies de
        la AEPD (versión vigente) y las directrices del Comité Europeo de Protección de
        Datos (EDPB).
      </p>

      <h2>1. ¿Qué es una cookie?</h2>
      <p>
        Una cookie es un pequeño fichero de texto que un sitio web almacena en el navegador
        del usuario para recordar información sobre la sesión, las preferencias o el uso
        del sitio. Junto a las cookies, otras tecnologías como el almacenamiento local
        (localStorage) o sessionStorage pueden cumplir funciones similares.
      </p>

      <h2>2. Tipos de cookies que utilizamos</h2>

      <h3>2.1 Cookies estrictamente necesarias (técnicas)</h3>
      <p>
        Imprescindibles para el funcionamiento básico del sitio. Permiten mantener la
        sesión iniciada y prestar el servicio solicitado por el usuario. Están exentas del
        deber de consentimiento conforme al art. 22.2 LSSI.
      </p>
      <table>
        <thead>
          <tr><th>Cookie / clave</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-*-auth-token</td>
            <td>Supabase (alojado por Manuel Curtó SL)</td>
            <td>Mantener la sesión de usuario iniciada</td>
            <td>Sesión / 7 días</td>
          </tr>
          <tr>
            <td>__cf_bm, cf_clearance</td>
            <td>Cloudflare (proveedor de CDN/seguridad)</td>
            <td>Mitigación de bots y seguridad anti-abuso</td>
            <td>30 minutos / 30 días</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Almacenamiento local (localStorage)</h3>
      <p>
        Usamos el localStorage del navegador para guardar preferencias del Usuario que no
        se transmiten a nuestros servidores. Esta información permanece exclusivamente en
        tu dispositivo:
      </p>
      <table>
        <thead><tr><th>Clave</th><th>Finalidad</th></tr></thead>
        <tbody>
          <tr><td>cookie-consent</td><td>Recordar tu elección sobre el banner de cookies (aceptar / rechazar)</td></tr>
          <tr><td>theme</td><td>Preferencia de tema claro/oscuro</td></tr>
          <tr><td>sidebar-collapsed</td><td>Estado del menú lateral</td></tr>
          <tr><td>dogs-sort, litters-sort, kennel-sort</td><td>Preferencias de ordenación</td></tr>
          <tr><td>dogs-view, litters-view, kennel-view</td><td>Preferencias de vista (cuadrícula / lista)</td></tr>
          <tr><td>genealogic-lang</td><td>Idioma seleccionado</td></tr>
          <tr><td>dismiss_*</td><td>Banners descartados por el usuario</td></tr>
        </tbody>
      </table>

      <h3>2.3 Cookies analíticas, de marketing o publicidad</h3>
      {analyticsEnabled ? (
        <>
          <p>
            Con tu <strong>consentimiento previo</strong> (banner de cookies), utilizamos
            herramientas de <strong>analítica</strong> y de <strong>grabación de sesión</strong>{' '}
            para entender cómo se usa la plataforma y mejorarla. Estas cookies y tecnologías{' '}
            <strong>no se activan</strong> si rechazas el banner o si no lo aceptas. No usamos
            cookies publicitarias ni de marketing.
          </p>
          <p>
            <strong>Google Analytics 4</strong> (Google Ireland Ltd.), para estadísticas{' '}
            <strong>agregadas</strong> de uso, con la dirección IP anonimizada.
          </p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
            </thead>
            <tbody>
              <tr><td>_ga</td><td>Google Ireland Ltd.</td><td>Distinguir usuarios (analítica agregada)</td><td>2 años</td></tr>
              <tr><td>_ga_*</td><td>Google Ireland Ltd.</td><td>Mantener el estado de sesión de analítica</td><td>2 años</td></tr>
            </tbody>
          </table>
          <p>
            <strong>PostHog</strong> (PostHog, Inc., datos alojados en la región de la{' '}
            <strong>Unión Europea</strong>), para analítica de producto, mapas de calor y{' '}
            <strong>grabación de la sesión</strong> de navegación, que nos permite ver cómo se
            interactúa con la interfaz para detectar errores y puntos de fricción. En las
            grabaciones <strong>se enmascara todo lo que se teclea</strong> en los formularios:
            contraseñas, correos y demás datos introducidos <strong>no se capturan</strong>.
          </p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
            </thead>
            <tbody>
              <tr><td>ph_*_posthog</td><td>PostHog, Inc.</td><td>Identificar el dispositivo/sesión para analítica de producto y grabación de sesión</td><td>1 año</td></tr>
            </tbody>
          </table>
          <p>
            Google Analytics puede implicar una transferencia de datos a Google amparada en el
            marco <em>EU-US Data Privacy Framework</em> y en cláusulas contractuales tipo;{' '}
            <strong>PostHog aloja los datos en servidores de la Unión Europea</strong>. Puedes
            revocar tu consentimiento en cualquier momento borrando las cookies de tu
            navegador.
          </p>
        </>
      ) : (
        <p>
          <strong>No utilizamos cookies de analítica de terceros (Google Analytics, Meta
          Pixel, etc.), ni cookies publicitarias ni de seguimiento</strong>. Las únicas
          métricas que recopilamos son agregadas y se generan en nuestro propio servidor,
          sin perfilado individual ni envío a terceros.
        </p>
      )}

      <h3>2.4 Cookies de Stripe (pasarela de pago)</h3>
      <p>
        Cuando accedes al portal de pago, Stripe puede instalar cookies necesarias para
        prevenir fraude y para que la pasarela funcione (m-stripe-csrf, __stripe_mid,
        __stripe_sid). Estas cookies se rigen por la{' '}
        <a href="https://stripe.com/es/cookie-settings" target="_blank" rel="noopener">
          política de cookies de Stripe
        </a>{' '}
        y se activan únicamente durante el flujo de pago.
      </p>

      <h2>3. Base Legal del Uso de Cookies</h2>
      <ul>
        <li><strong>Cookies estrictamente necesarias:</strong> art. 22.2 LSSI (exentas de consentimiento).</li>
        {analyticsEnabled && (
          <li><strong>Cookies analíticas y de grabación de sesión (Google Analytics, PostHog):</strong> consentimiento del Usuario (art. 6.1.a RGPD y art. 22.2 LSSI), revocable en cualquier momento.</li>
        )}
        <li><strong>Cookies de Stripe:</strong> ejecución del contrato cuando el Usuario inicia el pago.</li>
      </ul>
      <p>
        Si en el futuro incorporáramos cookies no esenciales, se solicitaría el
        consentimiento previo mediante un banner que cumpla las directrices de la AEPD,
        con opción granular y rechazo tan fácil como aceptación.
      </p>

      <h2>4. Gestión de Cookies en el Navegador</h2>
      <p>
        Puedes configurar tu navegador para bloquear o eliminar cookies, ya sea de forma
        general o por sitio. Ten en cuenta que si bloqueas las cookies de sesión,
        Genealogic no podrá mantenerte autenticado.
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noopener">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noopener">Microsoft Edge</a></li>
        <li><a href="https://help.brave.com/hc/en-us/articles/360050634931" target="_blank" rel="noopener">Brave</a></li>
      </ul>

      <h2>5. Cambios en esta Política</h2>
      <p>
        Esta Política puede actualizarse para reflejar cambios técnicos o legales. La
        fecha de "última actualización" arriba indica la versión vigente. Te recomendamos
        revisarla periódicamente.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para cualquier consulta sobre cookies escribe a{' '}
        <strong>hola@genealogic.io</strong>.
      </p>
    </>
  )
}
