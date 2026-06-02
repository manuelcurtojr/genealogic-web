// i18n content pack 9 — selector de raza en el formulario de contacto público
// del criadero (withBreedField en lib/kennel/contact-form.ts).
// El label del select inyectado y la opción "Todas las razas" se renderizan
// tal cual desde la config, por eso los 3 renderizadores del formulario
// envuelven field.label y las options en t(). Clave = español EXACTO ('es' base).

export const content9BreedField: Record<string, Record<string, string>> = {
  en: {
    'Raza de interés': 'Breed of interest',
    'Todas las razas': 'All breeds',
  },
}
