// Fase 4 · Wave 3 — Módulo NEWSLETTER (campañas + suscriptores del criador)
// Claves = español exacto tal y como aparece en el código (key del translator).
// Cubre: src/components/newsletter/** y src/app/(dashboard)/newsletter/**
//
// Incluye también los valores de AUDIENCE_LABELS / AUDIENCE_HINTS / STATUS_META /
// SOURCE_LABEL que se envuelven en el punto de uso con t(<expresión>) — sus
// strings ES viven en ficheros fuera de scope pero se traducen aquí.
//
// Glosario: newsletter→newsletter, campaign→campaign, subscriber→subscriber,
// subscriber list→list, send→send, draft→draft, open rate→open rate,
// recipient→recipient.

export const content4Newsletter: Record<string, Record<string, string>> = {
  en: {
    // ─── /newsletter (lista de campañas, server) ───
    'Necesitas un criadero registrado.': 'You need a registered kennel.',
    'Envía novedades, próximas camadas y noticias del criadero a tus contactos. Cada email incluye link de baja automático.':
      'Send updates, upcoming litters and kennel news to your contacts. Every email includes an automatic unsubscribe link.',
    'Suscriptores': 'Subscribers',
    'Tu audiencia': 'Your audience',
    'con reserva': 'with reservation',
    'sin reserva': 'without reservation',
    'ya recibieron': 'already received',
    'Cifras basadas en suscriptores activos. Se actualizan al momento.':
      'Figures based on active subscribers. Updated in real time.',
    'Campañas': 'Campaigns',
    'Aún no hay campañas': 'No campaigns yet',
    'Pulsa “Nueva campaña” arriba a la derecha para crear la primera.':
      'Click “New campaign” at the top right to create your first one.',
    'Título': 'Title',
    'Asunto': 'Subject',
    'Destinatarios': 'Recipients',
    'Open rate': 'Open rate',
    'Fecha': 'Date',
    'Estado': 'Status',

    // ─── create-campaign-button (client) ───
    'Error creando campaña': 'Error creating campaign',
    'Nueva campaña': 'New campaign',

    // ─── /newsletter/[id] (server) ───
    'Volver a newsletter': 'Back to newsletter',

    // ─── /newsletter/suscriptores (server) ───
    'Volver a campañas': 'Back to campaigns',

    // ─── newsletter layout (gate, server) ───
    'Mantén informados a tus clientes y lista de espera: campañas, plantillas, segmentación. Disponible próximamente para todos.':
      'Keep your customers and waitlist informed: campaigns, templates, segmentation. Coming soon for everyone.',
    '← Volver al dashboard': '← Back to dashboard',

    // ─── subscriber-form-panel (client) ───
    'Email es obligatorio': 'Email is required',
    'Error al guardar': 'Error saving',
    'Error al eliminar': 'Error deleting',
    '¿Eliminar este suscriptor? Si solo quieres marcarlo como baja, desactiva el checkbox de activo en su lugar.':
      'Delete this subscriber? If you only want to mark them as unsubscribed, uncheck the active checkbox instead.',
    'Editar suscriptor': 'Edit subscriber',
    'Nuevo suscriptor': 'New subscriber',
    'Email *': 'Email *',
    'El email no se puede editar.': 'The email cannot be edited.',
    'Nombre': 'Name',
    'María García (opcional)': 'Mary Garcia (optional)',
    'Origen': 'Source',
    'Etiquetas (separadas por coma)': 'Tags (comma-separated)',
    'cliente, monográfica-madrid, lista-espera': 'customer, madrid-specialty-show, waitlist',
    'Suscripción activa': 'Active subscription',
    'Eliminando…': 'Deleting…',
    'Eliminar': 'Delete',
    'Cancelar': 'Cancel',
    'Guardando…': 'Saving…',
    'Guardar': 'Save',
    'Crear': 'Create',

    // ─── subscribers-page-client (client) ───
    'No se detectaron emails válidos': 'No valid emails detected',
    '¿Importar': 'Import',
    'a la lista?': 'to the list?',
    'email': 'email',
    'emails': 'emails',
    'Error en import': 'Import error',
    'Importados:': 'Imported:',
    'Duplicados ignorados:': 'Duplicates ignored:',
    'suscriptor': 'subscriber',
    'suscriptores': 'subscribers',
    'activo': 'active',
    'activos': 'active',
    'Importar': 'Import',
    'Nuevo': 'New',
    'Aquí gestionas tu lista de suscriptores. El envío de campañas (newsletter, avisos de camada) llega en la próxima fase con plantillas y métricas de apertura. Por ahora puedes construir y limpiar tu lista — importar emails desde otras herramientas o añadir manualmente.':
      'Here you manage your subscriber list. Campaign sending (newsletter, litter alerts) is coming in the next phase with templates and open metrics. For now you can build and clean up your list — import emails from other tools or add them manually.',
    'Activos': 'Active',
    'Bajas': 'Unsubscribed',
    'Todos': 'All',
    'Buscar por email o nombre…': 'Search by email or name…',
    'Sin suscriptores aún. Añade el primero o importa desde otra herramienta.':
      'No subscribers yet. Add the first one or import from another tool.',
    'Ningún suscriptor coincide con el filtro.': 'No subscriber matches the filter.',
    'Activo': 'Active',
    'Baja': 'Unsubscribed',
    'Importar suscriptores': 'Import subscribers',
    'Pega emails separados por línea, coma o punto y coma. Los duplicados se ignoran automáticamente.':
      'Paste emails separated by line, comma or semicolon. Duplicates are ignored automatically.',
    'Importando…': 'Importing…',

    // ─── SOURCE_LABEL (subscribers-page-client) + select options (form panel) ───
    'Manual': 'Manual',
    'Importado': 'Imported',
    'Formulario web': 'Web form',
    'Reserva': 'Reservation',
    'Contrato': 'Contract',

    // ─── campaign-editor (client) ───
    'Prueba enviada a': 'Test sent to',
    'Error': 'Error',
    'Error enviando': 'Error sending',
    '¿Borrar esta campaña? No se puede deshacer.': 'Delete this campaign? This cannot be undone.',
    'Error al borrar': 'Error deleting',
    'Título interno de la campaña': 'Internal campaign title',
    'Guardando...': 'Saving...',
    'Guardado': 'Saved',
    'Borrar': 'Delete',
    'Editar contenido': 'Edit content',
    'Audiencia': 'Audience',
    'Resultado': 'Result',
    'Enviar': 'Send',
    'Asunto del email': 'Email subject',
    'Novedades de mayo': 'May updates',
    'Preheader (preview text)': 'Preheader (preview text)',
    'Lo que se ve antes de abrir el email': 'What is shown before opening the email',
    'Imagen cabecera (URL)': 'Header image (URL)',
    'Cuerpo (markdown)': 'Body (markdown)',
    '## Próximas novedades\n\nEste mes tenemos camada nueva...':
      '## Upcoming news\n\nThis month we have a new litter...',
    'Soporta **negrita**, *cursiva*, # H1, ## H2, listas, [links](url).':
      'Supports **bold**, *italic*, # H1, ## H2, lists, [links](url).',
    'CTA — texto botón': 'CTA — button text',
    'Ver más': 'See more',
    'CTA — URL': 'CTA — URL',
    'Reply-to (opcional)': 'Reply-to (optional)',
    'Default: tu email de criador': 'Default: your breeder email',
    'Guardar ahora': 'Save now',
    'Vista previa': 'Preview',
    '(sin asunto)': '(no subject)',
    'Hola [nombre],': 'Hi [name],',
    'Recibes este email porque te suscribiste al newsletter de':
      'You are receiving this email because you subscribed to the newsletter of',
    'Darme de baja': 'Unsubscribe',
    'Resumen': 'Summary',
    'destinatarios': 'recipients',
    'tu email por defecto': 'your default email',
    'Resultado del envío': 'Send result',
    'Entregados': 'Delivered',
    'Abiertos': 'Opened',
    'Clicks': 'Clicks',
    'Rebotes': 'Bounces',
    'Fallos': 'Failures',
    'Enviada el': 'Sent on',
    'Enviar prueba (1 email)': 'Send test (1 email)',
    'Te llega un email idéntico al real, con asunto':
      'You receive an email identical to the real one, with the subject',
    'delante. Útil para revisar el render antes del envío masivo.':
      'in front. Useful for reviewing the render before the mass send.',
    'Envío de newsletter próximamente disponible': 'Newsletter sending coming soon',
    'Enviar prueba': 'Send test',
    'Enviar a': 'Send to',
    'Manda la campaña a toda la audiencia': 'Send the campaign to the entire audience',
    'Tarda ~': 'Takes ~',
    ' segundos. No se puede deshacer.': ' seconds. This cannot be undone.',
    'El envío real de campañas está disponible para todos en las próximas semanas. Mientras tanto puedes diseñar la campaña y previsualizarla aquí.':
      'Real campaign sending is available for everyone in the coming weeks. Meanwhile you can design the campaign and preview it here.',
    'Envío completado:': 'Send completed:',
    'fallaron.': 'failed.',
    'Enviando a': 'Sending to',
    'suscriptores...': 'subscribers...',
    'Enviar ahora': 'Send now',
    'Confirmar envío': 'Confirm send',
    'Vas a enviar': 'You are about to send',
    'a': 'to',
    'No se puede deshacer. Si necesitas cambiar algo, cancela y vuelve a la tab Editar.':
      'This cannot be undone. If you need to change something, cancel and go back to the Edit tab.',
    'Sí, enviar': 'Yes, send',

    // ─── STATUS_META / StatusBadge labels (page.tsx + campaign-editor) ───
    'Borrador': 'Draft',
    'Programada': 'Scheduled',
    'Enviando…': 'Sending…',
    'Enviada': 'Sent',
    'Fallo': 'Failed',
    'Cancelada': 'Cancelled',

    // ─── AUDIENCE_LABELS (audiences-shared, traducidas en uso) ───
    'Clientes (con reserva)': 'Customers (with reservation)',
    'Leads (sin reserva)': 'Leads (without reservation)',
    'Recibieron cachorro': 'Received a puppy',
    'Segmento custom': 'Custom segment',

    // ─── AUDIENCE_HINTS (audiences-shared, traducidas en uso) ───
    'Todos los suscriptores activos': 'All active subscribers',
    'Suscriptores que han hecho al menos una reserva (cualquier estado)':
      'Subscribers who have made at least one reservation (any status)',
    'Suscriptores que NUNCA han reservado — ideal para conversión':
      'Subscribers who have NEVER reserved — ideal for conversion',
    'Clientes que ya recibieron cachorro — ideal para repeat sales y referrals':
      'Customers who already received a puppy — ideal for repeat sales and referrals',
    'Filtro custom (próximamente)': 'Custom filter (coming soon)',
  },
}
