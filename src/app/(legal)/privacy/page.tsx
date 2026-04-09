export const metadata = { title: 'Política de Privacidad — Genealogic' }

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p><strong>Última actualización:</strong> 9 de abril de 2026</p>

      <h2>1. Responsable del Tratamiento</h2>
      <ul>
        <li><strong>Razón social:</strong> Manuel Curtó SL</li>
        <li><strong>CIF:</strong> B56932098</li>
        <li><strong>Domicilio:</strong> Camino Guillén s/n, 38290 La Esperanza, Tenerife, España</li>
        <li><strong>Email de contacto:</strong> gestion@manuelcurto.com</li>
        <li><strong>Delegado de Protección de Datos:</strong> gestion@manuelcurto.com</li>
      </ul>

      <h2>2. Datos que Recopilamos</h2>
      <h3>2.1 Datos proporcionados por el usuario</h3>
      <ul>
        <li><strong>Datos de registro:</strong> nombre, email, contraseña (encriptada)</li>
        <li><strong>Datos de perfil:</strong> nombre, teléfono, avatar, país, ciudad</li>
        <li><strong>Datos de perros:</strong> nombre, raza, color, fecha de nacimiento, genealogía, registros veterinarios, fotos</li>
        <li><strong>Datos de criadero:</strong> nombre del criadero, descripción, ubicación, redes sociales, WhatsApp</li>
        <li><strong>Datos de contactos (CRM):</strong> nombre, email, teléfono, ciudad, país de potenciales clientes</li>
        <li><strong>Mensajes:</strong> contenido de conversaciones entre usuarios</li>
        <li><strong>Datos de pago:</strong> procesados directamente por Stripe (no almacenamos datos de tarjeta)</li>
      </ul>

      <h3>2.2 Datos recopilados automáticamente</h3>
      <ul>
        <li><strong>Datos de uso:</strong> páginas visitadas, acciones realizadas</li>
        <li><strong>Datos del dispositivo:</strong> token de notificaciones push (identificador del dispositivo)</li>
        <li><strong>Cookies de sesión:</strong> necesarias para mantener la sesión iniciada</li>
      </ul>

      <h2>3. Finalidad del Tratamiento</h2>
      <table>
        <thead><tr><th>Finalidad</th><th>Base Legal</th></tr></thead>
        <tbody>
          <tr><td>Gestión de cuenta de usuario</td><td>Ejecución del contrato</td></tr>
          <tr><td>Gestión de perros y genealogías</td><td>Ejecución del contrato</td></tr>
          <tr><td>Procesamiento de pagos y suscripciones</td><td>Ejecución del contrato</td></tr>
          <tr><td>Envío de notificaciones push</td><td>Consentimiento</td></tr>
          <tr><td>Asistente de IA (Genos)</td><td>Ejecución del contrato</td></tr>
          <tr><td>Mensajería entre usuarios</td><td>Ejecución del contrato</td></tr>
          <tr><td>CRM y gestión de contactos comerciales</td><td>Interés legítimo</td></tr>
          <tr><td>Notificaciones de marketing y oportunidades</td><td>Interés legítimo (con opt-out)</td></tr>
          <tr><td>Formularios de contacto público</td><td>Consentimiento</td></tr>
        </tbody>
      </table>

      <h2>4. Encargados del Tratamiento (Terceros)</h2>
      <p>Compartimos datos con los siguientes proveedores, todos con acuerdos de procesamiento de datos (DPA):</p>
      <table>
        <thead><tr><th>Proveedor</th><th>Función</th><th>Ubicación</th></tr></thead>
        <tbody>
          <tr><td>Supabase Inc.</td><td>Base de datos, autenticación, almacenamiento</td><td>EE.UU. (cláusulas contractuales tipo)</td></tr>
          <tr><td>Vercel Inc.</td><td>Alojamiento web</td><td>EE.UU. (cláusulas contractuales tipo)</td></tr>
          <tr><td>Stripe Inc.</td><td>Procesamiento de pagos</td><td>EE.UU./Irlanda</td></tr>
          <tr><td>Anthropic PBC</td><td>Asistente de IA (Genos)</td><td>EE.UU. (cláusulas contractuales tipo)</td></tr>
          <tr><td>Apple Inc.</td><td>Notificaciones push (APNs)</td><td>EE.UU.</td></tr>
        </tbody>
      </table>
      <p>Las transferencias internacionales se realizan al amparo de cláusulas contractuales tipo aprobadas por la Comisión Europea (Art. 46.2.c RGPD).</p>

      <h2>5. Periodo de Conservación</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> mientras la cuenta esté activa + 30 días tras eliminación</li>
        <li><strong>Datos de perros:</strong> los perros con descendencia se anonimizan (no se eliminan) para preservar la integridad genealógica</li>
        <li><strong>Datos de pago:</strong> según obligaciones fiscales (5 años)</li>
        <li><strong>Mensajes:</strong> mientras exista la conversación o la cuenta</li>
        <li><strong>Logs de actividad:</strong> 12 meses</li>
      </ul>

      <h2>6. Derechos del Usuario</h2>
      <p>Puedes ejercer los siguientes derechos enviando un email a <strong>gestion@manuelcurto.com</strong>:</p>
      <ul>
        <li><strong>Acceso:</strong> obtener una copia de tus datos personales</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos</li>
        <li><strong>Supresión:</strong> eliminar tu cuenta y datos (disponible en Ajustes)</li>
        <li><strong>Portabilidad:</strong> descargar tus datos en formato estructurado (disponible en Ajustes)</li>
        <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo</li>
        <li><strong>Limitación:</strong> solicitar la limitación del tratamiento</li>
        <li><strong>Retirar consentimiento:</strong> en cualquier momento, sin efecto retroactivo</li>
      </ul>
      <p>También puedes presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noopener">www.aepd.es</a>.</p>

      <h2>7. Seguridad</h2>
      <p>Implementamos medidas técnicas y organizativas para proteger tus datos:</p>
      <ul>
        <li>Contraseñas encriptadas (hash bcrypt)</li>
        <li>Comunicaciones cifradas (HTTPS/TLS)</li>
        <li>Políticas de acceso a nivel de fila (RLS) en la base de datos</li>
        <li>Autenticación requerida en todos los endpoints de API</li>
        <li>Claves de API almacenadas de forma segura (no en el código fuente)</li>
      </ul>

      <h2>8. Menores</h2>
      <p>Genealogic no está dirigido a menores de 16 años. No recopilamos conscientemente datos de menores. Si detectamos que un menor ha proporcionado datos sin consentimiento parental, los eliminaremos.</p>

      <h2>9. Cambios en esta Política</h2>
      <p>Nos reservamos el derecho a modificar esta política. Notificaremos cambios significativos por email o mediante aviso en la plataforma. El uso continuado tras los cambios implica aceptación.</p>

      <h2>10. Contacto</h2>
      <p>Para cualquier consulta sobre privacidad, escribe a <strong>gestion@manuelcurto.com</strong>.</p>
    </>
  )
}
