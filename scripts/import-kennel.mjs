import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const envVars = Object.fromEntries(envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] }))
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
const ANTHROPIC_KEY = (await sb.from('platform_settings').select('value').eq('key', 'ANTHROPIC_API_KEY').single()).data.value

const EXTRACTION_PROMPT = `You are a dog pedigree data extractor. Extract the complete pedigree information from this content.
Return a JSON object with this EXACT structure:
{"main_dog":{"name":"string","sex":"Male" or "Female","registration":"string or null","breed":"string or null","color":"string or null","birth_date":"YYYY-MM-DD or YYYY or null","health":"string or null","photo_url":"string or null","father_name":"exact name or null","mother_name":"exact name or null"},"ancestors":[{"name":"string","sex":"Male" or "Female","registration":"string or null","breed":"string or null","color":"string or null","birth_date":"YYYY-MM-DD or YYYY or null","health":"string or null","photo_url":"string or null","father_name":"string or null","mother_name":"string or null","generation":number}]}
Rules: Extract ALL dogs. Names EXACT. Return ONLY JSON, no markdown.`

function normName(s) { return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''`']/g, '').replace(/\s+/g, ' ') }

function cleanHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const ctx = `MAIN DOG PAGE: ${titleMatch?.[1] || ''} ${h1Match?.[1]?.replace(/<[^>]+>/g, '') || ''}`
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)]
  if (tables.length > 0) {
    const largest = tables.reduce((a, b) => a[0].length > b[0].length ? a : b)
    if (largest[0].length > 5000) {
      const t = largest[0].replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '[IMG:$1]').replace(/\s(class|style|width|height|bgcolor|align|valign|border|cellpadding|cellspacing)=["'][^"']*["']/gi, (m, a) => (a === 'rowspan' || a === 'colspan') ? m : '').replace(/\s{2,}/g, ' ')
      const bs = html.indexOf('<body'), ts = html.indexOf(largest[0])
      let info = ''
      if (bs >= 0 && ts > bs) info = html.substring(bs, ts).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '[PHOTO:$1]').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 3000)
      if (t.length < 120000) return `${ctx}\n\nDOG INFO: ${info}\n\nPEDIGREE TABLE:\n${t}`
    }
  }
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/\s{2,}/g, ' ').slice(0, 60000)
}

function extractPhotos(html) {
  const photos = [], seen = new Set()
  const regex = /(?:src|href|data-src|data-image)=["']((?:https?:\/\/presadb\.com)?\/tn\/(?:350x350|1000x1000)\/dogs\/photo_\d+\.(?:jpg|jpeg|png))["']/gi
  let m
  while ((m = regex.exec(html)) !== null) {
    let url = m[1]; if (!url.startsWith('http')) url = `https://presadb.com${url}`
    url = url.replace(/\/tn\/\d+x\d+\//, '/tn/1000x1000/')
    if (!seen.has(url)) { seen.add(url); photos.push(url) }
  }
  return photos
}

const lowerWords = new Set(['de','del','of','von','du','vom','y','the','and','las','los','la','el'])
function titleCase(name) {
  return name.split(' ').map((w, i) => {
    const l = w.toLowerCase()
    if (i > 0 && lowerWords.has(l)) return l
    if (w.includes("'")) return w.split("'").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("'")
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  }).join(' ')
}
const formatName = (n) => n === n.toUpperCase() && n.length > 3 ? titleCase(n) : n

// ---- MAIN ----
console.log('\n🏠 Importando criadero Irema Curtó desde presadb\n')

