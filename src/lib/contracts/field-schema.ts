/**
 * Schema de campos del formulario de relleno (fill-form) del contrato.
 *
 * Define QUÉ campos pide el formulario para cada `kind` de contrato y los
 * agrupa por sección. Es lo que `ContractFillForm` itera para renderizar
 * el formulario izquierda; los valores resultantes se interpolan en la
 * plantilla `{{token}}` para el preview derecha.
 *
 * Convenciones:
 *  - `token`: la clave que aparece en la plantilla como `{{token}}`.
 *    DEBE coincidir con las keys de `ContractTemplateVars` (lib/contracts/
 *    templates.ts).
 *  - `kind`: tipo de input UI. 'text' / 'tel' / 'email' / 'date' / 'select'
 *    / 'currency' / 'textarea'.
 *  - `from`: de dónde sale el valor inicial:
 *      'lead'    → del puppy_reservation (autocompletar)
 *      'puppy'   → del dog asignado (autocompletar)
 *      'kennel'  → del kennels.legal_* (NO editable aquí, info)
 *      'manual'  → siempre lo rellena el criador
 *      'auto'    → derivado (fecha de hoy, finalAmount = total - señal, etc.)
 *  - `required`: si la firma debe esperar a este campo. La validación se
 *    hace al "Enviar al cliente", no al guardar borrador.
 */

export type FieldType =
  | 'text'
  | 'tel'
  | 'email'
  | 'date'
  | 'select'
  | 'currency'
  | 'textarea'
  /** Combobox de RAZA — typeahead sobre el catálogo de razas. El valor
   *  guardado es el NOMBRE de la raza (no el id), porque la plantilla
   *  interpola con `{{breed}}` = nombre. Cuando cambia, el campo color
   *  se resetea (los colores dependen de la raza). */
  | 'breed-select'
  /** Multi-select de COLORES filtrado por la raza actual. Valor guardado:
   *  string con los nombres separados por coma ("Bardino, atigrado"). */
  | 'color-multi'

export type FieldSource = 'lead' | 'puppy' | 'kennel' | 'manual' | 'auto'

export interface ContractField {
  /** Clave del token en la plantilla (`{{token}}`). */
  token: string
  label: string
  type: FieldType
  from: FieldSource
  /** Opciones para selects. */
  options?: Array<{ value: string; label: string }>
  /** Placeholder del input. */
  placeholder?: string
  /** Texto de ayuda debajo. */
  help?: string
  /** Bloqueante al enviar al cliente. Borradores se guardan igual. */
  required?: boolean
}

export interface ContractSection {
  /** Identificador único de la sección (para colapsar, anchors, etc.) */
  id: string
  /** Título humano. */
  title: string
  /** Descripción opcional debajo del título. */
  hint?: string
  /** Icono (lucide-react name) — opcional para el header de la sección. */
  icon?: 'user' | 'dog' | 'sliders' | 'euro' | 'calendar' | 'building'
  fields: ContractField[]
}

// ─── Secciones compartidas ──────────────────────────────────────────────────

const CLIENT_SECTION: ContractSection = {
  id: 'client',
  title: 'Cliente',
  hint: 'Datos personales del comprador. DNI y dirección son obligatorios para que el contrato sea válido.',
  icon: 'user',
  fields: [
    {
      token: 'clientName',
      label: 'Nombre completo',
      type: 'text',
      from: 'lead',
      placeholder: 'Ej: Juan García López',
      required: true,
    },
    {
      token: 'clientEmail',
      label: 'Email',
      type: 'email',
      from: 'lead',
      placeholder: 'cliente@email.com',
      required: true,
    },
    {
      token: 'clientId',
      label: 'DNI / NIE / Pasaporte',
      type: 'text',
      from: 'manual',
      placeholder: '12345678Z',
      help: 'Si no lo conoces ahora, el cliente lo rellenará al firmar.',
      required: true,
    },
    {
      token: 'clientAddress',
      label: 'Dirección postal',
      type: 'textarea',
      from: 'manual',
      placeholder: 'Calle, número, código postal, localidad',
      help: 'Igual que el DNI, el cliente puede rellenarlo en su paso de firma.',
      required: true,
    },
  ],
}

const PREFS_SECTION: ContractSection = {
  id: 'prefs',
  title: 'Preferencias del cachorro',
  hint: 'Características orientativas pedidas por el cliente. Cuanto más concretas, menos margen de discusión luego.',
  icon: 'sliders',
  fields: [
    {
      token: 'breed',
      label: 'Raza',
      type: 'breed-select',
      from: 'lead',
      placeholder: 'Busca una raza…',
      help: 'Al cambiar la raza, los colores se recalculan.',
    },
    {
      token: 'sex',
      label: 'Sexo preferido',
      type: 'select',
      from: 'lead',
      options: [
        { value: '', label: 'Indistinto' },
        { value: 'Macho', label: 'Macho' },
        { value: 'Hembra', label: 'Hembra' },
      ],
    },
    {
      token: 'color',
      label: 'Color / capa',
      type: 'color-multi',
      from: 'lead',
      help: 'Selecciona uno o varios. Solo aparecen los colores admitidos para la raza elegida.',
    },
    {
      token: 'purpose',
      label: 'Función prevista',
      type: 'text',
      from: 'lead',
      placeholder: 'Compañía / Guarda / Trabajo / Cría',
    },
    {
      token: 'preferences',
      label: 'Preferencias adicionales',
      type: 'textarea',
      from: 'lead',
      placeholder: 'Notas libres del cliente',
    },
  ],
}

