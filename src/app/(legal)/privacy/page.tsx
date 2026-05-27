export const metadata = {
  title: 'Política de Privacidad — Genealogic',
  description: 'Cómo Genealogic (Manuel Curtó SL) trata tus datos personales conforme al RGPD y la LOPDGDD.',
  alternates: { canonical: 'https://genealogic.io/privacy' },
}

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p><strong>Última actualización:</strong> 27 de mayo de 2026</p>
      <p>
        En Genealogic nos tomamos en serio la protección de tus datos personales. Esta política
        explica qué datos recopilamos, por qué los recopilamos, con quién los compartimos, durante
        cuánto tiempo los conservamos y qué derechos tienes sobre ellos, conforme al Reglamento
        (UE) 2016/679 (RGPD), la Ley Orgánica 3/2018 (LOPDGDD) y la Ley 34/2002 (LSSI-CE).
      </p>

      <h2>1. Responsable del Tratamiento</h2>
      <ul>
        <li><strong>Razón social:</strong> Manuel Curtó SL</li>
        <li><strong>CIF:</strong> B56932098</li>
        <li><strong>Domicilio:</strong> Camino Guillén s/n, 38290 La Esperanza, Tenerife, España</li>
        <li><strong>Inscrita en:</strong> Registro Mercantil de Santa Cruz de Tenerife</li>
        <li><strong>Email de contacto:</strong> hola@genealogic.io</li>
        <li><strong>Email para asuntos de protección de datos:</strong> hola@genealogic.io</li>
      </ul>
      <p>
        No hemos designado formalmente un Delegado de Protección de Datos (DPO) por no concurrir
        las circunstancias del art. 37 RGPD. Para cualquier asunto relativo a tus datos, escribe
        a hola@genealogic.io.
      </p>

      <h2>2. Datos que Recopilamos</h2>

      <h3>2.1 Datos que tú nos proporcionas</h3>
      <ul>
        <li><strong>Datos de registro:</strong> nombre, email y contraseña (almacenada con hash bcrypt; nunca tenemos acceso a la contraseña en claro).</li>
        <li><strong>Datos de perfil:</strong> nombre completo, teléfono, avatar, país, ciudad, idioma.</li>
        <li><strong>Datos de criadero:</strong> nombre del afijo, descripción, ubicación, redes sociales, web, WhatsApp, configuración del formulario de contacto, dominio personalizado.</li>
        <li><strong>Datos de perros:</strong> nombre, raza, color, sexo, fecha de nacimiento, número de registro, microchip, peso, altura, genealogía, datos de salud, fotos, documentos veterinarios.</li>
        <li><strong>Datos de camadas y reservas:</strong> fechas, número de cachorros, lista de reservas, contactos.</li>
        <li><strong>Datos de contactos (CRM):</strong> nombre, email, teléfono, ciudad, país de potenciales clientes y leads.</li>
        <li><strong>Mensajes:</strong> contenido de las conversaciones que mantienes con otros usuarios y con el asistente IA (Genos).</li>
        <li><strong>Datos de facturación:</strong> nombre fiscal, NIF/CIF, dirección de facturación. <strong>Los datos de tarjeta los procesa directamente Stripe; Genealogic nunca los almacena ni los ve.</strong></li>
        <li><strong>Reportes de contenido:</strong> si reportas contenido en la plataforma (notice-and-action), guardamos tu email, el motivo y la descripción que aportes.</li>
      </ul>

      <h3>2.2 Datos recopilados automáticamente</h3>
      <ul>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, idioma del dispositivo.</li>
        <li><strong>Datos de uso:</strong> páginas visitadas, acciones realizadas, fecha y hora.</li>
        <li><strong>Datos del dispositivo:</strong> token de notificaciones push (identificador anónimo del dispositivo).</li>
        <li><strong>Cookies estrictamente necesarias:</strong> ver <a href="/cookies">Política de Cookies</a>.</li>
        <li><strong>Datos de campañas:</strong> UTM parameters, referrer, landing page (si llegaste por un enlace de marketing).</li>
      </ul>

      <h3>2.3 Datos sobre terceros que tú nos proporcionas</h3>
      <p>
        Cuando importas una genealogía o añades manualmente datos genealógicos, puedes estar
        introduciendo datos sobre terceros (otros criadores, propietarios anteriores). Estos
        datos son hechos genealógicos públicos extraídos de registros oficiales o de fuentes
        comunitarias. Al introducirlos, garantizas que tienes derecho a hacerlo y que la
        información es veraz. Cualquier persona puede solicitar la rectificación o supresión
        de sus datos contactando a hola@genealogic.io.
      </p>

      <h2>3. Finalidades del Tratamiento y Base Legal</h2>
      <table>
        <thead>
          <tr><th>Finalidad</th><th>Base Legal (art. 6 RGPD)</th></tr>
        </thead>
        <tbody>
          <tr><td>Gestión de cuenta y autenticación</td><td>Ejecución del contrato (art. 6.1.b)</td></tr>
          <tr><td>Gestión de perros, camadas, genealogías y CRM</td><td>Ejecución del contrato (art. 6.1.b)</td></tr>
          <tr><td>Procesamiento de pagos y suscripciones</td><td>Ejecución del contrato (art. 6.1.b)</td></tr>
          <tr><td>Cumplimiento de obligaciones fiscales y contables</td><td>Obligación legal (art. 6.1.c)</td></tr>
          <tr><td>Notificaciones push</td><td>Consentimiento (art. 6.1.a)</td></tr>
          <tr><td>Asistente de IA (Genos)</td><td>Ejecución del contrato (art. 6.1.b)</td></tr>
          <tr><td>Mensajería entre usuarios</td><td>Ejecución del contrato (art. 6.1.b)</td></tr>
          <tr><td>Newsletter y marketing directo a usuarios existentes</td><td>Interés legítimo (art. 6.1.f) con opt-out</td></tr>
          <tr><td>Newsletter a no usuarios</td><td>Consentimiento (art. 6.1.a)</td></tr>
          <tr><td>Detección de fraude, seguridad y prevención de abuso</td><td>Interés legítimo (art. 6.1.f)</td></tr>
          <tr><td>Resolución de reportes (notice-and-action)</td><td>Obligación legal (art. 6.1.c) + interés legítimo</td></tr>
          <tr><td>Estadísticas agregadas y mejora del producto</td><td>Interés legítimo (art. 6.1.f)</td></tr>
        </tbody>
      </table>

      <h2>4. Encargados del Tratamiento (Sub-procesadores)</h2>
      <p>
        Compartimos datos personales con los siguientes proveedores únicamente para los fines
        descritos. Todos están sujetos a contratos de encargo de tratamiento (DPA) conforme al
        art. 28 RGPD. Las transferencias internacionales se realizan al amparo de las cláusulas
        contractuales tipo (SCC) aprobadas por la Comisión Europea (Decisión 2021/914), o de
        marcos equivalentes vigentes.
      </p>
      <table>
        <thead>
          <tr><th>Proveedor</th><th>Función</th><th>Ubicación de tratamiento</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase Inc.</td><td>Base de datos, autenticación, almacenamiento de archivos</td><td>UE (Frankfurt) — datos almacenados en territorio UE</td></tr>
          <tr><td>Vercel Inc.</td><td>Alojamiento web y serverless</td><td>EE.UU. — SCC + DPF</td></tr>
          <tr><td>Stripe Payments Europe Ltd</td><td>Procesamiento de pagos y datos de tarjeta</td><td>Irlanda (UE) / EE.UU. — SCC</td></tr>
          <tr><td>Anthropic PBC</td><td>Asistente de IA (Genos), parseo de genealogías</td><td>EE.UU. — SCC. Anthropic NO usa los datos para entrenar modelos por defecto en planes API.</td></tr>
          <tr><td>Resend (Drift Inc.)</td><td>Envío de emails transaccionales</td><td>EE.UU. — SCC</td></tr>
          <tr><td>Apple Inc.</td><td>Notificaciones push (APNs)</td><td>EE.UU. — SCC</td></tr>
          <tr><td>ScrapingBee SAS</td><td>Proxy técnico para acceso a páginas públicas durante el importador</td><td>UE (Francia)</td></tr>
          <tr><td>Sentry (Functional Software Inc.)</td><td>Monitorización de errores técnicos</td><td>EE.UU. — SCC. Datos personales mínimos (IP, error stack).</td></tr>
        </tbody>
      </table>
      <p>
        La lista de sub-procesadores puede actualizarse. Si añadimos uno nuevo que implique
        un cambio sustancial, te notificaremos por email con al menos 30 días de antelación
        para que puedas oponerte.
      </p>

      <h2>5. Período de Conservación</h2>
      <ul>
        <li><strong>Datos de cuenta activa:</strong> mientras la cuenta esté activa.</li>
        <li><strong>Tras la baja:</strong> 30 días en estado anonimizable; transcurrido ese plazo se eliminan o anonimizan irreversiblemente.</li>
        <li><strong>Datos de perros con descendencia registrada:</strong> se anonimizan (nombre, criador, datos personales) pero <strong>los datos genealógicos no personales (parentescos, fechas, raza) se conservan indefinidamente</strong> como hechos históricos necesarios para preservar la integridad del grafo genealógico, base sobre la que descansa el servicio.</li>
        <li><strong>Datos fiscales y contables:</strong> 6 años (art. 30 Código de Comercio + 4 años LGT).</li>
        <li><strong>Comunicaciones contractuales (emails, facturas):</strong> 5 años desde la última transacción.</li>
        <li><strong>Logs de seguridad y accesos:</strong> 12 meses.</li>
        <li><strong>Reportes de contenido:</strong> 3 años desde su resolución, para acreditar diligencia ante posibles reclamaciones.</li>
        <li><strong>Datos de marketing (newsletter no usuarios):</strong> hasta que retires el consentimiento.</li>
      </ul>

      <h2>6. Tus Derechos</h2>
      <p>
        En cumplimiento de los arts. 15-22 RGPD, tienes los siguientes derechos respecto a tus
        datos personales:
      </p>
      <ul>
        <li><strong>Acceso (art. 15):</strong> obtener confirmación y copia de los datos que tratamos.</li>
        <li><strong>Rectificación (art. 16):</strong> corregir datos inexactos o incompletos.</li>
        <li><strong>Supresión / derecho al olvido (art. 17):</strong> que eliminemos tus datos cuando ya no sean necesarios o retires el consentimiento. Limitación: datos genealógicos esenciales se anonimizan, no se borran físicamente, por interés legítimo prevalente (preservación de la integridad del grafo).</li>
        <li><strong>Limitación del tratamiento (art. 18):</strong> que lo restrinjamos en supuestos tasados.</li>
        <li><strong>Portabilidad (art. 20):</strong> recibir tus datos en formato estructurado (JSON/CSV). Disponible desde Ajustes → Datos → Exportar.</li>
        <li><strong>Oposición (art. 21):</strong> oponerte al tratamiento basado en interés legítimo.</li>
        <li><strong>Decisiones automatizadas (art. 22):</strong> no tomamos decisiones que produzcan efectos jurídicos basadas únicamente en tratamiento automatizado.</li>
        <li><strong>Retirar el consentimiento</strong> en cualquier momento, sin efecto retroactivo.</li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, envía un email a <strong>hola@genealogic.io</strong>{' '}
        identificándote suficientemente (podemos pedir copia parcial de DNI si no podemos verificar
        tu identidad de otro modo). Responderemos en un plazo máximo de <strong>30 días naturales</strong>{' '}
        (ampliables a 60 en casos complejos, con notificación previa).
      </p>
      <p>
        Si consideras que el tratamiento de tus datos no se ajusta a la normativa, puedes
        presentar una reclamación ante la <strong>Agencia Española de Protección de Datos
        (AEPD)</strong> en{' '}
        <a href="https://www.aepd.es" target="_blank" rel="noopener">www.aepd.es</a> (C/ Jorge
        Juan, 6, 28001 Madrid).
      </p>

      <h2>7. Datos de Terceros y Genealogías</h2>
      <p>
        Genealogic es un registro genealógico colaborativo. Las genealogías caninas son
        compilaciones de hechos (nombres de perros, parentescos, fechas, criadores) que
        históricamente han sido aportadas por múltiples colaboradores (clubes, criadores,
        propietarios). Estos hechos no son, por sí mismos, datos personales sujetos a
        copyright o derecho de exclusiva, pero pueden contener datos personales cuando se
        menciona el nombre de un criador identificable.
      </p>
      <p>
        Si apareces como criador o propietario en una ficha y deseas que retiremos tu nombre,
        envía un email a <strong>hola@genealogic.io</strong> indicando el perro o perros
        afectados. Procederemos a la anonimización ("Criador histórico") en un plazo máximo
        de 30 días, conservando los datos genealógicos pero retirando la identificación
        personal, conforme al art. 17 RGPD.
      </p>

      <h2>8. Reportar Contenido / Notice-and-Action</h2>
      <p>
        Disponemos de un mecanismo de notificación y actuación para que cualquier persona
        (incluidos titulares de derechos de propiedad intelectual y titulares de datos
        personales) pueda reportarnos contenido infractor. Encontrarás el botón "Reportar"
        en cada perro, foto y perfil de criadero, o puedes escribir directamente a
        <strong> hola@genealogic.io</strong>.
      </p>
      <p>
        Ver detalles en nuestra <a href="/ip-policy">Política de Propiedad Intelectual y Notice-and-Action</a>.
      </p>

      <h2>9. Seguridad</h2>
      <p>Aplicamos medidas técnicas y organizativas razonables conforme al art. 32 RGPD:</p>
      <ul>
        <li>Cifrado en tránsito (TLS 1.2+) y cifrado en reposo de la base de datos.</li>
        <li>Contraseñas almacenadas exclusivamente como hash (bcrypt).</li>
        <li>Políticas de control de acceso a nivel de fila (Row Level Security) en la base de datos.</li>
        <li>Autenticación obligatoria en todos los endpoints sensibles.</li>
        <li>Claves de API y secretos almacenados en gestores seguros, fuera del repositorio de código.</li>
        <li>Logs de auditoría de acciones administrativas críticas.</li>
        <li>Backups periódicos cifrados.</li>
        <li>Procedimiento documentado de respuesta a incidentes y notificación a la AEPD en plazo de 72h en caso de brecha (art. 33 RGPD).</li>
      </ul>

      <h2>10. Decisiones Automatizadas e Inteligencia Artificial</h2>
      <p>
        Algunas funcionalidades de Genealogic emplean inteligencia artificial:
      </p>
      <ul>
        <li><strong>Genos (asistente IA):</strong> usa modelos de Anthropic (Claude) para responder preguntas. Las conversaciones se procesan en servidores de Anthropic en EE.UU. bajo cláusulas SCC. Anthropic no utiliza las consultas para entrenar modelos.</li>
        <li><strong>Importador de genealogías:</strong> usa IA para extraer datos estructurados de páginas públicas o documentos que tú aportas. Tú confirmas siempre el resultado antes de guardarlo.</li>
        <li><strong>Emailbot (Pro):</strong> los emails entrantes pueden ser parseados por modelos de Anthropic/OpenAI/Google para sugerir respuestas. Tú revisas y apruebas cada respuesta antes de enviarla.</li>
        <li><strong>Antifraude y rate-limit:</strong> tratamiento automatizado para detectar abuso. No produce efectos jurídicos sobre el usuario más allá de ralentizar o bloquear acciones técnicas.</li>
      </ul>
      <p>
        No realizamos perfilado con efectos jurídicos sobre el usuario. No tomamos
        decisiones automatizadas que afecten significativamente al usuario sin intervención
        humana.
      </p>

      <h2>11. Menores</h2>
      <p>
        Genealogic no está dirigido a menores de 14 años (umbral español del art. 7 LOPDGDD).
        No recopilamos conscientemente datos de menores de 14. Si detectamos que se ha creado
        una cuenta por un menor, la suspenderemos y eliminaremos los datos. Si eres tutor
        legal y crees que un menor a tu cargo ha facilitado datos sin consentimiento,
        contáctanos en hola@genealogic.io.
      </p>

      <h2>12. Transferencias Internacionales</h2>
      <p>
        Algunos sub-procesadores tratan datos fuera del Espacio Económico Europeo (EE.UU.).
        Estas transferencias se amparan en:
      </p>
      <ul>
        <li>Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea — Decisión (UE) 2021/914.</li>
        <li>EU-US Data Privacy Framework (DPF), cuando el proveedor está adherido.</li>
        <li>Medidas suplementarias contractuales y técnicas (cifrado, minimización, control de acceso).</li>
      </ul>
      <p>
        Puedes solicitarnos copia de las salvaguardas concretas aplicables a una transferencia
        específica escribiendo a hola@genealogic.io.
      </p>

      <h2>13. Cambios en esta Política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios legales o de servicio. Te
        notificaremos por email los cambios sustanciales con al menos <strong>15 días</strong>{' '}
        de antelación. Los cambios menores (correcciones, aclaraciones) se publican
        directamente. La fecha de "última actualización" arriba indica la versión vigente.
      </p>

      <h2>14. Contacto</h2>
      <p>
        Para cualquier consulta sobre privacidad y protección de datos, escribe a{' '}
        <strong>hola@genealogic.io</strong>. Si lo prefieres por correo postal: Manuel
        Curtó SL, Camino Guillén s/n, 38290 La Esperanza, Tenerife (España).
      </p>
    </>
  )
}
