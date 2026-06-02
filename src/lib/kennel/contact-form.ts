/**
 * Tipos + plantillas + helpers del formulario de contacto público
 * configurable por el criador. La config vive en kennels.contact_form_config
 * y se usa en /kennels/[slug], /c/[slug] y POST /api/contact-kennel.
 */

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox'

/** Mapeo opcional a una columna canónica de puppy_reservations. Si no
 *  hay map_to, el valor se guarda en applicant_extra_data (JSONB). */
export type FieldMap =
  | 'applicant_name'
  | 'applicant_email'
  | 'applicant_phone'
  | 'applicant_message'
  | 'applicant_purpose'
  | 'applicant_country'
  | 'applicant_city'
  | 'preference_sex'
  | 'preference_color'

export interface FormField {
  id: string                 // único en el form (ej. "puppy_sex")
  type: FieldType
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]         // para select / radio / checkbox
  rows?: number              // para textarea (default 4)
  helper?: string            // texto ayuda debajo
  map_to?: FieldMap          // a qué columna canónica de la reserva mapea
}

export interface ContactFormConfig {
  template: 'generic' | 'breeding' | 'custom'
  title?: string
  subtitle?: string
  submit_label?: string
  success_message?: string
  fields: FormField[]
}

// ─── Plantillas preconfiguradas ────────────────────────────────────────

/** Plantilla genérica: nombre, email, teléfono, mensaje. */
export const TEMPLATE_GENERIC: ContactFormConfig = {
  template: 'generic',
  submit_label: 'Enviar solicitud',
  success_message: '¡Solicitud enviada! Te responderemos pronto.',
  fields: [
    { id: 'name', type: 'text', label: 'Nombre', required: true, map_to: 'applicant_name' },
    { id: 'email', type: 'email', label: 'Email', required: true, map_to: 'applicant_email' },
    { id: 'phone', type: 'tel', label: 'Teléfono', required: false, map_to: 'applicant_phone' },
    { id: 'message', type: 'textarea', label: 'Mensaje', required: true, rows: 4, placeholder: 'Cuéntanos qué buscas...', map_to: 'applicant_message' },
  ],
}

/** Plantilla enfocada a cría: añade preguntas para distinguir tipo de
 *  comprador (color/sexo/función) — útil para filtrar leads serios. */
export const TEMPLATE_BREEDING: ContactFormConfig = {
  template: 'breeding',
  submit_label: 'Enviar solicitud',
  success_message: '¡Solicitud enviada! Revisaremos tu perfil y te contactaremos pronto.',
  fields: [
    { id: 'name', type: 'text', label: 'Nombre', required: true, map_to: 'applicant_name' },
    { id: 'email', type: 'email', label: 'Email', required: true, map_to: 'applicant_email' },
    { id: 'phone', type: 'tel', label: 'Teléfono', required: false, map_to: 'applicant_phone' },
    { id: 'puppy_sex', type: 'radio', label: 'Sexo preferido', options: ['Macho', 'Hembra', 'Indiferente'], map_to: 'preference_sex' },
    { id: 'puppy_color', type: 'text', label: 'Color preferido', placeholder: 'Ej. bardino, leonado, atigrado...', map_to: 'preference_color' },
    {
      id: 'purpose',
      type: 'select',
      label: 'Función del cachorro',
      required: true,
      options: ['Compañía familiar', 'Guarda y defensa', 'Trabajo intensivo'],
      helper: 'Nos ayuda a recomendarte el perro más adecuado.',
      map_to: 'applicant_purpose',
    },
    {
      id: 'message',
      type: 'textarea',
      label: 'Cuéntanos sobre ti',
      required: true,
      rows: 5,
      placeholder: 'Tu experiencia con perros, tipo de vivienda, otros perros en casa, etc.',
      map_to: 'applicant_message',
    },
  ],
}

/** Plantilla "custom" arranca igual que generic — el criador la edita libremente */
export const TEMPLATE_CUSTOM: ContactFormConfig = {
  ...TEMPLATE_GENERIC,
  template: 'custom',
}

export const TEMPLATES: Record<ContactFormConfig['template'], ContactFormConfig> = {
  generic: TEMPLATE_GENERIC,
  breeding: TEMPLATE_BREEDING,
  custom: TEMPLATE_CUSTOM,
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Devuelve la config efectiva del kennel; si no tiene, usa la genérica. */
export function getEffectiveConfig(raw: unknown): ContactFormConfig {
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).fields) && (raw as any).fields.length > 0) {
    return raw as ContactFormConfig
  }
  return TEMPLATE_GENERIC
}

/**
 * Inyecta un selector de "Raza de interés" en el formulario, poblado con las
 * razas que el criador tiene marcadas como reproductor. Así el criador sabe
 * por qué raza preguntan los leads.
 *
 * Reglas:
 *  - Solo añade el campo si hay >= 2 razas (con 1 sola el selector no aporta).
 *  - El campo NO lleva `map_to` → su valor cae en applicant_extra_data como
 *    { preference_breed: { label, value } } sin tocar endpoint ni esquema.
 *  - Se coloca tras el primer campo (normalmente "Nombre") para que quede
 *    natural arriba del form.
 *  - Idempotente: si ya existe un campo con id 'preference_breed' (porque el
 *    criador lo añadió a mano, o por doble aplicación), devuelve la config
 *    sin duplicar.
 *
 * Devuelve siempre una config "efectiva" (pasa por getEffectiveConfig).
 */
export function withBreedField(
  rawConfig: unknown,
  breedNames: string[],
): ContactFormConfig {
  const config = getEffectiveConfig(rawConfig)
  if (
    breedNames.length < 2 ||
    config.fields.some((f) => f.id === 'preference_breed')
  ) {
    return config
  }

  const breedField: FormField = {
    id: 'preference_breed',
    type: 'select',
    label: 'Raza de interés',
    required: false,
    options: [...breedNames, 'Todas las razas'],
  }

  // Insertar tras el primer campo (o al principio si está vacío).
  const fields = [...config.fields]
  const insertAt = fields.length > 0 ? 1 : 0
  fields.splice(insertAt, 0, breedField)

  return { ...config, fields }
}

/**
 * Separa los valores del form en: campos canónicos (mapeados a columnas)
 * y resto (irán a applicant_extra_data JSONB).
 */
export function splitFormValues(
  config: ContactFormConfig,
  values: Record<string, any>,
): { canonical: Partial<Record<FieldMap, any>>; extra: Record<string, any> } {
  const canonical: Partial<Record<FieldMap, any>> = {}
  const extra: Record<string, any> = {}
  for (const field of config.fields) {
    const v = values[field.id]
    if (v === undefined || v === null || v === '') continue
    if (field.map_to) {
      canonical[field.map_to] = v
    } else {
      extra[field.id] = { label: field.label, value: v }
    }
  }
  return { canonical, extra }
}

/** Valida campos required y email format. Devuelve [errors, ok]. */
export function validateForm(
  config: ContactFormConfig,
  values: Record<string, any>,
): { errors: Record<string, string>; ok: boolean } {
  const errors: Record<string, string> = {}
  for (const field of config.fields) {
    const v = values[field.id]
    if (field.required && (v === undefined || v === null || v === '')) {
      errors[field.id] = 'Este campo es obligatorio.'
      continue
    }
    if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors[field.id] = 'Email inválido.'
    }
  }
  return { errors, ok: Object.keys(errors).length === 0 }
}
