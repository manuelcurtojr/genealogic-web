import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Los 3 candidatos
const targets = ['%zumac%', '%zcan%']
const found = new Map()
for (const p of targets) {
  const { data } = await supabase
    .from('kennels')
    .select('*')
    .ilike('name', p)
  ;(data || []).forEach(k => found.set(k.id, k))
}

console.log(`Kennels relacionados: ${found.size}\n`)
for (const k of found.values()) {
  console.log(`═══ ${k.name} (slug=${k.slug})`)
  console.log(`  id: ${k.id}`)
  for (const [key, val] of Object.entries(k)) {
    if (['id','name','slug'].includes(key)) continue
    if (val === null || val === '' || (Array.isArray(val) && !val.length)) continue
    if (typeof val === 'object') console.log(`  ${key}: ${JSON.stringify(val).slice(0,150)}`)
    else console.log(`  ${key}: ${String(val).slice(0,120)}`)
  }
  // Contar perros
  const { count } = await supabase.from('dogs').select('id',{count:'exact',head:true}).eq('kennel_id', k.id)
  console.log(`  → perros asignados: ${count}`)
  console.log()
}
