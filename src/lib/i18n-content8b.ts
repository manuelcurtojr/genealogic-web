// i18n content pack 8b — language-leak cleanup (dashboard/varios restos)
// Fugas de español hardcodeado en JSX que ahora van envueltas en t().
// Clave = español EXACTO (como aparece en el componente). 'es' es la base.
//
// Cubre: components/ui (sort-select, coming-soon, cookie-banner, lightbox,
// searchable-select), components/onboarding (onboarding-card),
// components/legal (legal-sidebar, legal-hero, legal-footer-nav, report-dialog),
// components/content-reports (report-admin-actions),
// components/kennel (kennel-legal-editor), app/reclamar/*, app/newsletter/unsubscribe.

export const content8bDash: Record<string, Record<string, string>> = {
  en: {
    // ─── ui/sort-select ───
    'Últimos modificados': 'Recently updated',
    'Últimos añadidos': 'Recently added',
    'Alfabéticamente': 'Alphabetically',

    // ─── ui/coming-soon ───
    'Tier Pro': 'Pro tier',
    'Qué tendrá esta página': 'What this page will have',
    'Volver al escritorio': 'Back to dashboard',

    // ─── ui/cookie-banner ───
    'Usamos cookies esenciales para el funcionamiento de la plataforma. No usamos cookies de seguimiento ni publicidad.':
      'We use essential cookies for the platform to work. We don\'t use tracking or advertising cookies.',
    'Más información': 'Learn more',
    'Rechazar': 'Reject',

    // ─── ui/lightbox ───
    'Descargar': 'Download',
    'Vista previa no disponible': 'Preview not available',
    'Descargar archivo': 'Download file',

    // ─── kennel/kennel-legal-editor (markdown hint) ───
    'negrita': 'bold',

    // ─── onboarding/onboarding-card ───
    '¡Tu criadero está listo!': 'Your kennel is ready!',
    'pasos del onboarding. Genealogic está optimizado para que vendas más con menos esfuerzo.':
      'onboarding steps. Genealogic is built to help you sell more with less effort.',
    'Pon tu criadero a funcionar': 'Get your kennel up and running',
    'Ocultar (no volver a mostrar)': 'Hide (don\'t show again)',

    // ─── legal/legal-sidebar + legal-hero (chrome) ───
    'Documentación legal': 'Legal documentation',
    'Documentación': 'Documentation',
    'Legal y privacidad': 'Legal & privacy',
    'Toda la información jurídica de Genealogic en un solo sitio.':
      'All of Genealogic\'s legal information in one place.',
    '¿Algo que reportar?': 'Something to report?',
    'Si has detectado contenido infractor o quieres ejercer un derecho RGPD, escríbenos. Respondemos en menos de 72 horas.':
      'If you\'ve found infringing content or want to exercise a GDPR right, get in touch. We reply within 72 hours.',
    'Datos del titular (LSSI)': 'Owner details (LSSI)',
    'Condiciones del servicio': 'Terms of service',
    'Tratamiento de datos (RGPD)': 'Data processing (GDPR)',
    'Tecnologías utilizadas': 'Technologies used',
    'Genealogic — política de uso, privacidad, cookies y propiedad intelectual.':
      'Genealogic — usage policy, privacy, cookies and intellectual property.',
    'Migas de pan': 'Breadcrumb',
    'Vigente': 'In force',

    // ─── legal/legal-footer-nav ───
    '¿Necesitas aclarar algo o ejercer un derecho RGPD? Escríbenos a':
      'Need to clarify something or exercise a GDPR right? Write to us at',
    'Respondemos en menos de 72 horas.': 'We reply within 72 hours.',

    // ─── legal/report-dialog (reasons + form) ───
    'Infracción de copyright': 'Copyright infringement',
    'Foto, texto u otro contenido sin permiso del titular':
      'Photo, text or other content used without the owner\'s permission',
    'Datos personales (RGPD)': 'Personal data (GDPR)',
    'Aparezco yo / un tercero sin haber dado consentimiento':
      'I or a third party appear without having given consent',
    'Información incorrecta': 'Inaccurate information',
    'Datos del perro, genealogía o criadero erróneos':
      'Incorrect dog, genealogy or kennel data',
    'Suplantación de identidad': 'Impersonation',
    'Alguien se hace pasar por otro criador / propietario':
      'Someone is posing as another breeder / owner',
    'Contenido inapropiado': 'Inappropriate content',
    'Ofensivo, ilegal o discriminatorio': 'Offensive, illegal or discriminatory',
    'Bienestar animal': 'Animal welfare',
    'Contenido relacionado con maltrato o cría irresponsable':
      'Content related to abuse or irresponsible breeding',
    'Este perro ya existe en la plataforma': 'This dog already exists on the platform',
    'Cualquier otro motivo': 'Any other reason',
    'Reportar': 'Report',
    'Reporte enviado': 'Report sent',
    'Hemos recibido tu reporte': 'We\'ve received your report',
    'Lo revisaremos en un plazo máximo de': 'We\'ll review it within',
    '72 horas': '72 hours',
    'conforme al art. 17 LSSI y, si procede, retiraremos o anonimizaremos el contenido. Si dejaste tu email, te contactaremos al resolverlo.':
      'in accordance with art. 17 LSSI and, where appropriate, we\'ll remove or anonymize the content. If you left your email, we\'ll contact you once it\'s resolved.',
    'Reportando:': 'Reporting:',
    'Motivo del reporte': 'Reason for the report',
    'Soy el': 'I am the',
    'titular de los derechos': 'rights holder',
    'de la obra (o represento al titular).': 'of the work (or I represent the holder).',
    'Declaración bajo responsabilidad': 'Statement of responsibility',
    '(art. 17 LPI): declaro de buena fe que el uso del contenido reportado no está autorizado por el titular de los derechos, su representante o la ley, y que la información proporcionada es exacta. Soy consciente de que una declaración falsa puede conllevar responsabilidad civil o penal.':
      '(art. 17 LPI): I declare in good faith that the use of the reported content is not authorized by the rights holder, their representative or the law, and that the information provided is accurate. I am aware that a false statement may entail civil or criminal liability.',
    'Contacto del titular (opcional)': 'Rights holder contact (optional)',
    'Email/teléfono adicional del titular o representante':
      'Additional email/phone of the holder or representative',
    'Descripción de los hechos': 'Description of the facts',
    'Explica el problema con detalle. Si reportas copyright, indica la obra original. Si reportas datos personales, indica qué dato te identifica.':
      'Explain the issue in detail. If you\'re reporting copyright, indicate the original work. If you\'re reporting personal data, indicate which data identifies you.',
    'Mínimo 10 caracteres': 'Minimum 10 characters',
    'Tu email': 'Your email',
    'Lo usamos exclusivamente para contactarte sobre este reporte.':
      'We use it solely to contact you about this report.',
    'Tu nombre (opcional)': 'Your name (optional)',
    'Nombre y apellidos o nombre del estudio/criadero':
      'Full name or name of the studio/kennel',
    'Al enviar este reporte aceptas que tratemos los datos proporcionados con la única finalidad de gestionar la solicitud, conforme a nuestra':
      'By submitting this report you agree that we process the data provided for the sole purpose of handling the request, in accordance with our',
    'política de privacidad': 'privacy policy',
    'Los reportes maliciosos o reiteradamente injustificados pueden conllevar la suspensión de la cuenta.':
      'Malicious or repeatedly unjustified reports may lead to account suspension.',
    'Enviando...': 'Sending...',
    'Enviar reporte': 'Send report',

    // ─── app/reclamar/* ───
    'Este criadero ya tiene dueño': 'This kennel already has an owner',
    'Si crees que es un error, escribe a soporte y te ayudamos a verificarlo.':
      'If you think this is a mistake, write to support and we\'ll help you verify it.',
    'Volver al criadero': 'Back to kennel',
    'Contactar soporte': 'Contact support',
    'Este perro ya tiene dueño': 'This dog already has an owner',
    'Volver al perro': 'Back to dog',

    // ─── app/newsletter/unsubscribe ───
    'Enlace incompleto': 'Incomplete link',
    'El enlace de baja debe incluir un token válido. Comprueba que copiaste la URL completa desde el email.':
      'The unsubscribe link must include a valid token. Check that you copied the full URL from the email.',
    'No se pudo procesar': 'Couldn\'t process',
    'Si el problema persiste, escríbenos a': 'If the problem persists, write to us at',
    'Te has dado de baja': 'You\'ve unsubscribed',
    'ya no recibirá emails del newsletter de': 'will no longer receive newsletter emails from',
    'Si fue por error o quieres volver a suscribirte, escríbenos a':
      'If it was a mistake or you want to resubscribe, write to us at',
    'o vuelve a registrarte en la web del criadero.':
      'or sign up again on the kennel\'s website.',

    // ─── content-reports/report-admin-actions (admin moderation panel) ───
    'Retirar contenido': 'Remove content',
    'El contenido ha sido eliminado, anonimizado o restringido.':
      'The content has been deleted, anonymized or restricted.',
    'Contenido retirado': 'Content removed',
    'Mantener contenido': 'Keep content',
    'Revisado y mantenido. Notificaremos al reportante.':
      'Reviewed and kept. We\'ll notify the reporter.',
    'Contenido mantenido tras revisión': 'Content kept after review',
    'Rechazar reporte': 'Reject report',
    'El reporte no tiene fundamento o es abusivo.': 'The report is unfounded or abusive.',
    'Reporte rechazado por infundado': 'Report rejected as unfounded',
    'Es duplicado': 'It\'s a duplicate',
    'Ya hay otro reporte sobre el mismo contenido.':
      'There is already another report about the same content.',
    'Duplicado de otro reporte': 'Duplicate of another report',
    'Marcar en revisión': 'Mark as under review',
    'Resolver': 'Resolve',
    'Acción tomada': 'Action taken',
    'P. ej., Foto retirada / Criador anonimizado / Perfil oculto':
      'E.g., Photo removed / Breeder anonymized / Profile hidden',
    'Notas de resolución': 'Resolution notes',
    'Argumentación de la decisión (visible internamente, no se manda al reportante por defecto)':
      'Reasoning for the decision (visible internally, not sent to the reporter by default)',
    'Ocultar el': 'Hide the',
    'automáticamente': 'automatically',
    'Soft-hide reversible: el perfil se retira del público pero queda como placeholder en la genealogía. Restaurable en cualquier momento.':
      'Reversible soft-hide: the profile is removed from public view but remains as a placeholder in the genealogy. Restorable at any time.',
    'Este': 'This',
    'ya está oculto. No hace falta repetir la acción.':
      'is already hidden. There\'s no need to repeat the action.',
    'Confirmar resolución': 'Confirm resolution',
    'Reabrir reporte': 'Reopen report',
  },
}
