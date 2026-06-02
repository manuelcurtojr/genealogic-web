/**
 * Diccionario i18n del EMBUDO (funnel). Incluye los nombres de los pasos y
 * pipelines POR DEFECTO (que se guardan en español como clave y se renderizan
 * con t()), los motivos de pérdida por defecto, y los strings de la UI.
 *
 * Los pasos/pipelines/motivos PERSONALIZADOS que cree el criador pasan por t()
 * pero, al no estar en el diccionario, se muestran tal cual (su propio idioma).
 */
export const content6Funnel: Record<string, Record<string, string>> = {
  en: {
    // ── sección / UI ──
    Embudo: 'Funnel',
    'Configurar embudo': 'Configure funnel',
    'No hay pipelines configurados.': 'No pipelines configured.',
    'No hay fichas en este paso.': 'No entries in this stage.',
    'Mover a…': 'Move to…',
    Abrir: 'Open',
    Nueva: 'New',
    Motivo: 'Reason',
    '¿Por qué se perdió?': 'Why was it lost?',
    'Detalle (opcional)': 'Detail (optional)',
    Seguir: 'Continue',

    // ── pipelines por defecto ──
    Ventas: 'Sales',
    Reservas: 'Reservations',

    // ── pasos por defecto: Ventas ──
    Interesados: 'Interested',
    Contactado: 'Contacted',
    'Oferta enviada': 'Offer sent',
    'En seguimiento': 'Following up',
    'Venta ganada': 'Sale won',
    'Venta perdida': 'Sale lost',

    // ── pasos por defecto: Reservas ──
    'Reserva en firme': 'Firm reservation',
    'Perro seleccionado': 'Dog selected',
    'En espera': 'On hold',
    'Pendiente de entrega': 'Pending delivery',
    Entregado: 'Delivered',
    'Reserva cancelada': 'Reservation cancelled',

    // ── motivos de pérdida por defecto: Ventas ──
    'Precio muy caro': 'Too expensive',
    'No era el momento': 'Not the right time',
    'No le convence la raza': 'Not sold on the breed',
    'No responde': 'Not responding',
    Otro: 'Other',

    // ── motivos de pérdida por defecto: Reservas ──
    'No quiere esperar más': 'No longer wants to wait',
    'No puede tenerlo': 'Can no longer have it',
    'No responde pasado el plazo': 'No response after the deadline',
    'Ha muerto': 'Passed away',

    // ── editor de configuración ──
    'Nombre del nuevo pipeline': 'Name of the new pipeline',
    'Nuevo nombre': 'New name',
    '¿Borrar este pipeline?': 'Delete this pipeline?',
    '¿Borrar este paso?': 'Delete this stage?',
    Normal: 'Normal',
    Ganado: 'Won',
    Perdido: 'Lost',
    Pipeline: 'Pipeline',
    Renombrar: 'Rename',
    'Borrar pipeline': 'Delete pipeline',
    'Nombre del paso': 'Stage name',
    'Añadir paso': 'Add stage',
    'Cada pipeline necesita al menos 1 paso normal, 1 ganado y 1 perdido.':
      'Every pipeline needs at least 1 normal, 1 won and 1 lost stage.',
    'Motivos de pérdida (uno por línea)': 'Loss reasons (one per line)',
    'Celebrar con confeti': 'Celebrate with confetti',
    'Al ganar, clonar a:': 'On win, clone to:',
    Nada: 'None',
    'Paso de entrada (donde caen las solicitudes nuevas)': 'Entry stage (where new requests land)',

    // ── errores de server actions ──
    'El nombre no puede estar vacío': 'The name cannot be empty',
    'Debe quedar al menos un pipeline.': 'At least one pipeline must remain.',
    'No puedes borrar un pipeline con fichas dentro.': 'You cannot delete a pipeline with entries in it.',
    'No puedes borrar un paso con fichas dentro.': 'You cannot delete a stage with entries in it.',
    'Indica el motivo': 'Please indicate the reason',
    'Paso no encontrado': 'Stage not found',

    // ── estadísticas ──
    Ganadas: 'Won',
    Perdidas: 'Lost',
    'En curso': 'In progress',
    'Conversión': 'Conversion',

    // ── panel lateral del lead ──
    'Abrir ficha completa': 'Open full record',
    Mensaje: 'Message',
    'Otros datos': 'Other details',
    Preferencia: 'Preference',
    'Propósito': 'Purpose',
    'Preferencia de sexo': 'Sex preference',
    'Respuestas del formulario': 'Form answers',
    'Nota interna': 'Internal note',
    'Nota privada sobre este lead…': 'Private note about this lead…',
    'Guardar nota': 'Save note',
    Guardada: 'Saved',
    'Mover a otro paso': 'Move to another stage',
    'Formulario web': 'Web form',
    'Alta manual': 'Manual entry',
    Emailbot: 'Emailbot',
    API: 'API',

    // ── panel de configuración ──
    'Nuevo embudo': 'New funnel',
    'Nombre del embudo': 'Funnel name',
    'Ej. Lista de espera': 'E.g. Waiting list',
    'Se crea con un paso normal, uno ganado y uno perdido. Luego los configuras.':
      'It starts with one normal, one won and one lost stage. Then you configure them.',
    'Crear embudo': 'Create funnel',
    'Cargando…': 'Loading…',
    'Configura los pasos del embudo': 'Configure the funnel stages',
    'Configurar este embudo': 'Configure this funnel',
  },
}
