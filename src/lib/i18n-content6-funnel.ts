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
  },
}