// 1. Get kennel dogs from presadb
const kennelRes = await fetch('https://presadb.com/irema-curto', { headers: { 'User-Agent': 'Mozilla/5.0' } })
const kennelHtml = await kennelRes.text()
const dogLinks = []
const linkRegex = /href=["'](\/dogocanario\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi
const seenUrls = new Set()
let mm
while ((mm = linkRegex.exec(kennelHtml)) !== null) {
  const path = mm[1], name = mm[2].trim()
  if (!name || name.length < 2 || seenUrls.has(path)) continue
  seenUrls.add(path)
  dogLinks.push({ name, url: `https://presadb.com${path}` })
}
console.log(`📋 ${dogLinks.length} perros en presadb`)

// 2. Check which exist
const { data: allDbDogs } = await sb.from('dogs').select('id, name')
const dbNorms = new Map()
for (const d of allDbDogs) dbNorms.set(normName(d.name), d.id)

const missing = []
let existCount = 0
for (const d of dogLinks) {
  const n = normName(d.name)
  // Try exact norm match
  if (dbNorms.has(n)) { existCount++; continue }
  // Try fuzzy: truncate words
  const words = n.split(' ').filter(w => w.length > 2).map(w => w.slice(0, -1))
  let found = false
  for (const [dbN] of dbNorms) {
    if (words.every(w => dbN.includes(w))) { existCount++; found = true; break }
  }
  if (!found) missing.push(d)
}
console.log(`✅ ${existCount} ya existen · ❌ ${missing.length} por importar\n`)

// 3. Import missing dogs
let imported = 0, errors = 0
const breeds = (await sb.from('breeds').select('id, name')).data || []
const colors = (await sb.from('colors').select('id, name')).data || []
const findBreed = (n) => n ? breeds.find(b => b.name.toLowerCase() === n.toLowerCase())?.id || null : null
const findColor = (n) => n ? colors.find(c => c.name.toLowerCase() === n.toLowerCase())?.id || null : null

for (let i = 0; i < missing.length; i++) {
  const dog = missing[i]
  const progress = `[${i+1}/${missing.length}]`
  
  try {
    // Fetch dog page
    const pageRes = await fetch(dog.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) })
    if (!pageRes.ok) { console.log(`${progress} ❌ ${dog.name} — page ${pageRes.status}`); errors++; continue }
    const rawHtml = await pageRes.text()
    const html = cleanHtml(rawHtml)

    // Call Claude
    console.log(`${progress} 🔍 ${dog.name} — analizando pedigri...`)
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 8000, messages: [{ role: 'user', content: `${EXTRACTION_PROMPT}\n\n${html}` }] }),
    })
    if (claudeRes.status === 529) {
      console.log(`${progress} ⏳ Servidor ocupado, esperando 15s...`)
      await new Promise(r => setTimeout(r, 15000))
      i--; continue
    }
    if (!claudeRes.ok) { console.log(`${progress} ❌ Claude ${claudeRes.status}`); errors++; continue }
    
    const claudeData = await claudeRes.json()
    let text = claudeData.content?.[0]?.text || ''
    const jm = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (jm) text = jm[1]
    const om = text.match(/\{[\s\S]*\}/); if (om) text = om[0]
    const pedigree = JSON.parse(text)
    if (!pedigree?.main_dog?.name) { console.log(`${progress} ❌ No data`); errors++; continue }

    // Create dogs bottom-up (same as confirm-import)
    const allDogs = [...(pedigree.ancestors || []).sort((a, b) => (b.generation || 0) - (a.generation || 0)), { ...pedigree.main_dog, generation: 0 }]
    const nameToId = new Map()
    const createdIds = []
    const mainBreed = pedigree.main_dog.breed || 'Presa Canario'

    // Duplicate detection
    for (const d of allDogs) {
      if (nameToId.has(d.name)) continue
      const n = normName(d.name)
      for (const [dbN, dbId] of dbNorms) {
        const words = n.split(' ').filter(w => w.length > 2).map(w => w.slice(0, -1))
        if (words.length > 0 && words.every(w => dbN.includes(w))) { nameToId.set(d.name, dbId); break }
      }
    }

    // Create new dogs
    for (const d of allDogs) {
      if (nameToId.has(d.name)) continue
      const fatherId = d.father_name ? nameToId.get(d.father_name) || null : null
      const motherId = d.mother_name ? nameToId.get(d.mother_name) || null : null
      const parsedDate = d.birth_date && d.birth_date.length >= 4 ? (d.birth_date.length === 4 ? `${d.birth_date}-01-01` : d.birth_date) : null
      const breedName = d.breed || mainBreed

      const { data: created } = await sb.from('dogs').insert({
        name: formatName(d.name), sex: d.sex === 'Female' ? 'female' : 'male',
        registration: d.registration || null, breed_id: findBreed(breedName), color_id: findColor(d.color),
        birth_date: parsedDate, father_id: fatherId, mother_id: motherId,
        owner_id: null, contributor_id: '89d97ded-1043-4e59-939e-00edecd679b1',
        is_public: false, thumbnail_url: d.photo_url || null,
      }).select('id').single()

      if (created) { nameToId.set(d.name, created.id); createdIds.push(created.id); dbNorms.set(normName(d.name), created.id) }
    }

    // Enrich existing dogs with missing parent links
    for (const d of allDogs) {
      const dogId = nameToId.get(d.name)
      if (!dogId || createdIds.includes(dogId)) continue
      const { data: ex } = await sb.from('dogs').select('father_id, mother_id, registration, breed_id, color_id, birth_date').eq('id', dogId).single()
      if (!ex) continue
      const updates = {}
      if (!ex.father_id && d.father_name && nameToId.has(d.father_name)) updates.father_id = nameToId.get(d.father_name)
      if (!ex.mother_id && d.mother_name && nameToId.has(d.mother_name)) updates.mother_id = nameToId.get(d.mother_name)
      if (!ex.registration && d.registration) updates.registration = d.registration
      if (!ex.breed_id && d.breed) updates.breed_id = findBreed(d.breed)
      if (Object.keys(updates).length > 0) await sb.from('dogs').update(updates).eq('id', dogId)
    }

    // Photos
    const photos = extractPhotos(rawHtml)
    const mainDogId = nameToId.get(pedigree.main_dog.name)
    if (photos.length > 0 && mainDogId && createdIds.includes(mainDogId)) {
      await sb.from('dogs').update({ thumbnail_url: photos[0] }).eq('id', mainDogId)
      for (let j = 0; j < photos.length; j++) {
        const { data: maxPos } = await sb.from('dog_photos').select('position').eq('dog_id', mainDogId).order('position', { ascending: false }).limit(1)
        await sb.from('dog_photos').insert({ dog_id: mainDogId, url: photos[j], storage_path: null, position: (maxPos?.[0]?.position || 0) + 1 })
      }
    }

    console.log(`${progress} ✅ ${formatName(pedigree.main_dog.name)} — ${createdIds.length} nuevos, ${allDogs.length - createdIds.length} existentes, ${photos.length} fotos`)
    imported++
    await new Promise(r => setTimeout(r, 2000))

  } catch (err) {
    console.log(`${progress} ❌ ${dog.name} — ${err.message}`)
    errors++
  }
}

console.log(`\n📊 Resumen:`)
console.log(`   Importados: ${imported}`)
console.log(`   Errores: ${errors}`)
console.log(`   Total en presadb: ${dogLinks.length}`)
console.log(`   Ya existían: ${existCount}`)
