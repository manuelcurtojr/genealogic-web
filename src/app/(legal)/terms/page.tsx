export const metadata = {
  title: 'Términos y Condiciones',
  description: 'Condiciones de uso de Genealogic, plataforma de Manuel Curtó SL.',
  alternates: { canonical: 'https://www.genealogic.io/terms' },
}

export default function TermsPage() {
  return (
    <>
      <h1>Términos y Condiciones de Uso</h1>
      <p><strong>Última actualización:</strong> 27 de mayo de 2026</p>
      <p>
        Estos Términos regulan el acceso y uso de Genealogic (en adelante, el "Servicio"
        o la "Plataforma"). Al registrarte o utilizar la Plataforma, aceptas estos Términos.
        Si no estás de acuerdo, no uses el Servicio.
      </p>

      <h2>1. Titularidad y Datos Identificativos</h2>
      <p>
        Genealogic es operado por <strong>Manuel Curtó SL</strong>, sociedad española
        con CIF B56932098, domicilio social en Camino Guillén s/n, 38290 La Esperanza,
        Tenerife (España), inscrita en el Registro Mercantil de Santa Cruz de Tenerife.
        Email de contacto: <strong>hola@genealogic.io</strong>.
      </p>

      <h2>2. Descripción del Servicio</h2>
      <p>
        Genealogic es una plataforma digital colaborativa que permite a propietarios y
        criadores de perros de raza:
      </p>
      <ul>
        <li>Registrar, consultar y compartir genealogías caninas.</li>
        <li>Importar genealogías desde fuentes públicas con asistencia de inteligencia artificial.</li>
        <li>Gestionar criaderos, camadas, reservas, contactos y registros veterinarios.</li>
        <li>Acceder a herramientas profesionales (CRM, web pública de criadero, contratos, mensajería).</li>
      </ul>
      <p>
        Genealogic <strong>no es un marketplace</strong> de venta de animales ni interviene
        en transacciones comerciales entre usuarios.
      </p>

      <h2>3. Naturaleza Jurídica del Servicio</h2>
      <p>
        Manuel Curtó SL actúa como <strong>prestador de servicios de la sociedad de la
        información y alojamiento de datos</strong> conforme al art. 13 y 16 de la Ley
        34/2002 LSSI-CE. No editamos ni controlamos previamente el contenido aportado
        por los Usuarios. Actuaremos para retirar contenidos ilícitos cuando tengamos
        conocimiento efectivo de su ilicitud, conforme al procedimiento descrito en la{' '}
        <a href="/ip-policy">Política de Propiedad Intelectual y Notice-and-Action</a>.
      </p>

      <h2>4. Registro, Cuenta y Edad Mínima</h2>
      <ul>
        <li>Debes ser mayor de <strong>14 años</strong> para registrarte (art. 7 LOPDGDD).</li>
        <li>La información facilitada en el registro debe ser veraz, exacta y actualizada.</li>
        <li>Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada bajo tu cuenta.</li>
        <li>Cada persona o entidad puede tener una sola cuenta personal. Una persona puede gestionar varias cuentas de criadero si tiene legitimación para ello.</li>
        <li>Nos reservamos el derecho a suspender o cancelar cuentas que incumplan estos Términos, con notificación previa razonable salvo en casos de incumplimiento grave.</li>
      </ul>

      <h2>5. Planes, Pagos y Facturación</h2>

      <h3>5.1 Planes disponibles</h3>
      <ul>
        <li><strong>Owner (gratuito, para siempre):</strong> perros ilimitados con ficha completa, genealogía sin límite de generaciones, importador IA, cartilla veterinaria, galería ilimitada y búsqueda pública. Sin tarjeta. Pensado para propietarios que documentan su mascota.</li>
        <li><strong>Kennel Free (gratuito, para siempre):</strong> perros ilimitados. Todo lo de Owner + perfil de criadero (página pública básica), camadas y marcar reproductores. Recibe solicitudes a través de su perfil (visualización del embudo limitada al número de solicitudes recibidas). Sin tarjeta. Pensado para el criador casero.</li>
        <li><strong>Kennel Pro (49 €/mes o 499 €/año, ahorro del 15%):</strong> perros ilimitados. Todo lo de Kennel Free + el panel completo de gestión: embudo de ventas completo, simulador de cruces, predicción de color por genotipos, estadísticas web y visitas del criadero, contactos (CRM), contratos con firma electrónica y soporte prioritario. <strong>14 días de prueba sin tarjeta</strong>; al finalizar la prueba se solicita método de pago para continuar.</li>
      </ul>
      <p>
        Los precios se muestran con IVA cuando aplicable. La disponibilidad y características
        concretas de cada plan pueden actualizarse; los cambios sustanciales se notifican
        con 30 días de antelación a los suscriptores existentes.
      </p>

      <h3>5.2 Procesamiento de pagos</h3>
      <p>
        Los pagos se procesan a través de <strong>Stripe Payments Europe Ltd</strong>.
        Genealogic no almacena ni accede a datos completos de tarjeta. Al introducir un
        método de pago, aceptas también los <a href="https://stripe.com/es/legal/end-users" target="_blank" rel="noopener">Términos de Stripe</a>.
      </p>

      <h3>5.3 Periodo de prueba (14 días, sólo Kennel Pro)</h3>
      <p>
        El plan <strong>Kennel Pro</strong> ofrece un periodo de prueba gratuito de{' '}
        <strong>14 días naturales</strong> para nuevos suscriptores, <strong>sin
        necesidad de registrar tarjeta</strong> al iniciar la prueba. Antes de que
        finalice el periodo te solicitaremos un método de pago para continuar; si no
        se facilita, la cuenta vuelve automáticamente a Kennel Free al término de la
        prueba, conservando íntegramente tus datos.
      </p>
      <p>
        Los planes <strong>Owner</strong> y <strong>Kennel Free</strong> son gratuitos
        de forma indefinida y no requieren periodo de prueba. Las{' '}
        <strong>extensiones de pago</strong> de Kennel Pro se contratan de forma
        opcional e independiente y se facturan por separado, sin periodo de prueba.
      </p>

      <h3>5.4 Renovación automática</h3>
      <p>
        Las suscripciones se renuevan automáticamente al final de cada periodo (mensual
        o anual) salvo cancelación previa. Recibirás un recordatorio por email antes de
        la renovación anual conforme al art. 62 TRLGDCU.
      </p>

      <h3>5.5 Derecho de desistimiento (consumidores)</h3>
      <p>
        Si actúas como consumidor (persona física, fuera de actividad profesional), tienes
        derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong>{' '}
        desde la contratación, sin necesidad de justificación, conforme al art. 102 TRLGDCU.
      </p>
      <p>
        Para ejercerlo, envía un email a <strong>hola@genealogic.io</strong> con el asunto
        "Desistimiento" indicando tu nombre y email de cuenta. Te reembolsaremos el importe
        en un plazo máximo de 14 días naturales, descontando proporcionalmente el uso del
        servicio si lo has activado expresamente antes del fin del plazo.
      </p>

      <h3>5.6 Cancelación y reembolsos</h3>
      <ul>
        <li>Puedes cancelar tu suscripción en cualquier momento desde Ajustes → Facturación.</li>
        <li>Tras el periodo de desistimiento, no se realizan reembolsos por periodos parciales (mensual o anual ya iniciado). Mantendrás el acceso hasta el final del periodo facturado.</li>
        <li>Excepciones razonables (fallo grave del servicio, cobro indebido) se atienden caso por caso.</li>
      </ul>

      <h3>5.7 Cobros fallidos</h3>
      <p>
        Si tras el periodo de prueba o en cualquier renovación posterior el cobro no puede
        realizarse, Stripe reintentará automáticamente. Si tras la cadena de reintentos
        el cobro sigue fallando, la suscripción se cancelará y tu cuenta volverá al plan
        Free, conservando íntegramente tus datos. Recibirás avisos por email.
      </p>

      <h2>6. Contenido del Usuario</h2>

      <h3>6.1 Propiedad del contenido</h3>
      <p>
        Mantienes la titularidad de todo el contenido que aportas a la Plataforma (fotos,
        textos, datos de perros, mensajes, archivos).
      </p>

      <h3>6.2 Licencia que nos concedes</h3>
      <p>
        Al aportar contenido, nos concedes una licencia no exclusiva, mundial, gratuita
        y revocable para almacenarlo, mostrarlo, distribuirlo en la Plataforma, hacer
        copias técnicas necesarias para su prestación, traducirlo automáticamente y
        utilizarlo de forma agregada y anonimizada con fines estadísticos y de mejora
        del servicio. Esta licencia se limita a lo estrictamente necesario para operar
        el Servicio y termina con la supresión del contenido.
      </p>

      <h3>6.3 Tus declaraciones y garantías al aportar contenido</h3>
      <p>Al subir o importar contenido, declaras y garantizas:</p>
      <ul>
        <li>Que eres titular del contenido o cuentas con licencia o autorización suficiente para subirlo.</li>
        <li>Que el contenido no infringe derechos de propiedad intelectual, marca, imagen, privacidad u otros derechos de terceros.</li>
        <li>Que en el caso de fotografías que no sean de tu autoría, dispones de la licencia o cesión del fotógrafo.</li>
        <li>Que los datos genealógicos que introduces son veraces hasta donde conoces.</li>
        <li>Que el contenido no es ilegal, difamatorio, discriminatorio, fraudulento ni promueve actividades ilegales.</li>
        <li>Que si introduces datos personales de terceros (criadores históricos, propietarios anteriores), tienes derecho a hacerlo y atenderás cualquier solicitud razonable de retirada.</li>
      </ul>
      <p>
        <strong>Eres responsable</strong> del contenido que aportas. Genealogic actúa como
        prestador de alojamiento y se reserva el derecho a retirar contenido que infrinja
        estos Términos cuando reciba notificación fundada.
      </p>

      <h3>6.4 Datos genealógicos y naturaleza colaborativa</h3>
      <p>
        Las genealogías caninas se componen de hechos (nombres, fechas, parentescos,
        criadores) que históricamente han sido aportados por múltiples colaboradores
        (clubes, criadores, propietarios). Estos hechos no son obras protegidas por
        derechos de autor en sí mismos. Cuando un Usuario importa la genealogía de su
        propio perro, declara tener derecho a hacerlo en virtud de su titularidad sobre
        el animal y sus documentos.
      </p>

      <h2>7. Importador de Genealogías</h2>
      <ul>
        <li>El importador permite extraer datos de páginas públicas que el Usuario pega como URL, de PDFs oficiales o de capturas de pantalla.</li>
        <li>La acción de importar la inicia siempre el Usuario, no la Plataforma. El Usuario es responsable de tener derecho a importar los datos.</li>
        <li>Genealogic respeta las políticas declaradas de los sitios web fuente, incluyendo los Content Signals publicados vía robots.txt. Las fuentes que prohíben expresamente el acceso automatizado por IA (p. ej., ingrus.net) no están soportadas; el Usuario puede subir manualmente captura o PDF si tiene derecho a los datos.</li>
        <li>El Usuario confirma siempre los datos extraídos antes de guardarlos.</li>
      </ul>

      <h2>8. Visibilidad Pública del Contenido</h2>
      <ul>
        <li>Los perros marcados como "públicos" son visibles para cualquier visitante de la Plataforma. Las genealogías derivadas (ancestros, descendientes) pueden ser visibles incluso cuando el perro propio no lo sea.</li>
        <li>Los perfiles de criadero son por defecto públicos para favorecer la trazabilidad y la reputación. Puedes solicitar la limitación de visibilidad escribiendo a hola@genealogic.io.</li>
        <li>Las contribuciones a perros sin propietario asignado (perros históricos contribuidos por la comunidad) son visibles para todos.</li>
        <li>El Usuario puede cambiar la visibilidad de los perros que controla en cualquier momento.</li>
      </ul>

      <h2>9. Mensajería y Comunicaciones</h2>
      <ul>
        <li>La mensajería entre usuarios es para comunicación relacionada con la crianza, reservas o consultas sobre perros. No se permite spam, acoso, contenido sexual no consentido ni ilegal.</li>
        <li>Los mensajes se almacenan cifrados en tránsito y solo son accesibles por los participantes; el equipo de Genealogic accede únicamente cuando es estrictamente necesario para resolver un reporte fundado o cumplir una obligación legal.</li>
        <li>Nos reservamos el derecho a moderar mensajes reportados conforme al procedimiento de notice-and-action.</li>
      </ul>

      <h2>10. Asistente de IA (Genos) y Otras Funciones IA</h2>
      <ul>
        <li>Genos es un asistente basado en inteligencia artificial (Anthropic Claude) que proporciona información sobre la Plataforma, la cría canina y los datos del Usuario.</li>
        <li>Las respuestas de Genos son orientativas. <strong>No constituyen asesoramiento veterinario, jurídico, fiscal ni profesional</strong>. Para decisiones importantes consulta a un profesional cualificado.</li>
        <li>Los mensajes enviados a Genos se procesan por Anthropic PBC bajo las condiciones de su API (sin uso para entrenamiento).</li>
      </ul>

      <h2>11. Uso Aceptable y Conductas Prohibidas</h2>
      <p>Queda expresamente prohibido:</p>
      <ul>
        <li>Usar la Plataforma para actividades ilegales o que infrinjan derechos de terceros.</li>
        <li>Intentar acceder a cuentas o datos de otros usuarios sin autorización.</li>
        <li>Realizar ingeniería inversa, scraping masivo, copia sistemática de la base de datos o intentos de extracción automatizada de partes sustanciales del contenido, salvo autorización expresa por escrito.</li>
        <li>Publicar información falsa sobre perros, genealogías, títulos o pruebas de salud.</li>
        <li>Usar la Plataforma para la venta de animales que no cumpla con la normativa aplicable (en particular, Ley 7/2023 de protección de los derechos y el bienestar de los animales y normativa autonómica equivalente).</li>
        <li>Crear múltiples cuentas para eludir límites del plan gratuito, bans o suspensiones.</li>
        <li>Cargar fotografías de las que no se tienen derechos, especialmente fotografías profesionales de exposiciones cuya licencia no autoriza publicación.</li>
        <li>Suplantar la identidad de otro criador, club, fotógrafo o persona.</li>
        <li>Distribuir malware, contenido pornográfico, terrorista o que apologice del maltrato animal.</li>
      </ul>

      <h2>12. Notice-and-Action (Procedimiento de Notificación y Retirada)</h2>
      <p>
        Cualquier persona puede notificarnos contenido infractor desde el botón "Reportar"
        presente en cada perro, foto y perfil de criadero, o escribiendo a{' '}
        <strong>hola@genealogic.io</strong>. Atenderemos las notificaciones en un plazo
        máximo de <strong>72 horas</strong> y retiraremos el contenido si la notificación
        es fundada conforme al art. 17 LSSI. Detalles completos en la{' '}
        <a href="/ip-policy">Política de Propiedad Intelectual y Notice-and-Action</a>.
      </p>

      <h2>13. Propiedad Intelectual de la Plataforma</h2>
      <p>
        La Plataforma Genealogic (código fuente, diseño, marca, logotipos, textos
        editoriales, base de datos como compilación) es titularidad de Manuel Curtó SL
        y/o sus respectivos titulares de derechos. La base de datos goza del derecho
        sui generis sobre bases de datos (arts. 133-137 LPI; Directiva 96/9/CE).
      </p>
      <p>
        Queda expresamente prohibido extraer o reutilizar partes sustanciales, evaluadas
        cualitativa o cuantitativamente, del contenido de la base de datos sin autorización
        expresa por escrito de Manuel Curtó SL. La extracción reiterada o sistemática
        de partes no sustanciales, contraria a una explotación normal de la base de datos,
        también está prohibida.
      </p>
      <p>
        El acceso individual a fichas concretas a través de la interfaz web, así como
        el enlazado a fichas concretas, está permitido y fomentado.
      </p>

      <h2>14. Limitación de Responsabilidad</h2>
      <ul>
        <li>El Servicio se proporciona "tal cual", sin garantías de disponibilidad ininterrumpida ni de ausencia de errores. Nos esforzamos por mantener una disponibilidad razonable y un servicio funcional.</li>
        <li>No somos responsables de la veracidad ni exactitud de los datos genealógicos, de salud o de cualquier otra naturaleza aportados por los Usuarios.</li>
        <li>No somos parte en las transacciones comerciales que los Usuarios realicen entre sí (venta de perros, prestación de servicios de stud, etc.); estas transacciones son acuerdos directos entre los Usuarios bajo su exclusiva responsabilidad.</li>
        <li>No somos responsables del uso indebido que terceros hagan del contenido público que los Usuarios decidan visibilizar.</li>
        <li>Salvo en supuestos de dolo, negligencia grave o cuando la ley imperativa lo impida, nuestra responsabilidad total agregada queda limitada al importe efectivamente pagado por el Usuario a Genealogic en los <strong>12 meses</strong> anteriores al hecho que origine la reclamación. Esta limitación no afecta a derechos imperativos de los consumidores.</li>
        <li>En ningún caso responderemos por daños indirectos, lucro cesante, pérdida de oportunidades comerciales o daños reputacionales derivados del uso del Servicio.</li>
      </ul>

      <h2>15. Suspensión y Cancelación de Cuenta</h2>
      <ul>
        <li>Podemos suspender o cancelar una cuenta que incumpla estos Términos, con notificación previa salvo casos urgentes.</li>
        <li>Puedes eliminar tu cuenta en cualquier momento desde Ajustes → Datos → Eliminar cuenta.</li>
        <li>Al eliminarse la cuenta, se borran o anonimizan tus datos personales, mensajes y configuraciones. Los datos genealógicos esenciales (parentescos, fechas) se anonimizan pero se conservan por interés legítimo de preservación del grafo.</li>
        <li>Los datos fiscales y contables se conservan según obligaciones legales (6 años Código de Comercio + 4 años LGT).</li>
      </ul>

      <h2>16. Cambios en los Términos</h2>
      <p>
        Podemos modificar estos Términos. Los cambios sustanciales se notificarán a los
        Usuarios registrados por email con al menos <strong>30 días</strong> de antelación.
        El uso continuado de la Plataforma tras la entrada en vigor implica aceptación.
        Si no estás de acuerdo, puedes cancelar tu cuenta sin penalización.
      </p>

      <h2>17. Cesión</h2>
      <p>
        Manuel Curtó SL podrá ceder el contrato y estos Términos a un tercero en el
        marco de una operación corporativa (fusión, escisión, venta de unidad de negocio,
        venta de activos), notificándolo a los Usuarios con al menos 30 días de antelación
        y respetando todos los derechos preexistentes. El Usuario consiente esta posible
        cesión. El Usuario no podrá ceder su cuenta a terceros sin autorización expresa.
      </p>

      <h2>18. Fuerza Mayor</h2>
      <p>
        Ninguna parte será responsable de los incumplimientos derivados de causas de
        fuerza mayor (catástrofes naturales, guerras, ciberataques masivos, fallos
        prolongados de proveedores esenciales, decisiones de autoridades públicas) que
        impidan razonablemente la prestación del Servicio.
      </p>

      <h2>19. Ley Aplicable y Jurisdicción</h2>
      <p>
        Estos Términos se rigen por la legislación española y, en su caso, la normativa
        de la Unión Europea. Para la resolución de controversias, las partes se someten
        a los <strong>Juzgados y Tribunales de Santa Cruz de Tenerife</strong>, sin
        perjuicio de los derechos que asisten al consumidor conforme al TRLGDCU
        (especialmente el derecho a litigar en su domicilio).
      </p>
      <p>
        Si actúas como consumidor, puedes acceder a la plataforma europea de resolución
        de litigios en línea:{' '}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr/</a>.
      </p>

      <h2>20. Nulidad Parcial</h2>
      <p>
        Si alguna cláusula de estos Términos fuera declarada nula o inaplicable por una
        autoridad competente, el resto seguirá plenamente vigente. Las partes se
        comprometen a sustituir la cláusula nula por otra equivalente conforme a derecho.
      </p>

      <h2>21. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos:{' '}
        <strong>hola@genealogic.io</strong>. Por correo postal: Manuel Curtó SL, Camino
        Guillén s/n, 38290 La Esperanza, Tenerife (España).
      </p>
    </>
  )
}
