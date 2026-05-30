/**
 * Merge de los 3 kennels relacionados con "El Zumacán":
 *   - Zumacán  (0b45e4ef...) → 1 perro
 *   - Zumacan  (caca82c3...) → 19 perros
 *   - Zcan Presa Canario (31f1ce2b...) → 0 perros, owner real + logo ✓ GANADOR
 *
 * Acciones:
 *   1. Verificar FK relacionadas con los kennels duplicados
 *   2. UPDATE dogs.kennel_id de los 2 duplicados → ganador (31f1ce2b)
 *   3. UPDATE kennel ganador: name="El Zumacán", slug="el-zumacan", affix_format="suffix_del"
 *   4. DELETE de los 2 kennels duplicados
 *
 * Pasa --apply para ejecutar de verdad. Sin flag, es dry-run.
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const WINNER = '31f1ce2b-a2a8-43d5-a004-1a3be5822125' // Zcan Presa Canario
const LOSERS = [
  '0b45e4ef-1693-4e59-97a2-628016930573', // Zumacán
  'caca82c3-4731-48e4-bbad-7f295353505d', // Zumacan
]
const APPLY = process.argv.includes('--apply')

console.log(APPLY ? '═══ MODO APPLY ═══' : '═══ DRY RUN (pasa --apply para ejecutar) ═══')
console.log()

// 1) Listar perros en los 2 duplicados
const { data: dogsLose } = await supabase
  .from('dogs')
  .select('id, name, kennel_id')
  .in('kennel_id', LOSERS)
console.log(`Perros en los 2 duplicados: ${dogsLose.length}`)

// 2) ¿Hay otras tablas con FK a kennels? Vamos a ver las relacionadas comunes
const fkChecks = ['breeders', 'invitations', 'kennel_admins', 'litters', 'subscription', 'user_kennels']
for (const t of fkChecks) {
  try {
    const { count, error } = await supabase.from(t).select('id', { count: 'exact', head: true }).in('kennel_id', LOSERS)
    if (!error) console.log(`  ${t}.kennel_id en duplicados: ${count}`)
  } catch {}
}

// 3) ¿Otras refs? owner_id, etc.
const { data: dogsByOwner } = await supabase
  .from('dogs')
  .select('id, name, kennel_id, owner_id')
  .in('kennel_id', LOSERS)
console.log(`\nEjemplos a reasignar (primeros 5):`)
dogsLose.slice(0, 5).forEach(d => console.log(`  · ${d.name}  (kennel ${d.kennel_id.slice(0,8)}...)`))

if (!APPLY) {
  console.log(`\nDRY RUN. Lo que haría:`)
  console.log(`  · UPDATE dogs SET kennel_id='${WINNER}' WHERE kennel_id IN (${LOSERS.map(l => `'${l.slice(0,8)}…'`).join(', ')})  → ${dogsLose.length} filas`)
  console.log(`  · UPDATE kennels SET name='El Zumacán', slug='el-zumacan', affix_format='suffix_del' WHERE id='${WINNER}'`)
  console.log(`  · DELETE FROM kennels WHERE id IN (los 2 perdedores)`)
  process.exit(0)
}

console.log('\n→ Aplicando…\n')

// PASO 1: reasignar perros
const { error: dogsErr, count: dogsUpdated } = await supabase
  .from('dogs')
  .update({ kennel_id: WINNER })
  .in('kennel_id', LOSERS)
  .select('id', { count: 'exact' })
if (dogsErr) { console.error('Error reasignando perros:', dogsErr); process.exit(1) }
console.log(`✓ Reasignados ${dogsUpdated} perros al kennel ganador`)

// PASO 2: rename + slug del ganador
const { error: renameErr } = await supabase
  .from('kennels')
  .update({
    name: 'El Zumacán',
    slug: 'el-zumacan',
    affix_format: 'suffix_del',
  })
  .eq('id', WINNER)
if (renameErr) { console.error('Error renombrando kennel:', renameErr); process.exit(1) }
console.log(`✓ Kennel renombrado: name="El Zumacán", slug="el-zumacan"`)

// PASO 3: borrar duplicados
const { error: delErr } = await supabase
  .from('kennels')
  .delete()
  .in('id', LOSERS)
if (delErr) { console.error('Error borrando duplicados:', delErr); process.exit(1) }
console.log(`✓ Borrados ${LOSERS.length} kennels duplicados`)

console.log(`\n═══ DONE ═══`)
console.log(`Kennel final: El Zumacán (id=${WINNER}, slug=el-zumacan)`)
console.log(`Perros del kennel: ${dogsLose.length}`)
console.log(`Owner conservado, logo conservado.`)