const PUPPY_SECTION: ContractSection = {
  id: 'puppy',
  title: 'Cachorro asignado',
  hint: 'El perro concreto que se entrega. Si lo tienes en Genealogic, asígnalo a esta reserva y los datos se rellenan solos.',
  icon: 'dog',
  fields: [
    {
      token: 'dogName',
      label: 'Nombre del cachorro',
      type: 'text',
      from: 'puppy',
      placeholder: 'Ej: Toby de Irema',
      required: true,
    },
    {
      token: 'birthDate',
      label: 'Fecha de nacimiento',
      type: 'date',
      from: 'puppy',
      required: true,
    },
    {
      token: 'microchip',
      label: 'Nº de microchip',
      type: 'text',
      from: 'puppy',
      placeholder: '15 dígitos',
      required: true,
    },
    {
      token: 'registration',
      label: 'Nº de registro / LOE',
      type: 'text',
      from: 'puppy',
      placeholder: 'Si está inscrito en un club',
    },
  ],
}

const MONEY_SECTION: ContractSection = {
  id: 'money',
  title: 'Importes',
  icon: 'euro',
  fields: [
    {
      token: 'totalPrice',
      label: 'Precio total del cachorro',
      type: 'currency',
      from: 'lead',
      placeholder: '1500',
      help: 'Lo que pagará el cliente en total, IVA incluido si procede.',
      required: true,
    },
    {
      token: 'depositAmount',
      label: 'Importe de la señal / reserva',
      type: 'currency',
      from: 'lead',
      placeholder: '300',
      help: 'Lo que el cliente entrega ahora. NO reembolsable según contrato.',
      required: true,
    },
    {
      token: 'finalAmount',
      label: 'Importe pendiente / final',
      type: 'currency',
      from: 'auto',
      help: 'Se calcula automáticamente: precio total − señal.',
    },
  ],
}

const DATES_SECTION: ContractSection = {
  id: 'dates',
  title: 'Fechas',
  icon: 'calendar',
  fields: [
    {
      token: 'todayDate',
      label: 'Fecha de firma',
      type: 'date',
      from: 'auto',
      help: 'Por defecto, hoy. Cámbiala si el contrato es retroactivo.',
    },
    {
      token: 'reservationDate',
      label: 'Fecha de la reserva original',
      type: 'date',
      from: 'lead',
      help: 'Solo para el contrato de entrega — referencia al contrato de reserva firmado en su día.',
    },
  ],
}

const KENNEL_INFO_SECTION: ContractSection = {
  id: 'kennel-info',
  title: 'Datos del criadero',
  hint: 'Se rellenan automáticamente desde tus datos legales. Para cambiarlos ve a Mi criadero → Datos legales.',
  icon: 'building',
  fields: [
    { token: 'legalName', label: 'Razón social', type: 'text', from: 'kennel' },
    { token: 'legalId', label: 'NIF / CIF', type: 'text', from: 'kennel' },
    { token: 'legalAddress', label: 'Domicilio', type: 'text', from: 'kennel' },
    { token: 'representative', label: 'Representante legal', type: 'text', from: 'kennel' },
    { token: 'representativeId', label: 'DNI del representante', type: 'text', from: 'kennel' },
    { token: 'signCity', label: 'Ciudad de firma', type: 'text', from: 'kennel' },
    { token: 'jurisdiction', label: 'Jurisdicción', type: 'text', from: 'kennel' },
  ],
}

// ─── Schemas por kind ───────────────────────────────────────────────────────

/**
 * Schema del CONTRATO DE RESERVA.
 * Se firma al pagar la señal, antes de tener el cachorro asignado.
 * Por eso no incluye la sección "Cachorro asignado".
 */
export const RESERVATION_FIELD_SCHEMA: ContractSection[] = [
  KENNEL_INFO_SECTION,
  CLIENT_SECTION,
  PREFS_SECTION,
  MONEY_SECTION,
  DATES_SECTION,
]

/**
 * Schema del CONTRATO DE COMPRAVENTA Y ENTREGA.
 * Se firma al entregar el cachorro físico. Aquí ya sabemos qué perro
 * concreto se entrega.
 */
export const DELIVERY_FIELD_SCHEMA: ContractSection[] = [
  KENNEL_INFO_SECTION,
  CLIENT_SECTION,
  PUPPY_SECTION,
  PREFS_SECTION,
  MONEY_SECTION,
  DATES_SECTION,
]

export function getFieldSchema(kind: 'reservation' | 'delivery'): ContractSection[] {
  return kind === 'delivery' ? DELIVERY_FIELD_SCHEMA : RESERVATION_FIELD_SCHEMA
}

/** Set de tokens "conocidos" — usado para distinguir variables extras
 *  custom del criador en su plantilla. */
export function getKnownTokens(): Set<string> {
  const all = new Set<string>()
  for (const sec of DELIVERY_FIELD_SCHEMA) {
    for (const f of sec.fields) all.add(f.token)
  }
  for (const sec of RESERVATION_FIELD_SCHEMA) {
    for (const f of sec.fields) all.add(f.token)
  }
  return all
}
