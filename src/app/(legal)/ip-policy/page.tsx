export const metadata = {
  title: 'Política de Propiedad Intelectual y Notice-and-Action — Genealogic',
  description: 'Cómo reportar contenido infractor (copyright, datos personales, suplantación) y procedimiento de retirada en Genealogic.',
  alternates: { canonical: 'https://www.genealogic.io/ip-policy' },
}

export default function IpPolicyPage() {
  return (
    <>
      <h1>Política de Propiedad Intelectual y Notice-and-Action</h1>
      <p><strong>Última actualización:</strong> 27 de mayo de 2026</p>
      <p>
        Esta política describe (i) los principios que rigen la propiedad intelectual y el
        tratamiento de los datos genealógicos en Genealogic, (ii) el procedimiento de
        notificación y retirada de contenidos infractores ("notice-and-action") y
        (iii) los compromisos de Manuel Curtó SL como prestador de servicios de la sociedad
        de la información conforme a la LSSI-CE, la Ley de Propiedad Intelectual (LPI), el
        RGPD y el Reglamento (UE) 2022/2065 (DSA).
      </p>

      <h2>1. Principios sobre Propiedad Intelectual en Genealogic</h2>

      <h3>1.1 Los datos genealógicos son hechos</h3>
      <p>
        Las genealogías caninas se componen de hechos verificables: el nombre de un perro,
        su fecha de nacimiento, su raza, su ascendencia, su criador o sus títulos en
        exposiciones. Los hechos como tales no son obras protegidas por el derecho de autor
        (art. 10 LPI; doctrina europea reiterada). Su recopilación sí puede gozar del
        derecho sui generis sobre bases de datos (arts. 133-137 LPI; Directiva 96/9/CE)
        cuando media una inversión sustancial.
      </p>

      <h3>1.2 Naturaleza colaborativa del registro</h3>
      <p>
        Genealogic es un registro colaborativo: los datos los aportan los Usuarios
        (criadores, propietarios, contribuidores históricos). El servicio actúa como
        compilador y custodio, no como autor de los hechos genealógicos. Esto distingue a
        Genealogic de un repositorio editorial.
      </p>

      <h3>1.3 Fotografías y materiales audiovisuales</h3>
      <p>
        A diferencia de los datos genealógicos, las fotografías sí gozan de protección por
        derecho de autor (art. 10.1.h LPI o, en su caso, art. 128 LPI cuando se trata de
        meras fotografías). El titular originario es el fotógrafo, salvo cesión.
      </p>
      <p>
        Quien sube una fotografía a Genealogic <strong>declara y garantiza ser titular
        de los derechos o contar con licencia suficiente</strong> para su publicación. El
        titular legítimo de cualquier fotografía publicada en Genealogic puede solicitar
        su retirada mediante el procedimiento descrito en el apartado 3.
      </p>

      <h3>1.4 La Plataforma Genealogic</h3>
      <p>
        El código fuente, el diseño, los textos editoriales, la marca y los logotipos de
        Genealogic son titularidad de Manuel Curtó SL. La base de datos como compilación
        goza del derecho sui generis. Está prohibida la extracción o reutilización de
        partes sustanciales sin autorización expresa, así como la extracción reiterada y
        sistemática contraria a la explotación normal de la base.
      </p>

      <h2>2. Importador de Genealogías — Política de Respeto a Terceros</h2>
      <p>
        El importador de Genealogic permite extraer datos de páginas públicas mediante
        URL aportada por el Usuario, archivos PDF o capturas de pantalla. Aplicamos las
        siguientes salvaguardas:
      </p>
      <ul>
        <li><strong>Acción iniciada por el Usuario</strong>: la importación la dispara siempre el Usuario, no la Plataforma. El Usuario es responsable de tener derecho a importar los datos del perro.</li>
        <li><strong>Respeto de robots.txt y Content Signals</strong>: las fuentes que prohíben expresamente el acceso automatizado por bots de inteligencia artificial (p. ej., <code>ingrus.net</code>) <strong>no están soportadas</strong>. El Usuario puede importar manualmente vía screenshot o PDF si dispone de los datos de su propio perro.</li>
        <li><strong>Confirmación del usuario</strong>: los datos extraídos se muestran en pantalla y el Usuario debe confirmarlos antes de guardarlos.</li>
        <li><strong>Rate-limit y user-agent honesto</strong>: nuestros accesos se identifican y respetan límites razonables de petición.</li>
        <li><strong>Atribución</strong>: cuando técnicamente posible, conservamos referencia al origen de la importación.</li>
      </ul>
      <p>
        Los operadores de fuentes externas pueden contactar con nosotros en{' '}
        <strong>hola@genealogic.io</strong> para acordar políticas de uso, colaboraciones
        o cualquier solicitud relativa a sus contenidos.
      </p>

      <h2>3. Procedimiento de Notificación y Retirada (Notice-and-Action)</h2>
      <p>
        Manuel Curtó SL pondrá los medios para retirar o anonimizar contenidos ilícitos
        cuando reciba notificación fundada conforme al art. 16-17 LSSI, art. 14 DSA, art.
        17 LPI o art. 17 RGPD, según el caso.
      </p>

      <h3>3.1 Quién puede reportar</h3>
      <ul>
        <li><strong>Cualquier Usuario</strong> de la Plataforma puede reportar contenidos mediante el botón "Reportar" presente en fichas de perro, fotografías individuales y perfiles de criadero.</li>
        <li><strong>Cualquier tercero</strong> (incluidos fotógrafos, criadores no usuarios y titulares de derechos) puede reportar contenido sin necesidad de cuenta, mediante el mismo botón o escribiendo a <strong>hola@genealogic.io</strong>.</li>
      </ul>

      <h3>3.2 Información necesaria en la notificación</h3>
      <p>Para que podamos atender una notificación, esta debe incluir:</p>
      <ol>
        <li><strong>Identificación del notificante</strong>: nombre y email de contacto. Si actúa como representante del titular de derechos, indicación del título de representación.</li>
        <li><strong>Identificación precisa del contenido</strong>: URL, identificador del perro, foto o perfil reportado.</li>
        <li><strong>Motivo</strong>: copyright, datos personales (RGPD), información incorrecta, suplantación, contenido inapropiado, bienestar animal, duplicado u otro.</li>
        <li><strong>Descripción de los hechos</strong>: explicación de por qué el contenido es infractor (mínimo 10 caracteres).</li>
        <li><strong>Si reclamas derechos de autor</strong>: declaración de buena fe de ser titular de los derechos (o representar al titular), de que el uso no está autorizado y de que la información es exacta, asumiendo la responsabilidad civil o penal derivada de declaraciones falsas (formulario "Reportar" → categoría "Infracción de copyright" → marcar declaración).</li>
        <li><strong>Si reclamas datos personales</strong>: confirmación de que los datos son tuyos o de la persona a la que representas.</li>
      </ol>

      <h3>3.3 Plazos de respuesta</h3>
      <ul>
        <li><strong>Acuse de recibo</strong>: automático al enviar el formulario o, si se envía por email, en un plazo máximo de 24 horas.</li>
        <li><strong>Resolución</strong>: máximo <strong>72 horas naturales</strong> desde la recepción de la notificación completa, salvo casos especialmente complejos en los que el plazo se ampliará justificadamente, comunicándolo al notificante.</li>
        <li><strong>Notificación al afectado</strong>: cuando proceda retirar contenido, lo notificaremos al usuario que lo aportó indicando el motivo (sin revelar la identidad del notificante cuando proteger su anonimato sea razonable).</li>
      </ul>

      <h3>3.4 Acciones posibles</h3>
      <p>En función del análisis, podemos:</p>
      <ul>
        <li><strong>Retirar</strong> el contenido (eliminación efectiva).</li>
        <li><strong>Anonimizar</strong> (sustituir el nombre del criador, ocultar foto, etc.).</li>
        <li><strong>Restringir</strong> la visibilidad (perfil privado, no indexable).</li>
        <li><strong>Mantener</strong> el contenido si la notificación carece de fundamento, motivando la decisión al notificante.</li>
        <li><strong>Suspender la cuenta</strong> que ha aportado contenido infractor reiterado.</li>
      </ul>

      <h3>3.5 Contra-notificación</h3>
      <p>
        El Usuario cuyo contenido haya sido retirado puede presentar una contra-notificación
        en el plazo de 30 días desde la retirada, dirigida a hola@genealogic.io, indicando
        las razones por las que considera que el contenido no era infractor. Analizaremos
        la contra-notificación y, si procede, restableceremos el contenido, comunicándolo
        a ambas partes.
      </p>

      <h3>3.6 Reportes infundados o malintencionados</h3>
      <p>
        Los reportes manifiestamente infundados, los presentados con mala fe o de manera
        reiteradamente abusiva podrán dar lugar a la suspensión de la cuenta del notificante
        o a las acciones legales que correspondan.
      </p>

      <h2>4. Datos Personales en las Genealogías (RGPD)</h2>
      <p>
        Cuando un perro tiene como criador identificable a una persona física cuyo nombre
        aparece en la ficha, ese nombre es un dato personal protegido por el RGPD. El
        titular del dato puede:
      </p>
      <ul>
        <li><strong>Ejercer su derecho de supresión</strong> (art. 17 RGPD) — escribir a hola@genealogic.io. Procederemos a la anonimización ("Criador histórico", "Propietario anterior") manteniendo el resto de datos genealógicos por interés legítimo de preservación del grafo.</li>
        <li><strong>Ejercer rectificación</strong> si el nombre o datos son inexactos.</li>
      </ul>
      <p>
        Estas solicitudes se gestionan conforme a la{' '}
        <a href="/privacy">Política de Privacidad</a> y dentro de los plazos legales (30
        días, ampliables a 60 en casos complejos).
      </p>

      <h2>5. Derecho al Olvido y Decisiones Conexas</h2>
      <p>
        Genealogic equilibra el derecho a la protección de datos personales con el interés
        legítimo de la comunidad cinófila en la preservación del registro genealógico. En
        casos en que ambos derechos colisionen, se aplicará el test de proporcionalidad
        (art. 21 RGPD) y se documentará la decisión.
      </p>

      <h2>6. Marca y Signos Distintivos</h2>
      <p>
        Los signos "Genealogic", el logotipo y la imagen institucional son marca de Manuel
        Curtó SL. Su uso sin autorización está prohibido. Para colaboraciones, integraciones
        o solicitudes de uso de marca, contactar a hola@genealogic.io.
      </p>

      <h2>7. Sub-procesadores y Cesión a Terceros</h2>
      <p>
        Los reportes recibidos pueden ser tratados por los sub-procesadores listados en la{' '}
        <a href="/privacy">Política de Privacidad</a> (Supabase, Vercel, Resend) en su
        condición de proveedores técnicos. No cedemos los reportes a terceros ajenos al
        servicio salvo obligación legal o requerimiento judicial.
      </p>

      <h2>8. Punto de Contacto Único</h2>
      <p>
        Conforme al art. 11 DSA, el punto de contacto único para autoridades y para
        notificantes de contenidos es:
      </p>
      <ul>
        <li><strong>Email:</strong> hola@genealogic.io</li>
        <li><strong>Idioma:</strong> español, inglés.</li>
        <li><strong>Plazo de respuesta a autoridades:</strong> conforme al requerimiento; en general, 48 horas hábiles.</li>
        <li><strong>Plazo de respuesta a notificantes:</strong> 72 horas (ver apartado 3.3).</li>
      </ul>

      <h2>9. Cambios en esta Política</h2>
      <p>
        Esta política puede actualizarse para reflejar cambios legales o de procedimiento.
        La fecha de "última actualización" indica la versión vigente. Los cambios
        sustanciales se anunciarán por email a los Usuarios registrados.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Para reportes y consultas sobre esta política:{' '}
        <strong>hola@genealogic.io</strong>. Por correo postal: Manuel Curtó SL, Camino
        Guillén s/n, 38290 La Esperanza, Tenerife (España).
      </p>
    </>
  )
}
