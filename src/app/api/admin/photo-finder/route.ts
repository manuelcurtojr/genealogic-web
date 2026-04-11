import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

async function getAdminSupabase() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not admin')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Search presadb for a dog by name and return photo URLs
async function searchPresadb(dogName: string): Promise<{ profileUrl: string; photos: string[] } | null> {
  // Normalize name for search — strip accents and apostrophes for slug
  const searchName = dogName.toLowerCase().replace(/[''`']/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const slug = searchName.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')

  // Try direct URL patterns for presadb
  const patterns = [
    `https://presadb.com/dogocanario/${slug}`,
  ]

  // Try direct URLs first
  for (const url of patterns) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000), redirect: 'follow',
      })
      if (res.ok) {
        const html = await res.text()
        // Verify it's the right dog — check first significant word of name
        const firstWord = dogName.replace(/[''`']/g, '').split(' ')[0]
        if (html.toLowerCase().includes(firstWord.toLowerCase())) {
          const photos = extractPhotos(html)
          if (photos.length > 0) return { profileUrl: url, photos }
        }
      }
    } catch {}
  }

  // Try search page fallback
  try {
    const res = await fetch(`https://presadb.com/search?q=${encodeURIComponent(dogName)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000), redirect: 'follow',
    })
    if (res.ok) {
      const html = await res.text()
      // Find first matching dog link
      const linkMatch = html.match(/href=["'](\/dogocanario\/[^"']+)["'][^>]*>[\s\S]*?(?:${dogName.split(' ')[0]})/i)
      if (linkMatch) {
        const dogUrl = `https://presadb.com${linkMatch[1]}`
        const dogRes = await fetch(dogUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        })
        if (dogRes.ok) {
          const dogHtml = await dogRes.text()
          const photos = extractPhotos(dogHtml)
          if (photos.length > 0) return { profileUrl: dogUrl, photos }
        }
      }
    }
  } catch {}

  return null
}

function extractPhotos(html: string): string[] {
  const photos: string[] = []
  // Find gallery/main photos (350x350 or 1000x1000 — NOT 100x100 pedigree thumbs)
  const regex = /(?:src|href|data-src|data-image)=["']((?:https?:\/\/presadb\.com)?\/tn\/(?:350x350|1000x1000)\/dogs\/photo_\d+\.(?:jpg|jpeg|png))["']/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    let url = match[1]
    // Convert to full-quality URL (remove /tn/XXXxXXX/)
    url = url.replace(/\/tn\/\d+x\d+\//, '/')
    if (!url.startsWith('http')) url = `https://presadb.com${url}`
    if (!photos.includes(url)) photos.push(url)
  }
  return photos
}

export async function POST(request: NextRequest) {
  try {
    const sb = await getAdminSupabase()
    const body = await request.json()

    if (body.action === 'search') {
      // Search for a single dog's photos
      const { dogName } = body
      if (!dogName) return NextResponse.json({ error: 'Missing dogName' }, { status: 400 })
      const result = await searchPresadb(dogName)
      return NextResponse.json({ success: true, result })
    }

    if (body.action === 'import-photos') {
      // Download and import photos for a dog
      const { dogId, photoUrls } = body
      if (!dogId || !photoUrls?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

      let imported = 0
      for (let i = 0; i < photoUrls.length; i++) {
        // Convert to highest quality available (1000x1000) — presadb doesn't serve originals
        let photoUrl = photoUrls[i]
        if (photoUrl.includes('presadb.com') && !photoUrl.includes('/tn/')) {
          photoUrl = photoUrl.replace('/dogs/', '/tn/1000x1000/dogs/')
        }
        try {
          // Download image
          const imgRes = await fetch(photoUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(10000),
          })
          if (!imgRes.ok) continue

          const buffer = await imgRes.arrayBuffer()
          const ext = photoUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg'
          const fileName = `${dogId}/${Date.now()}-${i}.${ext}`

          // Upload to Supabase Storage
          const { error: uploadErr } = await sb.storage.from('dog-photos').upload(fileName, Buffer.from(buffer), {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true,
          })
          if (uploadErr) continue

          const { data: urlData } = sb.storage.from('dog-photos').getPublicUrl(fileName)
          const publicUrl = urlData.publicUrl

          if (i === 0) {
            // First photo = thumbnail
            await sb.from('dogs').update({ thumbnail_url: publicUrl }).eq('id', dogId)
          }

          // Add to dog_photos table
          const { data: maxPos } = await sb.from('dog_photos').select('position').eq('dog_id', dogId).order('position', { ascending: false }).limit(1)
          const nextPos = ((maxPos?.[0]?.position || 0) + 1)

          await sb.from('dog_photos').insert({
            dog_id: dogId, url: publicUrl, storage_path: fileName, position: nextPos,
          })

          imported++
        } catch {}
      }

      return NextResponse.json({ success: true, imported })
    }

    if (body.action === 'save-photo-urls') {
      // Save external URLs directly (no download — presadb URLs are stable)
      const { dogId, urls } = body
      if (!dogId || !urls?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

      let imported = 0
      for (let i = 0; i < urls.length; i++) {
        try {
          if (i === 0) {
            await sb.from('dogs').update({ thumbnail_url: urls[0] }).eq('id', dogId)
          }
          const { data: maxPos } = await sb.from('dog_photos').select('position').eq('dog_id', dogId).order('position', { ascending: false }).limit(1)
          await sb.from('dog_photos').insert({
            dog_id: dogId, url: urls[i], storage_path: null, position: (maxPos?.[0]?.position || 0) + 1,
          })
          imported++
        } catch {}
      }
      return NextResponse.json({ success: true, imported })
    }

    if (body.action === 'import-photos-base64') {
      // Photos already downloaded by client browser, received as base64
      const { dogId, photos } = body
      if (!dogId || !photos?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

      let imported = 0
      for (let i = 0; i < photos.length; i++) {
        const { base64, ext } = photos[i]
        try {
          const buffer = Buffer.from(base64, 'base64')
          const fileName = `${dogId}/${Date.now()}-${i}.${ext}`

          const { error: uploadErr } = await sb.storage.from('dog-photos').upload(fileName, buffer, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true,
          })
          if (uploadErr) continue

          const { data: urlData } = sb.storage.from('dog-photos').getPublicUrl(fileName)
          const publicUrl = urlData.publicUrl

          if (i === 0) {
            await sb.from('dogs').update({ thumbnail_url: publicUrl }).eq('id', dogId)
          }

          const { data: maxPos } = await sb.from('dog_photos').select('position').eq('dog_id', dogId).order('position', { ascending: false }).limit(1)
          await sb.from('dog_photos').insert({
            dog_id: dogId, url: publicUrl, storage_path: fileName, position: (maxPos?.[0]?.position || 0) + 1,
          })
          imported++
        } catch {}
      }
      return NextResponse.json({ success: true, imported })
    }

    if (body.action === 'list-dogs-without-photos') {
      // Get dogs that need photos
      const { limit = 50, offset = 0 } = body

      // Dogs with no photo or presadb thumbnail (100x100)
      const { data: dogs, count } = await sb.from('dogs')
        .select('id, name, thumbnail_url, breed:breeds(name)', { count: 'exact' })
        .or('thumbnail_url.is.null,thumbnail_url.ilike.%presadb%tn/100x100%')
        .order('name')
        .range(offset, offset + limit - 1)

      return NextResponse.json({ success: true, dogs: dogs || [], total: count || 0 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes('admin') ? 403 : 500 })
  }
}
