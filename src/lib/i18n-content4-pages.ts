// Fase 4 · Wave 1 — Diccionario ES→EN de las PÁGINAS del dashboard del PROPIETARIO (owner).
//
// Cubre los strings envueltos con t('...') en:
//   · (dashboard)/mis-reservas/** (page + [id] + contrato + pagos)
//   · (dashboard)/mis-solicitudes/** (page + [id])
//   · (dashboard)/notifications/page.tsx
//   · (dashboard)/dogs/[id]/page.tsx, dogs/[id]/papeles/page.tsx + upload-form.tsx
//
// Las claves son el español EXACTO pasado a t(). Duplicados con otros content
// dicts (i18n.ts base, content/2/3) son inofensivos: getTranslator cascadea.
// 'es' no necesita entradas (es la clave base).

export const content4Pages: Record<string, Record<string, string>> = {
  en: {
    // ─── mis-reservas (lista) ───
    'Panel del propietario': 'Owner panel',
    'Mis reservas': 'My reservations',
    'Todas tus reservas de cachorros con cualquier criador en Genealogic. Estado en tiempo real, contratos y pagos en un solo sitio.':
      'All your puppy reservations with any breeder on Genealogic. Real-time status, contracts and payments in one place.',
    'Activas': 'Active',
    'Histórico': 'History',
    'Sin reservas en histórico todavía.': 'No reservations in history yet.',
    'No tienes reservas activas.': 'You have no active reservations.',
    'Cuando reserves un cachorro con un criador que use Genealogic, aparecerá aquí con su estado, contrato y pagos.':
      'When you reserve a puppy with a breeder who uses Genealogic, it will appear here with its status, contract and payments.',
    'Explorar criaderos': 'Explore kennels',
    'Criador': 'Breeder',
    'Cachorro asignado': 'Assigned puppy',
    'Reservada': 'Reserved',
    'Seña': 'Deposit',
    'Posición': 'Position',
    'Entregado': 'Delivered',
    '¿Falta alguna reserva? Asegúrate de usar el mismo email con el que contactaste al criador. Si la reserva era antigua, debería aparecer automáticamente al iniciar sesión.':
      'Missing a reservation? Make sure to use the same email you contacted the breeder with. If the reservation was old, it should appear automatically when you log in.',

    // ─── mis-reservas/[id] (detalle) ───
    'Reserva con': 'Reservation with',
    'Ver ficha completa en Genealogic': 'View full profile on Genealogic',
    'Tu solicitud': 'Your request',
    'Sexo preferido': 'Preferred sex',
    'Macho': 'Male',
    'Hembra': 'Female',
    'Indiferente': 'No preference',
    'Color preferido': 'Preferred color',
    'Función': 'Purpose',
    'Notas': 'Notes',
    'Mensaje al criador': 'Message to the breeder',
    'Camada': 'Litter',
    'Fecha esperada': 'Expected date',
    'Nacimiento': 'Birth',
    'Línea de tiempo': 'Timeline',
    'Económico': 'Financials',
    'Total': 'Total',
    'El criador no ha configurado importes todavía.': 'The breeder has not set up amounts yet.',
    'Ver pagos y abonar': 'View payments and pay',
    'Contrato': 'Contract',
    'Firmado el': 'Signed on',
    'Revisa el estado del contrato y fírmalo cuando el criador lo envíe.':
      'Check the contract status and sign it when the breeder sends it.',
    'Abrir contrato': 'Open contract',
    'Mensajes': 'Messages',
    'mensaje': 'message',
    'mensajes': 'messages',
    'el criador': 'the breeder',
    'Esta reserva está archivada. Se mantiene visible para tu histórico pero ya no recibirá actualizaciones.':
      'This reservation is archived. It stays visible in your history but will no longer receive updates.',
    'Solicitud enviada': 'Request sent',
    'Seña pagada': 'Deposit paid',
    'Contrato firmado': 'Contract signed',
    'Pago final': 'Final payment',
    'Cachorro entregado': 'Puppy delivered',

    // ─── mis-reservas/[id]/contrato ───
    'Mi reserva': 'My reservation',
    'El contrato aún no está disponible': 'The contract is not available yet',
    'está preparando el contrato. Te avisaremos cuando esté listo para revisar y firmar.':
      'is preparing the contract. We will let you know when it is ready to review and sign.',
    'El criador está preparando el contrato. Te avisaremos cuando esté listo para revisar y firmar.':
      'The breeder is preparing the contract. We will let you know when it is ready to review and sign.',
    'Estado': 'Status',
    'Cliente (tú)': 'Client (you)',
    'Contrato firmado por ambas partes': 'Contract signed by both parties',
    'Firmado': 'Signed',
    'Pendiente': 'Pending',

    // ─── mis-reservas/[id]/pagos ───
    'Pagos': 'Payments',
    'Pago completado. Tardamos unos segundos en reflejarlo en la lista — recarga la página si no aparece todavía.':
      'Payment completed. It takes a few seconds to show up in the list — reload the page if it has not appeared yet.',
    'Has cancelado el pago. Puedes reintentarlo cuando quieras.':
      'You cancelled the payment. You can retry whenever you want.',
    'Pagado': 'Paid',
    'Sin pagos por ahora': 'No payments for now',
    'El criador aún no ha creado pagos para esta reserva. Cuando lo haga, aparecerán aquí con opción a pagar online (si está conectado a Stripe).':
      'The breeder has not created payments for this reservation yet. When they do, they will appear here with an option to pay online (if connected to Stripe).',
    'Vence': 'Due',
    'Pagar ahora': 'Pay now',
    'El criador aún no ha activado pagos online. Contacta para pagar por transferencia.':
      'The breeder has not enabled online payments yet. Get in touch to pay by bank transfer.',
    'El criador no tiene pagos online activos todavía. Pónte en contacto con':
      'The breeder does not have online payments enabled yet. Get in touch with',
    'para pagar por transferencia bancaria o el método que prefiera.':
      'to pay by bank transfer or whatever method they prefer.',

    // ─── soporte (página unificada: lista + nueva solicitud) ───
    'Mis solicitudes': 'My requests',
    'Soporte y reclamaciones que has enviado.': 'Support and claims you have submitted.',
    'Abrir nueva': 'Open new',
    'No tienes solicitudes aún.': 'You have no requests yet.',
    'Escribir a soporte': 'Contact support',
    'Ayuda': 'Help',
    'Soporte': 'Support',
    'Tus solicitudes, reporta un problema y recibe ayuda de un humano del equipo.':
      'Your requests, report a problem and get help from a human on the team.',
    'Nueva solicitud': 'New request',
    'Aún no tienes solicitudes': 'You have no requests yet',
    'Cuando abras un ticket o reclames un perro o criadero, aparecerá aquí.':
      'When you open a ticket or claim a dog or kennel, it will show up here.',
    '¿En qué te ayudamos?': 'How can we help?',
    'Escribe tu consulta y un humano del equipo te responderá. Solemos tardar menos de 24h en días laborables.':
      'Write your query and a human on the team will reply. We usually take less than 24h on business days.',
    'Verás la respuesta en': 'You will see the reply in',
    '. También te avisaremos por email.': '. We will also notify you by email.',

    // ─── soporte/[id] (detalle) ───
    'Volver a Soporte': 'Back to Support',
    'Volver a mis solicitudes': 'Back to my requests',
    'Un admin la revisará en menos de 72h. Te avisaremos por email cuando tengamos novedades.':
      'An admin will review it within 72h. We will email you when we have updates.',
    'Resuelta': 'Resolved',
    '¡Reclamación aprobada!': 'Claim approved!',
    'Ya eres el propietario oficial.': 'You are now the official owner.',
    'Ver el perro': 'View the dog',
    'Ver el criadero': 'View the kennel',
    'Solicitud rechazada': 'Request rejected',
    'Contactar soporte si crees que es un error': 'Contact support if you think this is a mistake',
    'Tú': 'You',
    'Evidencias enviadas': 'Evidence submitted',
    'Equipo Genealogic': 'Genealogic Team',

    // ─── notifications ───
    'perros importados': 'dogs imported',
    'Borrador de importación pendiente': 'Pending import draft',
    'Centro': 'Center',
    'Notificaciones': 'Notifications',
    'Marcar leídas': 'Mark as read',
    'Borrar notificaciones leídas': 'Delete read notifications',
    'Limpiar': 'Clear',
    'Todas': 'All',
    'No leídas': 'Unread',
    '¿Borrar': 'Delete',
    'notificaciones leídas? No se puede deshacer.': 'read notifications? This cannot be undone.',
    'Marcar como leída': 'Mark as read',
    'Borrar': 'Delete',
    '¡Todo al día!': 'All caught up!',
    'Sin notificaciones': 'No notifications',
    'No tienes notificaciones sin leer. Te avisaremos aquí cuando haya nuevas solicitudes, mensajes o pagos.':
      'You have no unread notifications. We will let you know here when there are new requests, messages or payments.',
    'Cuando alguien envíe una reserva, mensaje, firme un contrato o pague algo, lo verás aquí en tiempo real.':
      'When someone sends a reservation, message, signs a contract or pays something, you will see it here in real time.',

    // ─── dogs/[id] (ficha del perro) ───
    'Este perro está oculto al público': 'This dog is hidden from the public',
    'Motivo': 'Reason',
    'Si crees que es un error o quieres aportar pruebas, escríbenos a':
      'If you think this is a mistake or want to provide evidence, write to us at',
    'En memoria': 'In memory',
    'Ver estándar de la raza': 'View the breed standard for',
    'Sexo': 'Sex',
    'Color': 'Color',
    'Peso': 'Weight',
    'Altura': 'Height',
    'Padre': 'Sire',
    'Madre': 'Dam',
    'Desconocido': 'Unknown',
    'Genealogía': 'Genealogy',

    // ─── dogs/[id]/papeles ───
    'Papeles': 'Documents',
    'Contratos, cartillas, registros y documentos de': 'Contracts, health records, registrations and documents for',
    'Documentos': 'Documents',
    '¿Cuándo se ve el documento?': 'When is the document visible?',
    'Marca': 'Check',
    'Visible para el propietario': 'Visible to the owner',
    'para que aparezca en su panel': 'so it appears on their panel',
    'Desmárcalo si es una copia interna.': 'Uncheck it if it is an internal copy.',

    // ─── dogs/[id]/papeles/upload-form ───
    'Subir documento': 'Upload document',
    'Tipo': 'Type',
    'Título': 'Title',
    'Ej: Contrato de compraventa': 'E.g. Sales contract',
    'Fecha del documento (opcional)': 'Document date (optional)',
    'Archivo (max 25 MB)': 'File (max 25 MB)',
    'Descripción (opcional)': 'Description (optional)',
    'Notas internas o para el propietario...': 'Internal notes or notes for the owner...',
    'Visible para el propietario en su panel': 'Visible to the owner on their panel',
    'Documento subido correctamente': 'Document uploaded successfully',
    'Subiendo...': 'Uploading...',
    'Selecciona un archivo': 'Select a file',
    'El archivo supera 25 MB': 'The file exceeds 25 MB',
    'No tienes permiso para subir documentos a este perro': 'You do not have permission to upload documents to this dog',
    'Perro no encontrado': 'Dog not found',
    'Sesión no válida': 'Invalid session',
    'Error': 'Error',
  },
}
