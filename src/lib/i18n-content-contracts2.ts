// i18n content pack — UI de contratos de reserva/entrega (criador + cliente),
// campos legales del criadero y sección Documentos. Clave = español EXACTO.
// (Las claves de los EMAILS de contrato viven en i18n-content3.ts.)

export const contentContracts2: Record<string, Record<string, string>> = {
  en: {
    // ── Página de contratos del criador ──────────────────────────────
    Contratos: 'Contracts',
    'Cada reserva tiene dos contratos: la reserva inicial (con señal) y la compraventa definitiva en el momento de la entrega. Gestiona cada uno por separado.':
      'Each reservation has two contracts: the initial reservation (with deposit) and the final sale at delivery. Manage each one separately.',
    'Contrato de reserva': 'Reservation contract',
    'Contrato de compraventa y entrega': 'Sale and delivery contract',
    'Crear contrato de reserva': 'Create reservation contract',
    'Crear contrato de entrega': 'Create delivery contract',
    'Se pre-rellena con los datos de la reserva (cliente, cachorro, precio). Después la editas con markdown ligero (negrita, listas, separadores) y la envías al cliente para firma.':
      "It's pre-filled with the reservation data (client, puppy, price). Then you edit it with light markdown (bold, lists, dividers) and send it to the client to sign.",
    'O empieza desde una de tus plantillas': 'Or start from one of your templates',
    'Modelo base usado:': 'Base template used:',

    // ── Paso "Tus datos" del cliente ─────────────────────────────────
    'Tus datos': 'Your details',
    'Para firmar, completa tus datos': 'Complete your details to sign',
    'DNI / NIE / Pasaporte': 'ID / Passport',
    Dirección: 'Address',
    'Código postal': 'Postal code',
    Ciudad: 'City',
    'Guardar y continuar': 'Save and continue',

    // ── Campos legales del criadero (Ajustes) ────────────────────────
    'Representante legal': 'Legal representative',
    'DNI del representante': "Representative's ID",
    'Ciudad de firma': 'Signing city',
    'Jurisdicción (tribunales)': 'Jurisdiction (courts)',
    'Persona física que firma los contratos en nombre del criadero.':
      'Individual who signs contracts on behalf of the kennel.',
    'Localidad donde se firman los contratos.': 'Town where contracts are signed.',
    'Juzgados y tribunales competentes en caso de controversia.':
      'Courts with jurisdiction in case of dispute.',
    'Ej: D. Manuel Curtó': 'E.g. Mr. John Smith',
    'Ej: 12345678Z': 'E.g. 12345678Z',
    'Ej: La Laguna': 'E.g. La Laguna',
    'Ej: Santa Cruz de Tenerife': 'E.g. Santa Cruz de Tenerife',

    // ── Sección Documentos (reserva del cliente) ─────────────────────
    Documentos: 'Documents',
    'Aún no hay documentos': 'No documents yet',
    Descargar: 'Download',

    // ── Vista de impresión / PDF del contrato firmado ────────────────
    'Imprimir / Guardar PDF': 'Print / Save PDF',
    'Guardar como PDF': 'Save as PDF',
    'Por el criadero': 'For the kennel',
    'El cliente': 'The client',
    'Documento firmado electrónicamente por ambas partes. Copia con validez probatoria.':
      'Document signed electronically by both parties. Copy with evidentiary value.',
  },
}
