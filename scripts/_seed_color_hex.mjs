/**
 * Seed hex_code para los colores del Presa Canario y Perro de Ganado Majorero.
 *
 * Los nombres son los del estándar canario. Los hex son aproximaciones
 * VISUALES — un atigrado no es un color sólido, pero el círculo lo
 * representa con la tonalidad dominante. Si en el futuro queremos algo
 * más fino se puede sustituir por gradientes en CSS o thumbnails reales.
 */
import { createClient } from '@supabase/supabase-js'
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const COLOR_HEX = {
  'Atigrado':           '#8a6d3b',
  'Atigrado oscuro':    '#5e4a2a',
  'Atigrado claro':     '#b89968',
  'Atigrado reverso':   '#3b2f1d',
  'Bardino oscuro':     '#5d5642',
  'Bardino claro':      '#9a8e6e',
  'Bardino gris':       '#7a7561',
  'Bardino rojo':       '#8a5a3a',
  'Bardino dorado':     '#a3855a',
  'Bardino marrón':     '#6b4f33',
  'Verdino':            '#7a7350',
  'Verdino oscuro':     '#54513a',
  'Cervato':            '#c8a06e',
  'Leonado':            '#d9a063',
  'Negro':              '#1a1a1a',
  'Rojo':               '#9a3e2e',
  'Arena':              '#dbc89a',
  'Caoba':              '#7a3326',
  'Fuego':              '#a04a30',
}

let ok = 0, miss = 0
for (const [name, hex] of Object.entries(COLOR_HEX)) {
  const { data, error } = await s
    .from('colors')
    .update({ hex_code: hex })
    .eq('name', name)
    .select('id')
  if (error) { console.log(`✗ ${name}: ${error.message}`); miss++ }
  else if (!data || data.length === 0) { console.log(`· ${name}: no existe en BD (skip)`); miss++ }
  else { console.log(`✓ ${name} → ${hex}  (${data.length} filas)`); ok++ }
}
console.log(`\nResumen: ${ok} aplicados, ${miss} no encontrados o errores.`)
