'use client'

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Search, Globe, AlertTriangle, Check, X, Link2, ArrowLeftRight, Undo2, Sparkles, UploadCloud } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

interface ImportDog {
  name: string; sex: string; registration: string | null; breed: string | null
  color: string | null; birth_date: string | null; health: string | null
  photo_url: string | null; father_name: string | null; mother_name: string | null
  generation?: number; breeder?: string | null; owner?: string | null
}

interface PedigreeData { main_dog: ImportDog; ancestors: ImportDog[] }

interface Props { userId: string; kennelId?: string | null; onImported?: () => void; isAdmin?: boolean }

const CW = 190, CH = 58
const L = 'var(--pedigree-line, rgba(17,17,17,0.18))'

/** Lee un File como base64 puro (sin el prefijo data:...;base64,). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

/**
 * Decodifica un File a un canvas YA ENDEREZADO: aplica orientación EXIF y, si se
 * pasa rotateDeg (0/90/180/270 horario), gira el contenido para dejar el texto
 * recto. Las fotos de móvil de un papel salen giradas 90° y el texto pequeño
 * girado es lo más difícil de leer para la IA.
 */
async function decodeUpright(file: File, rotateDeg = 0): Promise<HTMLCanvasElement | null> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const swap = rotateDeg === 90 || rotateDeg === 270
  const fw = swap ? bitmap.height : bitmap.width
  const fh = swap ? bitmap.width : bitmap.height
  const canvas = document.createElement('canvas')
  canvas.width = fw; canvas.height = fh
  const ctx = canvas.getContext('2d')
  if (!ctx) { bitmap.close?.(); return null }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.translate(fw / 2, fh / 2)
  ctx.rotate((rotateDeg * Math.PI) / 180)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  bitmap.close?.()
  return canvas
}

/** Recorta una región del canvas y la reescala a maxPx (lado largo) → bloque JPEG. */
function canvasRegionToBlock(src: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number, maxPx: number): ImageBlock | null {
  const scale = Math.min(1, maxPx / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h)
  const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
  return data ? { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } } : null
}

/**
 * Bloques de imagen para Claude (ya enderezados con rotateDeg): un PLANO completo
 * a 1568px (estructura del árbol) + si la foto es grande, RECORTES 2×2 con solape
 * a 1568px cada uno → resolución EFECTIVA mayor → el texto denso de una hoja A4
 * (15+ cajas) se vuelve legible. Sin esto una sola imagen a 1568px queda ilegible.
 * Devuelve null si el navegador no decodifica el formato (HEIC en Chrome).
 */
async function buildImageBlocks(file: File, rotateDeg = 0): Promise<ImageBlock[] | null> {
  try {
    const full = await decodeUpright(file, rotateDeg)
    if (!full) return null
    const bw = full.width, bh = full.height, MAX = 1568
    const blocks: ImageBlock[] = []
    const overview = canvasRegionToBlock(full, 0, 0, bw, bh, MAX)
    if (overview) blocks.push(overview)
    if (Math.max(bw, bh) > 1800) {
      const ov = 0.12, cols = 2, rows = 2
      const tw = bw / cols, th = bh / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const sx = Math.max(0, Math.round(c * tw - tw * ov))
          const sy = Math.max(0, Math.round(r * th - th * ov))
          const ex = Math.min(bw, Math.round((c + 1) * tw + tw * ov))
          const ey = Math.min(bh, Math.round((r + 1) * th + th * ov))
          const tile = canvasRegionToBlock(full, sx, sy, ex - sx, ey - sy, MAX)
          if (tile) blocks.push(tile)
        }
      }
    }
    // Guard de payload: el límite de body de Vercel (~4.5MB) incluye el base64.
    // Si nos pasamos, quitamos recortes (los últimos) hasta caber, conservando el
    // plano completo. Mejor menos detalle que un request que falla entero.
    const BUDGET = 3_800_000 // chars de base64 ≈ bytes
    let total = blocks.reduce((s, b) => s + b.source.data.length, 0)
    while (total > BUDGET && blocks.length > 1) {
      total -= blocks.pop()!.source.data.length
    }
    return blocks.length ? blocks : null
  } catch {
    return null
  }
}

/** Miniatura (1024px) para que la IA detecte la rotación antes de extraer. */
async function makeThumbBlock(file: File): Promise<ImageBlock | null> {
  try {
    const full = await decodeUpright(file, 0)
    if (!full) return null
    return canvasRegionToBlock(full, 0, 0, full.width, full.height, 1024)
  } catch {
    return null
  }
}

