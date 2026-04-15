#!/usr/bin/env node
/**
 * Photo Finder — runs from YOUR Mac (not Vercel)
 * Downloads photos from presadb in 1000x1000 quality and uploads to Supabase Storage
 *
 * Usage: node scripts/import-photos.mjs [--limit 50] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually (no dotenv dependency needed)
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const envVars = Object.fromEntries(envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] }))

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE env vars in .env.local'); process.exit(1) }
const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const limit = parseInt(args.find((a, i) => args[i - 1] === '--limit') || '50')
const dryRun = args.includes('--dry-run')

function buildSlug(name) {
  return name.toLowerCase().replace(/[''`']/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
}

function extractPhotos(html) {
  const photos = []
  const seen = new Set()
  const regex = /(?:src|href|data-src|data-image)=["']((?:https?:\/\/presadb\.com)?\/tn\/(?:350x350|1000x1000)\/dogs\/photo_\d+\.(?:jpg|jpeg|png))["']/gi
  let m
  while ((m = regex.exec(html)) !== null) {
    let url = m[1]
    if (!url.startsWith('http')) url = `https://presadb.com${url}`
    // Convert to 1000x1000
    url = url.replace(/\/tn\/\d+x\d+\//, '/tn/1000x1000/')
    if (!seen.has(url)) { seen.add(url); photos.push(url) }
  }
  return photos
}

async function fetchPresadb(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    signal: AbortSignal.timeout(10000),
    redirect: 'follow',
  })
  return res
}

async function main() {
  console.log(`\n🔍 Buscador de fotos — ejecutando desde tu Mac`)
  console.log(`   Limit: ${limit} perros${dryRun ? ' (DRY RUN)' : ''}\n`)

  // Get dogs without photos or with low-quality presadb thumbnails
  const { data: dogs, count } = await sb.from('dogs')
    .select('id, name, thumbnail_url', { count: 'exact' })
    .or('thumbnail_url.is.null,thumbnail_url.ilike.%presadb%tn/100x100%')
    .order('name')
    .limit(limit)

  console.log(`📋 ${count} perros sin foto en total, procesando ${dogs.length}\n`)

  let found = 0, imported = 0, notFound = 0, errors = 0

  for (let i = 0; i < dogs.length; i++) {
    const dog = dogs[i]
    const slug = buildSlug(dog.name)
    const progress = `[${i + 1}/${dogs.length}]`

    // Search presadb
    try {
      const presadbUrl = `https://presadb.com/dogocanario/${slug}`
      const res = await fetchPresadb(presadbUrl)

      if (!res.ok) {
        console.log(`${progress} ❌ ${dog.name} — no encontrado (${res.status})`)
        notFound++
        continue
      }

      const html = await res.text()
      const firstWord = dog.name.replace(/[''`']/g, '').split(' ')[0]
      if (!html.toLowerCase().includes(firstWord.toLowerCase())) {
        console.log(`${progress} ❌ ${dog.name} — pagina no coincide`)
        notFound++
        continue
      }

      const photos = extractPhotos(html)
      if (photos.length === 0) {
        console.log(`${progress} ⚪ ${dog.name} — sin fotos en presadb`)
        notFound++
        continue
      }

      found++
      console.log(`${progress} 📸 ${dog.name} — ${photos.length} fotos encontradas`)

      if (dryRun) continue

      // Download and upload each photo
      let dogImported = 0
      for (let j = 0; j < photos.length; j++) {
        try {
          const imgRes = await fetchPresadb(photos[j])
          if (!imgRes.ok) continue

          const buffer = Buffer.from(await imgRes.arrayBuffer())
          if (buffer.length < 2000) continue // too small

          const ext = photos[j].match(/\.(jpg|jpeg|png)/i)?.[1] || 'jpg'
          const fileName = `${dog.id}/${Date.now()}-${j}.${ext}`

          const { error: uploadErr } = await sb.storage.from('dog-photos').upload(fileName, buffer, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true,
          })
          if (uploadErr) { console.log(`   ⚠️  Upload error: ${uploadErr.message}`); continue }

          const { data: urlData } = sb.storage.from('dog-photos').getPublicUrl(fileName)

          // First photo = thumbnail
          if (j === 0) {
            await sb.from('dogs').update({ thumbnail_url: urlData.publicUrl }).eq('id', dog.id)
          }

          // Add to gallery
          const { data: maxPos } = await sb.from('dog_photos').select('position').eq('dog_id', dog.id).order('position', { ascending: false }).limit(1)
          await sb.from('dog_photos').insert({
            dog_id: dog.id, url: urlData.publicUrl, storage_path: fileName, position: (maxPos?.[0]?.position || 0) + 1,
          })

          dogImported++
        } catch (e) { /* skip this photo */ }
      }

      if (dogImported > 0) {
        imported++
        console.log(`   ✅ ${dogImported} fotos importadas a Storage`)
      }

      // Small delay to not hammer presadb
      await new Promise(r => setTimeout(r, 500))

    } catch (e) {
      console.log(`${progress} ⚠️  ${dog.name} — error: ${e.message}`)
      errors++
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   Procesados: ${dogs.length}`)
  console.log(`   Con fotos: ${found}`)
  console.log(`   Importados: ${imported}`)
  console.log(`   No encontrados: ${notFound}`)
  console.log(`   Errores: ${errors}`)
  console.log()
}

main().catch(console.error)
