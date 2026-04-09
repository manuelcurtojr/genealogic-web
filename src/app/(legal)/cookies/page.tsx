export const metadata = { title: 'Política de Cookies — Genealogic' }

export default function CookiesPage() {
  return (
    <>
      <h1>Política de Cookies</h1>
      <p><strong>Última actualización:</strong> 9 de abril de 2026</p>

      <h2>1. ¿Qué son las cookies?</h2>
      <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde tus acciones y preferencias durante un período de tiempo.</p>

      <h2>2. Cookies que utilizamos</h2>

      <h3>2.1 Cookies estrictamente necesarias</h3>
      <p>Estas cookies son esenciales para el funcionamiento de la plataforma y no pueden desactivarse.</p>
      <table>
        <thead><tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Supabase</td><td>Mantener la sesión de usuario iniciada</td><td>Sesión / 7 días</td></tr>
        </tbody>
      </table>

      <h3>2.2 Almacenamiento local (localStorage)</h3>
      <p>Utilizamos localStorage del navegador para guardar preferencias que no se envían al servidor:</p>
      <table>
        <thead><tr><th>Clave</th><th>Finalidad</th></tr></thead>
        <tbody>
          <tr><td>theme</td><td>Preferencia de tema claro/oscuro</td></tr>
          <tr><td>sidebar-collapsed</td><td>Estado del menú lateral</td></tr>
          <tr><td>dogs-sort, litters-sort, kennel-sort</td><td>Preferencia de ordenación</td></tr>
          <tr><td>dogs-view, litters-view, kennel-view</td><td>Preferencia de vista (cuadrícula/lista)</td></tr>
          <tr><td>genealogic-lang</td><td>Idioma seleccionado</td></tr>
          <tr><td>dismiss_*</td><td>Banners descartados</td></tr>
        </tbody>
      </table>
      <p>Estos datos se almacenan exclusivamente en tu dispositivo y no se transmiten a nuestros servidores.</p>

      <h3>2.3 Cookies de terceros</h3>
      <p>Actualmente <strong>no utilizamos cookies de seguimiento, analítica ni publicidad</strong>. No usamos Google Analytics ni servicios similares.</p>

      <h2>3. ¿Cómo gestionar las cookies?</h2>
      <p>Puedes configurar tu navegador para rechazar cookies o para que te avise cuando se envíen. Ten en cuenta que si desactivas las cookies de sesión, no podrás iniciar sesión en Genealogic.</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a></li>
      </ul>

      <h2>4. Contacto</h2>
      <p>Para cualquier consulta sobre cookies, escribe a <strong>gestion@manuelcurto.com</strong>.</p>
    </>
  )
}