export default function ImportPedigreeTab({ userId, kennelId, onImported, isAdmin }: Props) {
  const t = useT()
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<PedigreeData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [editedMain, setEditedMain] = useState<ImportDog | null>(null)
  const [editedAncestors, setEditedAncestors] = useState<ImportDog[]>([])
  const [swaps, setSwaps] = useState<Record<string, { id: string; name: string; breed?: string; photo?: string; linked?: boolean; father_name?: string | null; mother_name?: string | null }>>({})
  const [linkedAncestors, setLinkedAncestors] = useState<Map<string, ImportDog[]>>(new Map()) // dogName → DB ancestors
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
  const [swapSearch, setSwapSearch] = useState('')
  const [swapResults, setSwapResults] = useState<any[]>([])
  const [swapSearching, setSwapSearching] = useState(false)
  const [importPhotos, setImportPhotos] = useState(true)
  const [importAncestors, setImportAncestors] = useState(true)
  const [maxGen, setMaxGen] = useState(5)
  const [zoom, setZoom] = useState(100)
  const [genMenu, setGenMenu] = useState(false)
  const [zoomMenu, setZoomMenu] = useState(false)

  const [uploadingImage, setUploadingImage] = useState(false)
  const [scanPhase, setScanPhase] = useState('')
  const [previewSrc, setPreviewSrc] = useState<string | null>(null) // doc borroso para la pantalla de carga
  const [dragActive, setDragActive] = useState(false)
  // Revoca el object URL del preview al cambiar o desmontar (evita memory leaks).
  useEffect(() => {
    return () => { if (previewSrc) URL.revokeObjectURL(previewSrc) }
  }, [previewSrc])
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [overrideBreed, setOverrideBreed] = useState('')
  const [allBreeds, setAllBreeds] = useState<{ id: string; name: string }[]>([])
  const [breedsLoaded, setBreedsLoaded] = useState(false)

  const EXTRACTION_PROMPT = `You are an expert dog pedigree data extractor. Extract the pedigree from the content provided.

LEGIBILITY GATE — read this FIRST. Return EXACTLY {"unreadable": true, "reason": "<short reason in Spanish>"} and nothing else ONLY when the image is blank, is not a dog pedigree, or is so blurry/low-resolution that you cannot read ANY dog name at all.
OTHERWISE, extract what you CAN read: include every dog whose NAME you can actually read. For any single field you cannot read clearly (registration number, date, breed, color…), set it to null — never guess it. NEVER invent, autocomplete, or fabricate a dog NAME to fill an empty slot — leave that branch out instead. A real PARTIAL pedigree (some fields null, some branches missing) is CORRECT and useful; an invented tree is a critical error. The sheet may be rotated or skewed — re-orient mentally and read it anyway.

MULTIPLE IMAGES OF THE SAME SHEET: for photos you may receive the SAME pedigree as several images — first a full OVERVIEW (use it for the tree's overall structure: who descends from whom, and orientation), then several higher-resolution overlapping TILES/crops (use these to actually READ the small text: names, registration numbers, dates). Tiles overlap, so the same dog can appear in the overview and in one or more tiles — it is still ONE dog, list it once. Cross-reference all the images and merge them into ONE coherent pedigree; trust the tiles for exact spelling and numbers.

When the source IS legible, be exhaustive — include every dog whose name you can ACTUALLY READ, no matter how deep in the tree.

OUTPUT — return ONLY this JSON object (no markdown, no prose, no explanation):
{
  "main_dog": {
    "name": "string", "sex": "Male" or "Female", "registration": "string or null",
    "breed": "string or null", "color": "string or null", "birth_date": "YYYY-MM-DD or YYYY or null",
    "health": "string (HD/ED/DCM/PRA results, etc.) or null", "breeder": "string or null", "owner": "string or null",
    "photo_url": "string or null", "father_name": "exact name or null", "mother_name": "exact name or null"
  },
  "ancestors": [
    {
      "name": "string", "sex": "Male" or "Female", "registration": "string or null",
      "breed": "string or null", "color": "string or null", "birth_date": "YYYY-MM-DD or YYYY or null",
      "health": "string or null", "photo_url": "string or null",
      "father_name": "string or null", "mother_name": "string or null",
      "generation": number
    }
  ]
}

CRITICAL RULES:
1. EXTRACT EVERY DOG YOU CAN READ. Even partial info counts — if you can read a name but nothing else, include just the name. But NEVER add a dog whose name you cannot actually read in the source — do not invent dogs to fill empty slots in the tree.
2. PRESERVE NAMES EXACTLY as shown: capitalization, accents (à á è é ñ ç ö ü ø æ etc.), apostrophes, hyphens. Do not "correct" or translate.
3. SEX inference — recognize these synonyms in ANY language:
   - Male: Sire, Father, Padre, Père, Padre, Vater, Otec, Отец, ♂, M
   - Female: Dam, Mother, Madre, Mère, Mãe, Mutter, Matka, Мать, ♀, F
   - In horizontal pedigree tables: upper row = Sire/Male, lower row = Dam/Female (FCI convention)
4. GENERATION — count from main_dog:
   - 1 = parents (2 dogs)
   - 2 = grandparents (4 dogs)
   - 3 = great-grandparents (8 dogs)
   - 4 = great-great-grandparents (16 dogs)
   - 5 = etc. (32 dogs max in typical 5-gen tree)
5. RELATIONSHIPS — father_name / mother_name MUST be the EXACT name of another dog you've listed in main_dog or ancestors[]. If you list "Tornado del Olimpo" as someone's father, "Tornado del Olimpo" MUST appear as a dog entry too. Do not orphan parents.
6. PHOTO_URL — if you see [IMG:URL] or [PHOTO:URL] markers, pick the URL that's most clearly the dog's portrait (not banner/logo/icon). The main dog photo is usually the largest or labeled with "photo".
7. REGISTRATION numbers — common formats include LOE/LO/RKF/AKC/KCSB/SHSB/LOSH followed by digits. Preserve format exactly.
8. BIRTH_DATE — extract any date you see. If only year: "1995". If full date: "1995-03-12". If month+year: "1995-03". If unknown: null.
9. HEALTH — concatenate findings: "HD-A, ED-0, DCM clear" etc. Pick anything that looks like a health certification.
10. TITLES — preserve championship prefixes in the name: "Ch.", "Int.Ch.", "Multi-Ch.", "JCh.", etc. (don't strip them)

BEFORE RETURNING — verify yourself:
- Every father_name in main_dog or ancestors[] appears as an actual entry somewhere
- Every mother_name in main_dog or ancestors[] appears as an actual entry somewhere
- If any link is broken, fix it: either add the missing dog or set the link to null
- The generation numbers are coherent (parents have gen=1, their parents gen=2, etc.)
- No duplicates in ancestors[]
- Same dog with same name only appears ONCE even if shown multiple times (inbreeding)

Return ONLY the JSON object. No \`\`\`json\`\`\` wrapper, no commentary.`

  // Nota: ya no se obtiene la API key en el cliente. Las llamadas a Anthropic
  // pasan por /api/import-pedigree (POST) que es un proxy server-side. La key
  // se queda en el servidor.

  /**
   * Limpia HTML para extracción de pedigree. Maneja:
   *  - Tablas (presadb, pedigreedatabase, k9data, working-dog)
   *  - Layouts modernos con divs (sites que no usan <table>)
   *  - SPAs con scripts grandes y contenido en <main> / <article>
   *  - Fallback: limpia HTML entero y trunca.
   *
   * Estrategia:
   *  1. Extraer contexto del perro (title + h1 + main info)
   *  2. Buscar el "bloque genealogía" — primero tabla, luego div con muchas
   *     fotos/nombres, luego main/article.
   *  3. Aplanar a texto preservando solo lo útil: nombres, fechas, fotos.
   */
  function cleanHtml(html: string): string {
    // ── 1. Strip chrome (scripts, styles, nav, footer, header, aside) ────
    let cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*\/?>/gi, '')
      .replace(/<meta[^>]*\/?>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    // ── 2. Contexto del perro principal: title + h1 + h2 ────────────────
    const titleMatch = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const h1Match = cleaned.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    const h2Match = cleaned.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()
    const ctx = [
      titleMatch ? `TITLE: ${stripTags(titleMatch[1])}` : '',
      h1Match ? `H1: ${stripTags(h1Match[1])}` : '',
      h2Match ? `H2: ${stripTags(h2Match[1])}` : '',
    ].filter(Boolean).join('\n')

    // ── 3. Detectar SPA (HTML inicial casi vacío) ────────────────────────
    const hasBodyContent = (cleaned.match(/<(div|section|main|article|table)[^>]*>/gi) || []).length
    if (hasBodyContent < 5) {
      // El HTML viene sin contenido renderizado. Devolvemos lo que hay y dejamos
      // que el LLM intente extraer del title/meta. El proxy ya habrá intentado
      // ScrapingBee con JS render como fallback.
      return `${ctx}\n\n--- SPA detected, minimal HTML ---\n${cleaned.slice(0, 8000)}`
    }

    // ── 4. Intentar la tabla más grande (formato clásico) ────────────────
    const tables = [...cleaned.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)]
    let pedigreeBlock = ''
    let dogInfoBlock = ''

    if (tables.length > 0) {
      const largest = tables.reduce((a, b) => a[0].length > b[0].length ? a : b)
      if (largest[0].length > 4000) {
        pedigreeBlock = compactBlock(largest[0])
        // Info antes de la tabla (ficha del perro principal)
        const tableStart = cleaned.indexOf(largest[0])
        const bodyStart = cleaned.search(/<(body|main|article)\b/i)
        if (bodyStart >= 0 && tableStart > bodyStart) {
          dogInfoBlock = compactBlock(cleaned.substring(bodyStart, tableStart)).slice(0, 4000)
        }
      }
    }

    // ── 5. Si no hay tabla útil, buscar <main>, <article>, o div con muchas fotos ─
    if (!pedigreeBlock) {
      const mainMatch = cleaned.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i)
      if (mainMatch && mainMatch[0].length > 4000) {
        pedigreeBlock = compactBlock(mainMatch[0])
      } else {
        // Buscar el div con más imágenes (heurística para layouts modernos)
        const divs = [...cleaned.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)]
        let bestDiv = ''
        let bestImgs = 0
        for (const d of divs.slice(0, 200)) {
          const imgs = (d[0].match(/<img\b/gi) || []).length
          if (imgs > bestImgs && d[0].length > 4000 && d[0].length < 100000) {
            bestImgs = imgs
            bestDiv = d[0]
          }
        }
        if (bestImgs >= 4 && bestDiv) {
          pedigreeBlock = compactBlock(bestDiv)
        }
      }
    }

    // ── 6. Si SIGUE sin haber bloque genealogía, devolvemos body limpio ──
    if (!pedigreeBlock) {
      const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        pedigreeBlock = compactBlock(bodyMatch[1]).slice(0, 80000)
      } else {
        pedigreeBlock = compactBlock(cleaned).slice(0, 80000)
      }
    }

    const result = [ctx, dogInfoBlock ? `DOG INFO: ${dogInfoBlock}` : '', `PEDIGREE BLOCK:\n${pedigreeBlock}`]
      .filter(Boolean).join('\n\n')
    return result.length > 130000 ? result.slice(0, 130000) : result
  }

  /** Comprime un bloque HTML preservando rowspan/colspan (vital para árboles) y URLs de imágenes. */
  function compactBlock(html: string): string {
    return html
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '[IMG:$1]')
      // Preserva rowspan/colspan, elimina lo demás
      .replace(/\s(class|style|width|height|bgcolor|align|valign|border|cellpadding|cellspacing|id|onclick|onmouseover|onmouseout|data-[a-z-]+)=["'][^"']*["']/gi, '')
      // Aplana <a href="x">text</a> a "text [LINK:x]" si href es interesante
      .replace(/<a[^>]*href=["']([^"']*\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
        const cleanText = text.replace(/<[^>]+>/g, '').trim()
        return cleanText
      })
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
  }

  async function callClaude(messages: any[], maxTokens = 12000, _retries = 0): Promise<PedigreeData> {
    const res = await fetch('/api/import-pedigree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: maxTokens, messages }),
    })
    if (!res.ok) {
      // Auto-retry on 529 (overloaded) — wait and try again up to 3 times
      if (res.status === 529 && _retries < 3) {
        setScanPhase(`${t('Servidor ocupado, reintentando en')} ${5 + _retries * 5}s...`)
        await new Promise(r => setTimeout(r, (5 + _retries * 5) * 1000))
        return callClaude(messages, maxTokens, _retries + 1)
      }
      // Auto-retry on 429 (rate limit) — esperar lo que dice el servidor
      if (res.status === 429 && _retries < 3) {
        setScanPhase(t('Rate limit, reintentando…'))
        await new Promise(r => setTimeout(r, 6000))
        return callClaude(messages, maxTokens, _retries + 1)
      }
      let detail = ''
      try { const b = await res.json(); detail = b?.error || '' } catch {}
      throw new Error(`${t('Error de IA')} (${res.status}): ${detail || t('Intenta de nuevo')}`)
    }
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const stopReason = data.stop_reason
    if (!text) throw new Error(t('La IA no devolvió respuesta'))

    // If response was truncated, retry with more tokens
    if (stopReason === 'max_tokens' && maxTokens < 16000) {
      return callClaude(messages, 16000)
    }

    let jsonStr = text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]
    const objMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (objMatch) jsonStr = objMatch[0]
    try {
      return JSON.parse(jsonStr)
    } catch {
      // If JSON is malformed and we haven't maxed out, retry with more tokens
      if (maxTokens < 16000) {
        return callClaude(messages, 16000, _retries)
      }
      console.error('Claude stop_reason:', stopReason, 'max_tokens:', maxTokens)
      console.error('Claude raw response:', text.substring(0, 500))
      throw new Error(t('No se pudo interpretar la respuesta de la IA'))
    }
  }

  /**
   * Pregunta a la IA qué rotación HORARIA (0/90/180/270) endereza el documento,
   * usando una miniatura. Llamada directa al proxy (respuesta de texto, no JSON).
   * Si algo falla → 0 (no rotar). Resuelve las fotos de papel giradas 90°, donde
   * el texto pequeño girado es lo más difícil de leer para la IA.
   */
  async function detectRotationDeg(thumb: ImageBlock): Promise<number> {
    try {
      const res = await fetch('/api/import-pedigree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 8,
          messages: [{
            role: 'user',
            content: [
              thumb,
              { type: 'text', text: 'This is a photo of a paper document (a dog pedigree). Reply with ONLY one integer — the CLOCKWISE rotation in degrees needed to make the text upright and horizontally readable: 0, 90, 180, or 270. Output just the number, nothing else.' },
            ],
          }],
        }),
      })
      if (!res.ok) return 0
      const data = await res.json()
      const text = (data.content?.[0]?.text || '').trim()
      const m = text.match(/\d{1,3}/)
      const deg = m ? parseInt(m[0], 10) : 0
      return deg === 90 || deg === 180 || deg === 270 ? deg : 0
    } catch {
      return 0
    }
  }

  /**
   * Verifica la consistencia interna del JSON extraído.
   *  - Todos los father_name / mother_name DEBEN existir como ancestor o como main_dog.
   *  - Las generaciones deben ser coherentes (parents=1, gp=2, etc.).
   *
   * Si encuentra problemas, devuelve la lista. handleScan los usa para
   * decidir si hacer un segundo pase de Claude para corregir.
   */
  function verifyPedigree(data: PedigreeData): { broken: string[]; orphanLinks: number } {
    const allNames = new Set<string>()
    allNames.add(data.main_dog.name)
    for (const a of data.ancestors || []) allNames.add(a.name)

    const broken: string[] = []
    let orphanLinks = 0

    const checkLinks = (dog: { name: string; father_name: string | null; mother_name: string | null }) => {
      if (dog.father_name && !allNames.has(dog.father_name)) {
        broken.push(`"${dog.name}".father_name = "${dog.father_name}" — no aparece en el árbol`)
        orphanLinks++
      }
      if (dog.mother_name && !allNames.has(dog.mother_name)) {
        broken.push(`"${dog.name}".mother_name = "${dog.mother_name}" — no aparece en el árbol`)
        orphanLinks++
      }
    }
    checkLinks(data.main_dog)
    for (const a of data.ancestors || []) checkLinks(a)
    return { broken, orphanLinks }
  }

  function extractImageUrls(html: string): string[] {
    const urls: string[] = []
    const regex = /<img[^>]+src=["']([^"']+)["']/gi
    let m
    while ((m = regex.exec(html)) !== null) {
      const src = m[1]
      if (src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('banner')) urls.push(src)
    }
    return urls
  }

  // Normalize name for fuzzy matching: lowercase, strip accents, collapse spaces
  function normName(s: string | null): string {
    if (!s) return ''
    return s.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[''`]/g, '') // strip apostrophes
      .replace(/\s+/g, ' ') // collapse multiple spaces
  }

  // Build a search pattern for ilike: keep apostrophes (DB has them), strip accents, truncate last char
  // "P'Orum de Irema Curtó" → "%p'oru%irem%curt%"
  function toSearchPattern(name: string): string {
    const normalized = name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // normalize curly apostrophes to straight
      .replace(/\s+/g, ' ')
    const words = normalized.split(/\s+/).filter(w => w.replace(/'/g, '').length > 2)
    const truncated = words.map(w => w.length > 3 ? w.slice(0, -1) : w)
    return `%${truncated.join('%')}%`
  }

  // After extraction, find all dogs that already exist in the DB and auto-link them
  async function findExistingDogs(pedigreeData: PedigreeData): Promise<{ autoSwaps: Record<string, any>; linked: Map<string, ImportDog[]> }> {
    const supabase = createClient()
    const allDogs = [pedigreeData.main_dog, ...(pedigreeData.ancestors || [])]
    const autoSwaps: Record<string, any> = {}
    const linked = new Map<string, ImportDog[]>()

    for (const dog of allDogs) {
      if (dog === pedigreeData.main_dog) continue // skip the main dog — it's the one being imported

      // Fuzzy search: find candidates by key words in name
      const pattern = toSearchPattern(dog.name)
      const { data: candidates } = await supabase
        .from('dogs').select('id, name, sex, thumbnail_url, father_id, mother_id, breed:breeds(name)')
        .ilike('name', pattern).limit(10)
      if (!candidates?.length) continue

      // Match by normalized name — Genealogic is the source of truth, no parent verification needed
      // If multiple candidates, prefer the one with most data (parents linked)
      let match = null
      const dogNorm = normName(dog.name)
      const exactMatches = candidates.filter(c => normName(c.name) === dogNorm)

      if (exactMatches.length === 1) {
        match = exactMatches[0]
      } else if (exactMatches.length > 1) {
        // Multiple dogs with same name — prefer the one with parents (more complete)
        match = exactMatches.find(c => c.father_id || c.mother_id) || exactMatches[0]
      } else if (candidates.length === 1) {
        // Fuzzy match — only one candidate from pattern search
        match = candidates[0]
      }

      if (match) {
        // Fetch real pedigree from DB
        const { data: nodes } = await supabase.rpc('get_pedigree', { dog_uuid: match.id, max_gen: 10 })
        const rootNode = (nodes || []).find((n: any) => n.generation === 0)
        const dbFatherName = rootNode?.father_id ? (nodes || []).find((n: any) => n.id === rootNode.father_id)?.name || null : null
        const dbMotherName = rootNode?.mother_id ? (nodes || []).find((n: any) => n.id === rootNode.mother_id)?.name || null : null

        autoSwaps[dog.name] = {
          id: match.id, name: match.name, breed: (match.breed as any)?.name || null,
          photo: match.thumbnail_url, linked: true,
          father_name: dbFatherName, mother_name: dbMotherName,
        }

        if (nodes?.length) {
          const dbAnc = (nodes || []).filter((n: any) => n.generation > 0).map((n: any) => ({
            name: n.name, sex: n.sex === 'female' ? 'Female' : 'Male',
            registration: n.registration, breed: n.breed_name, color: n.color_name,
            birth_date: null, health: null, photo_url: n.photo_url,
            father_name: (nodes || []).find((p: any) => p.id === n.father_id)?.name || null,
            mother_name: (nodes || []).find((p: any) => p.id === n.mother_id)?.name || null,
            generation: n.generation,
          }))
          linked.set(dog.name, dbAnc)
        }
      }
    }
    return { autoSwaps, linked }
  }

  // Save extraction as draft so it can be resumed if user closes without importing
  async function saveDraft(pedigreeData: PedigreeData, sourceUrl?: string): Promise<string> {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const supabase = createClient()
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'import_draft',
      title: `Borrador: ${pedigreeData.main_dog.name}`,
      message: JSON.stringify({ draftId, pedigreeData, sourceUrl: sourceUrl || null }),
      is_read: false,
    })
    return draftId
  }

  async function deleteDraft(draftId: string) {
    const supabase = createClient()
    const { data: notifs } = await supabase.from('notifications').select('id, message').eq('user_id', userId).eq('type', 'import_draft').limit(50)
    for (const n of (notifs || [])) {
      try { const p = JSON.parse(n.message); if (p.draftId === draftId) { await supabase.from('notifications').delete().eq('id', n.id); break } } catch {}
    }
  }

  async function handleScan() {
    if (!url.trim()) return
    // ── Bloqueo legal: ingrus.net publica un Content-Signal (robots.txt)
    // que prohíbe explícitamente acceso automatizado por ClaudeBot/IA.
    // Respetamos su voluntad. El usuario puede importar manualmente vía
    // screenshot o PDF si tiene los datos de su propio perro.
    try {
      const hostCheck = new URL(url.trim()).hostname.toLowerCase()
      if (hostCheck === 'ingrus.net' || hostCheck.endsWith('.ingrus.net')) {
        setError(t('ingrus.net no autoriza acceso automatizado por inteligencia artificial. Si tienes derecho a los datos del perro, súbelos como screenshot o PDF en la sección de abajo.'))
        return
      }
    } catch { /* URL inválida — handleScan seguirá y mostrará el error genérico */ }
    setScanning(true); setError(''); setData(null); setSwaps({}); setScanPhase(t('Accediendo a la web...'))
    try {
      // Fetch HTML via proxy
      let html: string | null = null
      try {
        const proxyRes = await fetch(`/api/proxy-fetch?url=${encodeURIComponent(url.trim())}`, { signal: AbortSignal.timeout(15000) })
        if (proxyRes.ok) {
          const raw = await proxyRes.text()
          if (raw.length > 3000 && !raw.includes('403 Forbidden')) html = cleanHtml(raw)
        }
      } catch {}
      if (!html) throw new Error(t('No se pudo acceder a la página. Intenta con otra URL o sube un screenshot.'))

      const imgUrls = extractImageUrls(html)

      // Single Claude call — full extraction
      setScanPhase(t('Analizando genealogía con IA...'))
      let pedigreeData = await callClaude([{
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\n--- PAGE HTML ---\n${html}\n\n--- IMAGE URLS FOUND ---\n${imgUrls.slice(0, 15).join('\n')}`,
      }])

      if (!pedigreeData?.main_dog?.name) {
        setError(t('No se pudo extraer datos de esta web. Prueba a subir un screenshot manual de la genealogía.'))
        setScanning(false); setScanPhase(''); return
      }

      // Self-verification: si hay father_name / mother_name "huérfanos" (apuntan a
      // perros que no están en el árbol), pedir a Claude que lo corrija.
      const { broken, orphanLinks } = verifyPedigree(pedigreeData)
      if (orphanLinks > 0 && orphanLinks <= 8) {
        setScanPhase(`${t('Corrigiendo')} ${orphanLinks} ${t('enlaces rotos en el árbol...')}`)
        try {
          const fixed = await callClaude([{
            role: 'user',
            content: `The pedigree JSON you produced has ${orphanLinks} broken parent links — father_name or mother_name pointing to dogs that don't exist in the array. Fix them by either: adding the missing dogs as ancestors (with the right generation), or setting the link to null.\n\nBroken links:\n${broken.join('\n')}\n\nCurrent JSON:\n${JSON.stringify(pedigreeData)}\n\nReturn ONLY the corrected JSON.`,
          }], 12000)
          if (fixed?.main_dog?.name) {
            const reCheck = verifyPedigree(fixed)
            if (reCheck.orphanLinks < orphanLinks) pedigreeData = fixed
          }
        } catch { /* silent — usamos la versión anterior */ }
      }

      // Fallback: if main dog has no photo, find the largest photo from the page
      if (!pedigreeData.main_dog.photo_url) {
        const largePhoto = imgUrls.find(u => u.includes('350') || u.includes('photo')) || imgUrls[0]
        if (largePhoto) pedigreeData.main_dog.photo_url = largePhoto
      }

      // Post-processing: find existing dogs in DB and auto-link them
      setScanPhase(t('Verificando perros existentes...'))
      const { autoSwaps, linked } = await findExistingDogs(pedigreeData)

      // Save draft so it can be resumed
      const draftId = await saveDraft(pedigreeData, url.trim())
      setCurrentDraftId(draftId)

      // Load breeds for selector if not loaded
      if (!breedsLoaded) {
        const supabase2 = createClient()
        const { data: br } = await supabase2.from('breeds').select('id, name').order('name')
        setAllBreeds(br || []); setBreedsLoaded(true)
      }
      setOverrideBreed(pedigreeData.main_dog.breed || '')

      setData(pedigreeData)
      setEditedMain(pedigreeData.main_dog)
      setEditedAncestors(pedigreeData.ancestors || [])
      setSwaps(autoSwaps)
      setLinkedAncestors(linked)
      setShowPreview(true)
    } catch (err: any) { setError(err.message || t('Error al escanear')) }
    setScanning(false); setScanPhase('')
  }

  // El input (clic) y el drag&drop comparten el mismo procesado (processFile).
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-seleccionar el mismo archivo
    if (file) await processFile(file)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    if (uploadingImage || scanning) return
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  async function processFile(file: File) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isImage = file.type.startsWith('image/')
    if (!isPdf && !isImage) {
      setError(t('Formato no soportado. Sube una imagen (JPG/PNG) o un PDF.'))
      return
    }
    // Guard de tamaño para PDF: el body de Vercel ~4.5MB y el base64 infla ×1.33.
    // Las imágenes no necesitan guard (se reescalan); el PDF va tal cual.
    if (isPdf && file.size > 3_500_000) {
      setError(t('El PDF es demasiado grande (máx. ~3,5 MB). Súbelo más ligero, o haz una captura/foto de la página del pedigrí.'))
      return
    }

    // Preview borroso del documento para la pantalla de carga (solo imágenes).
    // El object URL se revoca en el useEffect de limpieza cuando previewSrc cambia.
    setPreviewSrc(isImage ? URL.createObjectURL(file) : null)

    setUploadingImage(true); setError(''); setData(null); setSwaps({})
    setScanPhase(isPdf ? t('Analizando PDF con IA...') : t('Analizando imagen con IA...'))
    try {
      // PDFs van tal cual (Claude los lee nativo, multipágina). Las imágenes se
      // trocean: plano completo + recortes en alta resolución (buildImageBlocks)
      // para que el texto denso de una hoja A4 sea legible y no se invente nada.
      let content: any[]
      let rotationDeg = 0
      if (isPdf) {
        const base64 = await fileToBase64(file)
        content = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ]
      } else {
        // 1) Detectar orientación con una miniatura (las fotos de papel salen
        //    giradas 90° y el texto pequeño girado es lo más difícil de leer).
        setScanPhase(t('Detectando orientación...'))
        const thumb = await makeThumbBlock(file)
        rotationDeg = thumb ? await detectRotationDeg(thumb) : 0
        // 2) Construir bloques ya ENDEREZADOS (plano + recortes en alta resolución).
        setScanPhase(t('Analizando imagen con IA...'))
        const blocks = await buildImageBlocks(file, rotationDeg)
        if (blocks && blocks.length) {
          content = [...blocks, { type: 'text', text: EXTRACTION_PROMPT }]
        } else {
          // El navegador no decodificó la imagen. Si el formato lo acepta la IA
          // (jpeg/png/webp/gif) reintentamos en crudo; si es HEIC/HEIF de iPhone
          // (Brave/Chrome no lo decodifican) damos un mensaje accionable en vez de
          // mandar bytes que la API rechazaría con un error críptico.
          const anthropicOk = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          if (anthropicOk.includes(file.type)) {
            const base64 = await fileToBase64(file)
            content = [
              { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
              { type: 'text', text: EXTRACTION_PROMPT },
            ]
          } else {
            setError(t('No pudimos procesar la imagen. Si es una foto HEIC de iPhone, súbela como JPG: hazle una captura de pantalla, o pon Ajustes › Cámara › Formatos en "Más compatible".'))
            setUploadingImage(false); setScanPhase(''); setPreviewSrc(null); return
          }
        }
      }

      let pedigreeData = await callClaude([{ role: 'user', content }])

      // Si la IA no pudo leer Y habíamos ROTADO la imagen, la detección de
      // orientación pudo equivocarse → reintenta UNA vez con la orientación
      // original (cubre el caso "rotó una foto que ya estaba recta").
      if ((pedigreeData as any)?.unreadable && !isPdf && rotationDeg !== 0) {
        setScanPhase(t('Reintentando con la orientación original...'))
        const blocks0 = await buildImageBlocks(file, 0)
        if (blocks0 && blocks0.length) {
          pedigreeData = await callClaude([{ role: 'user', content: [...blocks0, { type: 'text', text: EXTRACTION_PROMPT }] }])
        }
      }

      // Guardarraíl anti-alucinación: si la IA no pudo leer la imagen, NO mostramos
      // un árbol inventado — pedimos una foto mejor.
      if ((pedigreeData as any)?.unreadable || !pedigreeData?.main_dog?.name) {
        setError(isPdf
          ? t('No se pudo leer el PDF. Asegúrate de que el texto sea nítido (no un escaneo borroso o de baja calidad).')
          : t('No pudimos leer la foto con claridad. Prueba con una imagen más nítida y recta, de cerca, bien iluminada y sin reflejos ni sombras.'))
        setUploadingImage(false); setScanPhase(''); setPreviewSrc(null); return
      }

      // Self-verification igual que en handleScan
      const { broken, orphanLinks } = verifyPedigree(pedigreeData)
      if (orphanLinks > 0 && orphanLinks <= 8) {
        setScanPhase(`${t('Corrigiendo')} ${orphanLinks} ${t('enlaces rotos…')}`)
        try {
          const fixed = await callClaude([{
            role: 'user',
            content: `The pedigree JSON has ${orphanLinks} broken parent links. Fix them.\n\nBroken:\n${broken.join('\n')}\n\nJSON:\n${JSON.stringify(pedigreeData)}\n\nReturn ONLY the corrected JSON.`,
          }], 12000)
          if (fixed?.main_dog?.name && verifyPedigree(fixed).orphanLinks < orphanLinks) {
            pedigreeData = fixed
          }
        } catch {}
      }

      // Post-processing: find existing dogs in DB
      setScanPhase(t('Verificando perros existentes...'))
      const { autoSwaps, linked } = await findExistingDogs(pedigreeData)

      const draftId = await saveDraft(pedigreeData)
      setCurrentDraftId(draftId)

      if (!breedsLoaded) {
        const supabase2 = createClient()
        const { data: br } = await supabase2.from('breeds').select('id, name').order('name')
        setAllBreeds(br || []); setBreedsLoaded(true)
      }
      setOverrideBreed(pedigreeData.main_dog.breed || '')

      setData(pedigreeData)
      setEditedMain(pedigreeData.main_dog)
      setEditedAncestors(pedigreeData.ancestors || [])
      setSwaps(autoSwaps)
      setLinkedAncestors(linked)
      setShowPreview(true)
    } catch (err: any) { setError(err.message || t('Error al analizar la imagen')) }
    setUploadingImage(false); setScanPhase(''); setPreviewSrc(null)
  }

  async function searchSwap(query: string) {
    if (query.length < 2) { setSwapResults([]); return }
    setSwapSearching(true)
    const supabase = createClient()
    const { data } = await supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').ilike('name', `%${query}%`).limit(15)
    setSwapResults(data || [])
    setSwapSearching(false)
  }

  async function applySwap(dogName: string, existing: any) {
    const supabase = createClient()
    // Fetch real pedigree from DB
    const { data: pedigreeNodes } = await supabase.rpc('get_pedigree', { dog_uuid: existing.id, max_gen: 10 })
    const nodes = pedigreeNodes || []
    const rootNode = nodes.find((n: any) => n.generation === 0)
    const dbAncestors: ImportDog[] = nodes
      .filter((n: any) => n.generation > 0)
      .map((n: any) => ({
        name: n.name, sex: n.sex === 'female' ? 'Female' : 'Male',
        registration: n.registration, breed: n.breed_name, color: n.color_name,
        birth_date: null, health: null, photo_url: n.photo_url,
        father_name: nodes.find((p: any) => p.id === n.father_id)?.name || null,
        mother_name: nodes.find((p: any) => p.id === n.mother_id)?.name || null,
        generation: n.generation,
      }))
    // Get the root's parent names so the tree can continue below the swapped node
    const dbFatherName = rootNode?.father_id ? nodes.find((n: any) => n.id === rootNode.father_id)?.name || null : null
    const dbMotherName = rootNode?.mother_id ? nodes.find((n: any) => n.id === rootNode.mother_id)?.name || null : null
    setLinkedAncestors(prev => new Map(prev).set(dogName, dbAncestors))
    setSwaps(prev => ({ ...prev, [dogName]: { id: existing.id, name: existing.name, breed: (existing.breed as any)?.name, photo: existing.thumbnail_url, linked: true, father_name: dbFatherName, mother_name: dbMotherName } }))
    setSwapTarget(null); setSwapSearch(''); setSwapResults([])
  }

  function removeSwap(dogName: string) {
    setSwaps(prev => { const next = { ...prev }; delete next[dogName]; return next })
    setLinkedAncestors(prev => { const next = new Map(prev); next.delete(dogName); return next })
  }

  async function handleConfirm() {
    if (!editedMain) return
    setImporting(true); setError('')
    try {
      const res = await fetch('/api/confirm-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mainDog: editedMain, ancestors: importAncestors ? editedAncestors : [], userId, kennelId, swaps, importPhotos, isAdmin, overrideBreed: overrideBreed || undefined }) })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setImportResult(result)
      setImported(true)
      // Delete draft since import is confirmed
      if (currentDraftId) { await deleteDraft(currentDraftId); setCurrentDraftId(null) }
    } catch (err: any) { setError(err.message || t('Error al importar')) }
    setImporting(false)
  }

  async function handleUndo() {
    if (!importResult?.importId) return
    try {
      const res = await fetch('/api/confirm-import', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importId: importResult.importId, userId }) })
      if (res.ok) { setImported(false); setImportResult(null); setShowPreview(false); setData(null) }
    } catch {}
  }

  const byName = useMemo(() => {
    if (!editedMain) return new Map<string, ImportDog>()
    const m = new Map<string, ImportDog>()
    m.set(editedMain.name, editedMain)
    editedAncestors.forEach(a => m.set(a.name, a))
    // Overlay DB ancestors from linked swaps (overrides imported data for that branch)
    for (const [, dbAncestors] of linkedAncestors) {
      dbAncestors.forEach(a => m.set(a.name, a))
    }
    return m
  }, [editedMain, editedAncestors, linkedAncestors])

  const totalDogs = editedAncestors.length + 1
  const swappedCount = Object.keys(swaps).length

  // ===== PREVIEW (portal to escape panel's transform containing block) =====
  if (showPreview && editedMain) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-canvas flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-hairline bg-surface-card flex-shrink-0">
          <div className="min-w-0">
            {/* Nombre EDITABLE: el usuario puede ajustarlo antes de importar —
                p.ej. añadir su afijo ("Rebeca de La Esperanza"). Se guarda tal cual
                porque handleConfirm manda editedMain.name. */}
            <input
              value={editedMain.name}
              onChange={e => setEditedMain(m => (m ? { ...m, name: e.target.value } : m))}
              aria-label={t('Nombre del perro')}
              placeholder={t('Nombre del perro')}
              className="w-full max-w-[420px] bg-transparent text-lg font-bold text-ink border-b border-dashed border-hairline focus:border-solid focus:border-ink focus:outline-none placeholder:text-muted/60"
            />
            <p className="text-xs text-muted">{totalDogs} {t('perros')} · {totalDogs - swappedCount} {t('nuevos')} · {swappedCount} {t('existentes')} · <span className="text-muted/70">{t('puedes editar el nombre (añade tu afijo)')}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <select value={overrideBreed} onChange={e => setOverrideBreed(e.target.value)} className="bg-surface-card border border-hairline rounded-lg px-2 py-1.5 text-xs text-ink focus:border-ink focus:outline-none appearance-none cursor-pointer max-w-[160px]">
              <option value="">{t('Sin raza')}</option>
              {allBreeds.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-body cursor-pointer">
              <input type="checkbox" checked={importPhotos} onChange={e => setImportPhotos(e.target.checked)} className="w-3.5 h-3.5 rounded border-hairline bg-surface-card text-ink focus:ring-0" />{t('Fotos')}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-body cursor-pointer">
              <input type="checkbox" checked={importAncestors} onChange={e => setImportAncestors(e.target.checked)} className="w-3.5 h-3.5 rounded border-hairline bg-surface-card text-ink focus:ring-0" />{t('Ancestros')}
            </label>
            <button onClick={() => { setShowPreview(false); setSwaps({}) }} className="px-4 py-2 rounded-lg text-sm text-body hover:text-ink bg-surface-card hover:bg-surface-card transition">{t('Volver')}</button>
            {imported ? (
              <div className="flex items-center gap-2">
                <button onClick={handleUndo} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                  <Undo2 className="w-3.5 h-3.5" /> {t('Deshacer')}
                </button>
                {importResult?.mainDogId && (
                  <a href={`/dogs/${importResult.mainDogId}`} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition">
                    <Check className="w-3.5 h-3.5" /> {t('Ver perro')}
                  </a>
                )}
                <button onClick={() => { setImported(false); setImportResult(null); setShowPreview(false); setData(null); setUrl(''); setLinkedAncestors(new Map()) }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface-card text-body hover:bg-surface-card transition">
                  <Globe className="w-3.5 h-3.5" /> {t('Importar otro')}
                </button>
              </div>
            ) : (
              <button onClick={handleConfirm} disabled={importing} className="bg-ink text-on-primary hover:opacity-90 font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {importing ? t('Importando...') : t('Importar genealogía')}
              </button>
            )}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-5 px-6 py-2 border-b border-hairline bg-surface-card/50 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-ink bg-surface-card flex items-center justify-center"><Link2 className="w-2 h-2 text-ink" /></div>
            <span className="text-[10px] text-muted">{t('Registrado — ya existe, su genealogia es la de la plataforma')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-blue-400/60 bg-blue-400/10" />
            <span className="text-[10px] text-muted">{t('Cambiado — sustituido manualmente por otro perro')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-hairline bg-surface-card" />
            <span className="text-[10px] text-muted">{t('Nuevo — se creara como contribucion al importar')}</span>
          </div>
          <span className="text-[10px] text-muted ml-auto">{t('Haz clic en cualquier perro para cambiarlo')}</span>
        </div>
        {error && <div className="mx-6 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
        <div className="flex-1 overflow-auto relative" onClick={() => { setGenMenu(false); setZoomMenu(false) }}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
            <div className="min-w-max min-h-max py-6 px-4 pb-24">
              <TN name={editedMain.name} byName={byName} swaps={swaps} g={0} mx={maxGen} isRoot zoomScale={zoom / 100} onSwap={n => { setSwapTarget(n); setSwapSearch(''); setSwapResults([]) }} onRemoveSwap={removeSwap} />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setZoomMenu(!zoomMenu); setGenMenu(false) }} className="w-11 h-11 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-body shadow-lg hover:border-hairline transition"><Search className="w-4 h-4" /></button>
              {zoomMenu && <div className="absolute bottom-14 left-0 bg-surface-card border border-hairline rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>{[150,130,110,100,90,80,70,60,50].map(z=><button key={z} onClick={()=>{setZoom(z);setZoomMenu(false)}} className={`block w-full px-4 py-1.5 text-xs text-center transition ${zoom===z?'bg-ink text-on-primary':'text-body hover:bg-surface-card'}`}>{z}%</button>)}</div>}
            </div>
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setGenMenu(!genMenu); setZoomMenu(false) }} className="w-11 h-11 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-body shadow-lg hover:border-hairline font-bold text-xs transition">x{maxGen}</button>
              {genMenu && <div className="absolute bottom-14 left-0 bg-surface-card border border-hairline rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>{[10,8,6,5,4,3].map(g=><button key={g} onClick={()=>{setMaxGen(g);setGenMenu(false)}} className={`block w-full px-4 py-1.5 text-xs text-center transition ${maxGen===g?'bg-ink text-on-primary':'text-body hover:bg-surface-card'}`}>x{g}</button>)}</div>}
            </div>
          </div>
        </div>
        {/* Swap modal */}
        {swapTarget && (<>
          <div className="fixed inset-0 z-[210] bg-black/60" onClick={() => setSwapTarget(null)} />
          <div className="fixed z-[211] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-surface-card border border-hairline rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
              <div><h3 className="text-sm font-semibold">{t('Cambiar perro')}</h3><p className="text-[10px] text-muted">{swapTarget}</p></div>
              <button onClick={() => setSwapTarget(null)} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {swaps[swapTarget] && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-card flex-shrink-0">{swaps[swapTarget].photo ? <img src={swaps[swapTarget].photo} alt="" className="w-full h-full object-cover" /> : null}</div>
                  <div className="flex-1"><p className="text-xs font-semibold text-green-400">{swaps[swapTarget].name}</p><p className="text-[10px] text-muted">{swaps[swapTarget].breed || t('Existente')}</p></div>
                  <button onClick={() => removeSwap(swapTarget)} className="text-xs text-red-400 hover:text-red-300">{t('Quitar')}</button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={swapSearch} onChange={e => { setSwapSearch(e.target.value); searchSwap(e.target.value) }} placeholder={t('Buscar perro existente...')} autoFocus className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {swapSearching && <div className="text-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted mx-auto" /></div>}
                {swapResults.map(d => (
                  <button key={d.id} onClick={() => applySwap(swapTarget, d)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-body hover:bg-surface-card transition text-left">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-surface-card border flex-shrink-0" style={{ borderColor: d.sex === 'male' ? '#017DFA' : '#e84393' }}>{d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}</div>
                    <span className="truncate flex-1 font-medium">{d.name}</span>
                    <span className="text-[10px] text-muted">{(d.breed as any)?.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-hairline">
                <button onClick={() => setSwapTarget(null)} className="flex-1 px-3 py-2 rounded-lg text-xs text-body bg-surface-card hover:bg-surface-card transition">{t('Mantener original')}</button>
                {swaps[swapTarget] && <button onClick={() => setSwapTarget(null)} className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-medium bg-ink hover:opacity-90 transition">{t('Usar seleccionado')}</button>}
              </div>
            </div>
          </div>
        </>)}
      </div>,
      document.body
    )
  }

  // ===== SCAN SCREEN =====
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-ink mx-auto w-14 h-14 rounded-2xl bg-surface-card flex items-center justify-center mb-3"><Globe className="w-7 h-7" /></div>
        <h3 className="text-lg font-bold">{t('Importar genealogía')}</h3>
        <p className="text-sm text-body mt-1">{t('Pega la URL de una genealogía online y lo escanearemos automáticamente con IA')}</p>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-orange-400">{t('Compatible con cualquier web pública: presadb, pedigreedatabase, k9data, working-dog, breedarchive, hunddata, dogsfiles, clubes FCI, criaderos privados, etc. También acepta PDFs oficiales (RSCE/FCI) y screenshots.')} <span className="text-orange-300/80">{t('Por respeto a su política, ingrus.net no está soportado — usa el PDF o screenshot si necesitas importar desde ahí.')}</span></p>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
      <div>
        <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('URL de la genealogía')}</label>
        <div className="flex gap-2">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://presadb.com/dogocanario/nombre-del-perro" onKeyDown={e => e.key === 'Enter' && handleScan()} className="flex-1 bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
          <button onClick={handleScan} disabled={scanning || !url.trim()} className="bg-ink text-on-primary hover:opacity-90 font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm flex-shrink-0">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? t('Escaneando...') : t('Escanear')}
          </button>
        </div>
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-hairline" />
        <span className="text-xs text-muted">{t('o')}</span>
        <div className="flex-1 border-t border-hairline" />
      </div>

      {/* Subida (imagen o PDF) — arrastrar O hacer clic */}
      <div>
        <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1 block">{t('Subir screenshot o PDF de la genealogía')}</label>
        <label
          onDragOver={(e) => { e.preventDefault(); if (!uploadingImage && !scanning) setDragActive(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
          onDrop={handleDrop}
          className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragActive ? 'border-[#FE6620] bg-[#FE6620]/10' : 'border-hairline hover:border-ink/40 hover:bg-surface-card'
          } ${uploadingImage ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div className="pointer-events-none flex flex-col items-center gap-2">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${dragActive ? 'bg-[#FE6620] text-white' : 'bg-surface-card text-muted group-hover:text-ink'}`}>
              <UploadCloud className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-ink">{dragActive ? t('Suelta el documento aquí') : t('Arrastra el documento aquí o haz clic para elegir')}</span>
            <span className="text-[11px] text-muted">{t('Imagen (JPG/PNG/WebP) o PDF')}</span>
          </div>
          <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleImageUpload} className="hidden" />
        </label>
        <p className="text-[10px] text-muted mt-1">{t('Para pedigrees oficiales RSCE/FCI (los documentos del club) sube el PDF directamente. Para webs que bloquean el scrapeo, sube un screenshot.')}</p>
      </div>

      {/* Pantalla de carga rica (portal full-screen, estable → no parpadea el panel) */}
      {(uploadingImage || scanning) && <ImportLoadingOverlay previewSrc={previewSrc} phase={scanPhase} t={t} />}
    </div>
  )
}

/**
 * ImportLoadingOverlay — pantalla de carga a pantalla completa mientras la IA
 * lee el documento. Muestra el documento BORROSO con una línea de escaneo que
 * barre (efecto "analizando en vivo"), nebulosa de color de marca, y el texto de
 * la fase actual en vivo. Es un portal estable (las animaciones son CSS y no se
 * reinician al cambiar la fase), así que sustituye al loader anterior que hacía
 * parpadear el panel. Si no hay imagen (import por URL/PDF) usa un documento
 * placeholder con líneas que simulan texto.
 */
function ImportLoadingOverlay({ previewSrc, phase, t }: { previewSrc: string | null; phase: string; t: (k: string) => string }) {
  return createPortal(
    <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center overflow-hidden bg-ink/95">
      {/* Documento MUY borroso de fondo */}
      {previewSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-[44px]" />
      )}
      {/* Nebulosa de marca animada */}
      <div className="ilo-blob-a pointer-events-none absolute -left-1/4 -top-1/4 h-[70vh] w-[70vh] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle at 40% 40%, rgba(254,102,32,0.55), transparent 70%)' }} />
      <div className="ilo-blob-b pointer-events-none absolute -bottom-1/4 -right-1/4 h-[60vh] w-[60vh] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.5), transparent 70%)' }} />

      {/* Tarjeta-escáner con el documento */}
      <div className="relative z-10 aspect-[3/4] w-[240px] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:w-[280px]">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-85 blur-[3px]" />
        ) : (
          <div className="flex h-full w-full flex-col gap-2.5 bg-gradient-to-br from-white/10 to-white/[0.03] p-6">
            {[68, 92, 80, 55, 88, 72, 96, 60, 84, 76].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full bg-white/15" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {/* Línea de escaneo que barre el documento */}
        <div className="ilo-scan absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FE6620] to-transparent shadow-[0_0_22px_5px_rgba(254,102,32,0.7)]" />
        {/* Velo de pulso + marco de visor */}
        <div className="ilo-pulse absolute inset-0 bg-[#FE6620]/10" />
        <div className="pointer-events-none absolute inset-3 rounded-lg border border-[#FE6620]/30" />
      </div>

      {/* Fase actual en vivo */}
      <div className="relative z-10 mt-7 max-w-[300px] px-6 text-center">
        <div className="inline-flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 text-[#FE6620]" />
          <span className="text-[15px] font-semibold">{phase || t('Analizando el documento...')}</span>
          <span className="ilo-dots inline-block w-3 text-left text-[#FE6620]" />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/55">{t('Leyendo la genealogía con IA — no cierres esta ventana')}</p>
      </div>

      <style>{`
        @keyframes ilo-scan { 0% { top: 3% } 50% { top: 93% } 100% { top: 3% } }
        .ilo-scan { animation: ilo-scan 2.4s ease-in-out infinite; }
        @keyframes ilo-pulse { 0%,100% { opacity: .05 } 50% { opacity: .2 } }
        .ilo-pulse { animation: ilo-pulse 2.1s ease-in-out infinite; }
        @keyframes ilo-a { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(8%,6%) scale(1.15) } }
        @keyframes ilo-b { 0%,100% { transform: translate(0,0) scale(1.05) } 50% { transform: translate(-7%,-8%) scale(.95) } }
        .ilo-blob-a { animation: ilo-a 9s ease-in-out infinite; }
        .ilo-blob-b { animation: ilo-b 11s ease-in-out infinite; }
        @keyframes ilo-dots { 0% { content: '' } 25% { content: '.' } 50% { content: '..' } 75%,100% { content: '...' } }
        .ilo-dots::after { content: ''; animation: ilo-dots 1.4s steps(1,end) infinite; }
        @media (prefers-reduced-motion: reduce) { .ilo-scan,.ilo-pulse,.ilo-blob-a,.ilo-blob-b,.ilo-dots::after { animation: none } }
      `}</style>
    </div>,
    document.body,
  )
}

// ===== TREE NODE =====
function TN({ name, byName, swaps, g, mx, isRoot, zoomScale, onSwap, onRemoveSwap }: {
  name: string; byName: Map<string, ImportDog>; swaps: Record<string, any>; g: number; mx: number; isRoot?: boolean; zoomScale: number
  onSwap: (n: string) => void; onRemoveSwap: (n: string) => void
}) {
  const dog = byName.get(name)
  if (!dog) return <div className="w-8 h-8 rounded-full border-2 border-dashed border-hairline flex items-center justify-center text-muted text-xs">?</div>
  if (g >= mx) return <Card dog={dog} swaps={swaps} isRoot={isRoot} onSwap={onSwap} onRemoveSwap={onRemoveSwap} />
  // If this dog is swapped/linked, use DB parent names instead of imported ones
  const swap = swaps[dog.name]
  const fatherName = swap?.linked ? swap.father_name : dog.father_name
  const motherName = swap?.linked ? swap.mother_name : dog.mother_name
  const hasFather = !!fatherName && byName.has(fatherName)
  const hasMother = !!motherName && byName.has(motherName)
  if (!hasFather && !hasMother) return <Card dog={dog} swaps={swaps} isRoot={isRoot} onSwap={onSwap} onRemoveSwap={onRemoveSwap} />

  const wrapRef = useRef<HTMLDivElement>(null)
  const fRef = useRef<HTMLDivElement>(null)
  const mRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])

  useLayoutEffect(() => {
    // Use double rAF to ensure all nested children have finished layout
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!wrapRef.current || !fRef.current || !mRef.current) return
      // offsetTop/offsetHeight are layout-space values, unaffected by CSS transforms
      const fMidY = fRef.current.offsetTop + fRef.current.offsetHeight / 2
      const mMidY = mRef.current.offsetTop + mRef.current.offsetHeight / 2
      const cardMidY = (fMidY + mMidY) / 2
      setLines([
        { x1: CW, y1: cardMidY, x2: CW + 45, y2: cardMidY },
        { x1: CW + 45, y1: fMidY, x2: CW + 45, y2: mMidY },
        { x1: CW + 45, y1: fMidY, x2: CW + 60, y2: fMidY },
        { x1: CW + 45, y1: mMidY, x2: CW + 60, y2: mMidY },
      ])
    }))
  })

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <div className="absolute" style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>
        <Card dog={dog} swaps={swaps} isRoot={isRoot} onSwap={onSwap} onRemoveSwap={onRemoveSwap} />
      </div>
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={L} strokeWidth={1} />)}
      </svg>
      <div style={{ marginLeft: CW + 60, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div ref={fRef}>{hasFather ? <TN name={fatherName!} byName={byName} swaps={swaps} g={g + 1} mx={mx} zoomScale={zoomScale} onSwap={onSwap} onRemoveSwap={onRemoveSwap} /> : <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-400/20 flex items-center justify-center text-blue-400/30 text-xs">♂</div>}</div>
        <div ref={mRef}>{hasMother ? <TN name={motherName!} byName={byName} swaps={swaps} g={g + 1} mx={mx} zoomScale={zoomScale} onSwap={onSwap} onRemoveSwap={onRemoveSwap} /> : <div className="w-8 h-8 rounded-full border-2 border-dashed border-pink-400/20 flex items-center justify-center text-pink-400/30 text-xs">♀</div>}</div>
      </div>
    </div>
  )
}

function Card({ dog, swaps, isRoot, onSwap, onRemoveSwap }: { dog: ImportDog; swaps: Record<string, any>; isRoot?: boolean; onSwap: (n: string) => void; onRemoveSwap: (n: string) => void }) {
  const t = useT()
  const swap = swaps[dog.name]
  const sc = dog.sex === 'Female' ? '#e84393' : '#017DFA'
  const isLinked = swap?.linked // Existing in DB — orange border + chain icon
  const isSwapped = !!swap && !isLinked // Manually swapped — blue border
  const borderClass = isLinked
    ? 'border-2 border-ink bg-surface-soft'
    : isSwapped
      ? 'border-2 border-blue-400/60 bg-blue-400/5'
      : isRoot
        ? 'border-2 border-hairline bg-surface-card'
        : 'border border-hairline bg-surface-card'
  return (
    <div className="relative" style={{ width: CW, flexShrink: 0 }}>
      {/* Chain icon for linked dogs — outside the card, top-right */}
      {isLinked && (
        <div className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-ink flex items-center justify-center shadow-lg">
          <Link2 className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`relative group rounded-xl overflow-hidden transition ${borderClass}`} style={{ minHeight: CH }}>
        <div className="flex items-stretch" style={{ minHeight: CH }}>
          <div className="flex-shrink-0 bg-surface-card relative" style={{ width: 48 }}>
            {swap?.photo ? <img src={swap.photo} alt="" className="w-full h-full object-cover" /> : dog.photo_url ? <img src={dog.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted text-sm">{dog.sex === 'Female' ? '♀' : '♂'}</div>}
            <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{ backgroundColor: sc }} />
          </div>
          <div className="flex-1 min-w-0 px-2 py-1.5 flex flex-col justify-center">
            <p className="text-[11px] font-bold text-ink leading-tight truncate">{swap ? swap.name : dog.name}</p>
            {isLinked ? (
              <span className="text-[9px] font-bold text-ink flex items-center gap-0.5 mt-0.5"><Link2 className="w-2.5 h-2.5" /> {t('Registrado')}</span>
            ) : isSwapped ? (
              <span className="text-[9px] font-bold text-blue-400 flex items-center gap-0.5 mt-0.5"><ArrowLeftRight className="w-2.5 h-2.5" /> {t('Cambiado')}</span>
            ) : (
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {dog.breed && <span className="text-[8px] bg-surface-card text-muted px-1 py-0.5 rounded">{dog.breed}</span>}
                {dog.birth_date && <span className="text-[8px] bg-surface-card text-muted px-1 py-0.5 rounded">{dog.birth_date}</span>}
                {dog.health && <span className="text-[8px] bg-green-500/10 text-green-400 px-1 py-0.5 rounded">{dog.health}</span>}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => (isSwapped || isLinked) ? onRemoveSwap(dog.name) : onSwap(dog.name)}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center transition">
          <span className="text-[10px] font-bold text-white flex items-center gap-1">
            {(isSwapped || isLinked) ? <><X className="w-3 h-3" /> {t('Quitar')}</> : <><ArrowLeftRight className="w-3 h-3" /> {t('Cambiar')}</>}
          </span>
        </button>
      </div>
    </div>
  )
}
