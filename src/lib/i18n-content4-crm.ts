// Fase 4 · Wave 2 — i18n content para CRM (Clientes/Contactos), Veterinario,
// Analíticas/Estadísticas y Conocimiento (Biblioteca).
//
// Clave = español EXACTO tal como aparece en el código (mismos acentos, mismos
// puntos suspensivos `…` vs `...`, mismos asteriscos de campos obligatorios).
// Glosario aplicado: client/contact/lead/owner/breeder, vaccine/deworming,
// vet appointment·reminder, health, analytics/stats, knowledge base, etc.
//
// NO traducir: datos BD, nombres de plan, marca, URLs, enum keys, className.
// Apóstrofes del inglés escapados con \'.

export const content4Crm: Record<string, Record<string, string>> = {
  en: {
    // ─── Clientes (CRM list + owner form) ───
    'Clientes': 'Clients',
    'Nuevo cliente': 'New client',
    'Nuevo cliente manual': 'New manual client',
    'Editar cliente': 'Edit client',
    'cliente': 'client',
    'clientes': 'clients',
    'Cliente': 'Client',
    'Contacto': 'Contact',
    'Ubicación': 'Location',
    'Reservas': 'Reservations',
    'activa': 'active',
    'activas': 'active',
    'total': 'total',
    'Aún no tienes clientes. Crea el primero para empezar a gestionar reservas.':
      'You don\'t have any clients yet. Create your first one to start managing reservations.',
    'Ningún cliente coincide con la búsqueda.': 'No client matches your search.',
    'Buscar por nombre, email, teléfono…': 'Search by name, email, phone…',

    // ─── Owner form panel ───
    'Nombre completo *': 'Full name *',
    'Email': 'Email',
    'Teléfono': 'Phone',
    'Dirección': 'Address',
    'Calle, número, piso': 'Street, number, floor',
    'Ciudad': 'City',
    'País': 'Country',
    'Tipo doc.': 'Doc. type',
    'Pasaporte': 'Passport',
    'Número doc.': 'Doc. number',
    'Notas internas': 'Internal notes',
    'Información privada que solo verás tú: preferencias, conversaciones previas, alergias del cliente, etc.':
      'Private information only you will see: preferences, previous conversations, client allergies, etc.',
    'El nombre es obligatorio': 'Name is required',
    'Error al guardar': 'Failed to save',
    'Error al eliminar': 'Failed to delete',
    '¿Eliminar este cliente? Sus reservas no se borrarán pero quedarán sin cliente asignado.':
      'Delete this client? Their reservations won\'t be removed but will be left without an assigned client.',
    'Cancelar': 'Cancel',
    'Guardar': 'Save',
    'Crear': 'Create',
    'Editar': 'Edit',
    'Eliminar': 'Delete',
    'Guardando…': 'Saving…',
    'Eliminando…': 'Deleting…',
    'Guardando...': 'Saving...',
    'Eliminando...': 'Deleting...',
    'Cerrar': 'Close',

    // ─── Contactos (tabs + tables) ───
    'Contactos': 'Contacts',
    'Suscriptores del newsletter, leads de solicitudes y clientes que cerraron.':
      'Newsletter subscribers, leads from applications and clients who closed.',
    'Suscriptores': 'Subscribers',
    'Leads': 'Leads',
    'de': 'of',
    'coinciden con': 'match',
    'suscriptores': 'subscribers',
    'leads': 'leads',
    'Nombre': 'Name',
    'Origen': 'Source',
    'Tags': 'Tags',
    'Estado': 'Status',
    'Fecha': 'Date',
    'Activo': 'Active',
    'Baja': 'Unsubscribed',
    'Sin suscriptores': 'No subscribers',
    'Ningún suscriptor coincide': 'No subscriber matches',
    'Cuando alguien se suscriba a tu newsletter desde tu web, aparecerá aquí.':
      'When someone subscribes to your newsletter from your site, they\'ll appear here.',
    'Gestionar campañas en': 'Manage campaigns at',
    'Lead': 'Lead',
    'Preferencias': 'Preferences',
    'Sin leads abiertos': 'No open leads',
    'Ningún lead coincide': 'No lead matches',
    'Los leads son interesados que han enviado solicitud pero no han cerrado todavía. Aparecen aquí cuando llega un formulario de contacto o se paga una señal.':
      'Leads are prospects who have submitted an application but haven\'t closed yet. They appear here when a contact form arrives or a deposit is paid.',
    'Sin nombre': 'No name',
    'Macho': 'Male',
    'Hembra': 'Female',
    'Interesado': 'Interested',
    'Señal pagada': 'Deposit paid',
    'Pipeline completo en': 'Full pipeline at',
    'Sin clientes todavía': 'No clients yet',
    'Ningún cliente coincide': 'No client matches',
    'Cuando un lead se convierte (asignación de cachorro, contrato firmado, entrega) aparece aquí. También puedes añadir clientes manualmente.':
      'When a lead converts (puppy assignment, signed contract, delivery) it appears here. You can also add clients manually.',
    'Último perro': 'Latest dog',
    'Actividad': 'Activity',
    'Recibió': 'Received',
    'reserva': 'reservation',
    'reservas': 'reservations',
    'manual': 'manual',

    // ─── Contactos server page (no kennel) ───
    'Para gestionar contactos necesitas un criadero registrado. Crea tu kennel desde':
      'To manage contacts you need a registered kennel. Create your kennel from',
    'Mi Criadero': 'My Kennel',

    // ─── Vet reminders (list + filters) ───
    'Salud': 'Health',
    'Recordatorios vet.': 'Vet reminders.',
    'Vacunas, desparasitaciones y revisiones de tus perros.':
      'Vaccines, dewormings and checkups for your dogs.',
    'Recordatorio': 'Reminder',
    'Total': 'Total',
    'Pendientes': 'Pending',
    'Vencidos': 'Overdue',
    'Completados': 'Completed',
    'Todos': 'All',
    'Filtrar por perro...': 'Filter by dog...',
    'No hay recordatorios': 'No reminders',
    'en esta categoría': 'in this category',
    'todavía': 'yet',
    'Añade uno o usa auto-generar.': 'Add one or use auto-generate.',
    'Vacuna': 'Vaccine',
    'Desparasitación': 'Deworming',
    'Revisión': 'Checkup',
    'Personalizado': 'Custom',
    'Auto': 'Auto',
    'cada': 'every',
    'Completado': 'Completed',
    'Vencido': 'Overdue',
    'Hoy': 'Today',
    'Próximo': 'Upcoming',
    'Marcar como completado': 'Mark as completed',
    'Todos los perros': 'All dogs',
    'Buscar perro...': 'Search dog...',
    'Sin resultados': 'No results',
    'Auto-generar': 'Auto-generate',
    'Busca un perro para generar recordatorios automáticos según su edad':
      'Search a dog to generate automatic reminders based on its age',
    'Tus perros necesitan fecha de nacimiento': 'Your dogs need a date of birth',

    // ─── Vet reminder form ───
    'Editar recordatorio': 'Edit reminder',
    'Nuevo recordatorio': 'New reminder',
    'Completado el': 'Completed on',
    'Perro *': 'Dog *',
    'Seleccionar perro...': 'Select dog...',
    'Plantilla (opcional)': 'Template (optional)',
    'Vacunas': 'Vaccines',
    'Revisiones': 'Checkups',
    'Título *': 'Title *',
    'Ej: Vacuna anual polivalente': 'E.g.: Annual multivalent vaccine',
    'Tipo': 'Type',
    'Fecha *': 'Date *',
    'Repetir cada (días)': 'Repeat every (days)',
    '0 = sin repetición': '0 = no repetition',
    'Al completar un recordatorio recurrente, se creará el siguiente automáticamente':
      'When you complete a recurring reminder, the next one is created automatically',
    'Notas': 'Notes',
    'Notas adicionales...': 'Additional notes...',
    'Completando...': 'Completing...',
    'Completar': 'Complete',

    // ─── Estadísticas (stats dashboard) ───
    'Estadísticas': 'Statistics',
    'Necesitas un criadero registrado.': 'You need a registered kennel.',
    'resumen general': 'general overview',
    'Perros': 'Dogs',
    'Camadas': 'Litters',
    'Reservas activas': 'Active reservations',
    'totales': 'total',
    'Biblioteca': 'Library',
    'entradas activas': 'active entries',
    'Newsletter': 'Newsletter',
    'Visitas 30d': 'Views 30d',
    'histórico': 'all-time',
    'Visitas totales': 'Total views',
    'Tracking de visitas aún sin datos.': 'View tracking has no data yet.',
    'El conteo de visitas a tu perfil público y a las fichas de tus perros se activa en la próxima fase. La infraestructura ya está en la base de datos':
      'Counting views to your public profile and to your dogs\' pages goes live in the next phase. The infrastructure is already in the database',
    'falta enganchar el middleware de tracking ligero y anónimo (sha256 de ip+user-agent+día, GDPR-friendly).':
      'it remains to hook up the lightweight, anonymous tracking middleware (sha256 of ip+user-agent+day, GDPR-friendly).',
    'Pipeline de reservas': 'Reservations pipeline',
    'Sin reservas todavía. Crea la primera en': 'No reservations yet. Create the first one in',
    'Lista de espera': 'Waitlist',
    'Depósito pagado': 'Deposit paid',
    'Asignado': 'Assigned',
    'Contrato firmado': 'Contract signed',
    'Pago total': 'Paid in full',
    'Entregado': 'Delivered',
    'Cancelado': 'Cancelled',
    'Top perros (por reservas asociadas)': 'Top dogs (by associated reservations)',
    'Aún no hay reservas asociadas a perros concretos.':
      'There are no reservations associated with specific dogs yet.',
    'Tu perfil público': 'Your public profile',
    'Las visitas y conversiones a este perfil se medirán aquí en cuanto se active el tracking.':
      'Views and conversions to this profile will be measured here as soon as tracking is enabled.',
    'Ver perfil': 'View profile',

    // ─── Conocimiento (Biblioteca / knowledge base) ───
    'La Biblioteca de conocimiento alimenta al Emailbot IA de tu criadero. Disponible en Kennel Enterprise.':
      'The knowledge Library powers your kennel\'s AI Emailbot. Available on Kennel Enterprise.',
    '← Volver al dashboard': '← Back to dashboard',
    'Para usar la Biblioteca necesitas un criadero registrado. Crea tu kennel desde Mi Criadero.':
      'To use the Library you need a registered kennel. Create your kennel from My Kennel.',
  },
}
