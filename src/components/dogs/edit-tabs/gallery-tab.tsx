'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, GripVertical, Star, Sparkles, Film, Play, ImagePlus } from 'lucide-react'
import { parseVideoUrl, youtubePoster, fetchVimeoPoster, type VideoProvider } from '@/lib/video'
import { useT } from '@/components/i18n/locale-provider'
import { Img } from '@/components/ui/img'
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface GalleryTabProps { dogId: string; userId: string }

const POSTER_FALLBACK = '/icon.svg?v=2'
const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB — límite global de subida del proyecto

export default function GalleryTab({ dogId, userId }: GalleryTabProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [upscalingId, setUpscalingId] = useState<string | null>(null)
  const [upscaleMsg, setUpscaleMsg] = useState<string | null>(null)
  const [dogThumb, setDogThumb] = useState<string | null>(null)
  // Vídeo
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('youtube')
  const [linkInput, setLinkInput] = useState('')
  const [videoBusy, setVideoBusy] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const [posterPickerPhoto, setPosterPickerPhoto] = useState<any | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const t = useT()

  // Sensores dnd-kit: ratón (desktop, arrastrar tras 6px) + táctil (móvil,
  // long-press 200ms para no pelearse con el scroll) + teclado (a11y).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // La portada vive en dogs.thumbnail_url y RLS solo deja actualizarla al dueño →
  // para perros sin dueño (ancestros importados, p.ej. "Bora de Irema Curto") el
  // cambio de portada al reordenar/borrar fallaba en silencio. Va por service-role.
  async function setThumbnail(url: string | null) {
    await fetch('/api/update-dog', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dogId, updates: { thumbnail_url: url } }),
    }).catch(() => {})
  }

  async function loadPhotos() {
    const [{ data: ph }, { data: dog }] = await Promise.all([
      supabase.from('dog_photos').select('*').eq('dog_id', dogId).order('position'),
      supabase.from('dogs').select('thumbnail_url').eq('id', dogId).maybeSingle(),
    ])
    const photos = ph || []
    const thumbnailUrl = dog?.thumbnail_url || null
    setDogThumb(thumbnailUrl)

    const hasThumbnailInPhotos = thumbnailUrl ? photos.some(p => p.url === thumbnailUrl) : true
    if (thumbnailUrl && !hasThumbnailInPhotos) {
      const { data: inserted } = await supabase
        .from('dog_photos')
        .insert({ dog_id: dogId, url: thumbnailUrl, storage_path: null, position: 0 })
        .select('*').single()
      if (inserted) {
        for (let i = 0; i < photos.length; i++) {
          if (photos[i].position !== i + 1) await supabase.from('dog_photos').update({ position: i + 1 }).eq('id', photos[i].id)
        }
        setPhotos([inserted, ...photos.map((p, i) => ({ ...p, position: i + 1 }))])
        return
      }
    }
    // Auto-reparación: si el perro tiene fotos pero thumbnail_url está vacío
    // (subidas antiguas, import masivo, o un sync que falló), fijar la 1ª foto
    // como portada para que el recuadro de /dogs muestre la imagen.
    if (!thumbnailUrl && photos.length > 0 && photos[0]?.url) {
      await setThumbnail(photos[0].url)
      setDogThumb(photos[0].url)
    }
    setPhotos(photos)
  }
  useEffect(() => { loadPhotos() }, [dogId])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `${userId}/${dogId}/${Date.now()}-${i}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('dog-photos').upload(path, file)
      if (uploadErr) { console.error(uploadErr); continue }
      const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(path)
      const newPos = photos.length + i
      await supabase.from('dog_photos').insert({ dog_id: dogId, url: publicUrl, storage_path: path, position: newPos })
      if (newPos === 0) await setThumbnail(publicUrl)
    }
    setUploading(false)
    loadPhotos()
  }

  // Captura un fotograma del vídeo (en el navegador) como portada.
  // CON TIMEOUT + guard: si el navegador no puede decodificar el vídeo (típico
  // con .mov/HEVC de iPhone en Chromium/Brave) y nunca dispara onloadeddata/
  // onseeked, NO se cuelga — resuelve null a los 8s y se usa una portada de
  // respaldo (el usuario puede elegir el fotograma luego con el selector).
  function capturePoster(file: File): Promise<Blob | null> {
    return new Promise((resolve) => {
      let settled = false
      let objUrl: string | null = null
      const finish = (b: Blob | null) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (objUrl) URL.revokeObjectURL(objUrl)
        resolve(b)
      }
      const timer = setTimeout(() => finish(null), 8000)
      try {
        const video = document.createElement('video')
        video.preload = 'metadata'; video.muted = true; (video as any).playsInline = true
        objUrl = URL.createObjectURL(file)
        video.src = objUrl
        video.onloadeddata = () => { try { video.currentTime = Math.min(1, (video.duration || 2) / 2) } catch { finish(null) } }
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 360
            const ctx = canvas.getContext('2d')
            if (!ctx) { finish(null); return }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((b) => finish(b), 'image/jpeg', 0.85)
          } catch { finish(null) }
        }
        video.onerror = () => finish(null)
      } catch { finish(null) }
    })
  }

  async function uploadPoster(blobOrFile: Blob | File): Promise<{ url: string; path: string } | null> {
    const path = `${userId}/${dogId}/poster-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('dog-photos').upload(path, blobOrFile, { contentType: 'image/jpeg', upsert: false })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  async function insertVideoRow(row: { video_provider: VideoProvider; video_url: string; url: string; storage_path?: string | null; video_storage_path?: string | null }) {
    await supabase.from('dog_photos').insert({
      dog_id: dogId,
      media_type: 'video',
      video_provider: row.video_provider,
      video_url: row.video_url,
      url: row.url,
      storage_path: row.storage_path ?? null,
      video_storage_path: row.video_storage_path ?? null,
      position: photos.length,
    })
  }

  // Añadir vídeo por enlace (YouTube / Vimeo)
  async function handleAddVideoLink() {
    setVideoError(null)
    const parsed = parseVideoUrl(linkInput)
    if (!parsed || parsed.provider !== videoProvider) {
      setVideoError(`${t('Pega un enlace válido de')} ${videoProvider === 'youtube' ? 'YouTube' : 'Vimeo'}.`)
      return
    }
    setVideoBusy(true)
    let poster: string | null = null
    if (parsed.provider === 'youtube') poster = youtubePoster(parsed.id)
    else poster = await fetchVimeoPoster(linkInput.trim())
    await insertVideoRow({ video_provider: parsed.provider, video_url: linkInput.trim(), url: poster || dogThumb || POSTER_FALLBACK })
    setVideoBusy(false); setShowVideoForm(false); setLinkInput('')
    loadPhotos()
  }

  // Subida REANUDABLE (TUS) — robusta para vídeos grandes en móvil (reintenta y
  // reanuda si se corta la conexión). Trozos de 6MB (requisito de Supabase).
  async function uploadVideoResumable(file: File, path: string, onProgress: (pct: number) => void) {
    const tus = await import('tus-js-client')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error(t('Inicia sesión para subir vídeos.'))
    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { authorization: `Bearer ${token}`, 'x-upsert': 'true' },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: { bucketName: 'dog-photos', objectName: path, contentType: file.type || 'video/mp4', cacheControl: '3600' },
        chunkSize: 6 * 1024 * 1024,
        onError: reject,
        onProgress: (sent, total) => onProgress(total ? Math.round((sent / total) * 100) : 0),
        onSuccess: () => resolve(),
      })
      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0])
        upload.start()
      }).catch(reject)
    })
  }

  // Subir vídeo (archivo) → subida resumable + captura portada
  async function handleUploadVideo(file: File | null) {
    if (!file) return
    setVideoError(null)
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError(t('El vídeo supera los 500 MB. Súbelo a YouTube o Vimeo y pega el enlace, o redúcelo antes de importarlo.'))
      return
    }
    setVideoBusy(true); setVideoProgress(0)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${dogId}/video-${Date.now()}.${ext}`
    try {
      await uploadVideoResumable(file, path, (pct) => setVideoProgress(pct))
    } catch (err: any) {
      setVideoError(err?.message || t('No se pudo subir el vídeo. Inténtalo de nuevo.'))
      setVideoBusy(false); setVideoProgress(null)
      return
    }
    setVideoProgress(null) // subida OK → la fase de portada muestra "Generando portada…"
    const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(path)
    // Portada: fotograma capturado o fallback
    let posterUrl = dogThumb || POSTER_FALLBACK
    let posterPath: string | null = null
    const blob = await capturePoster(file)
    if (blob) { const up = await uploadPoster(blob); if (up) { posterUrl = up.url; posterPath = up.path } }
    await insertVideoRow({ video_provider: 'upload', video_url: publicUrl, url: posterUrl, storage_path: posterPath, video_storage_path: path })
    setVideoBusy(false); setVideoProgress(null); setShowVideoForm(false)
    loadPhotos()
  }

  // Cambiar la portada de un vídeo SUBIDO: solo un fotograma real del propio
  // vídeo (elegido en la línea de tiempo). NO se permite subir una imagen
  // personalizada, para que nadie falsee la portada ni haga clickbait.
  async function applyNewPoster(photo: any, blob: Blob) {
    setVideoBusy(true)
    // borra portada anterior (si era de nuestro storage)
    if (photo.storage_path) await supabase.storage.from('dog-photos').remove([photo.storage_path])
    const up = await uploadPoster(blob)
    if (up) await supabase.from('dog_photos').update({ url: up.url, storage_path: up.path }).eq('id', photo.id)
    setVideoBusy(false); setPosterPickerPhoto(null)
    loadPhotos()
  }

  async function deletePhoto(photo: any) {
    const toRemove = [photo.storage_path, photo.video_storage_path].filter(Boolean) as string[]
    if (toRemove.length) await supabase.storage.from('dog-photos').remove(toRemove)
    await supabase.from('dog_photos').delete().eq('id', photo.id)
    const { data: remaining } = await supabase.from('dog_photos').select('*').eq('dog_id', dogId).order('position')
    const list = remaining || []
    for (let i = 0; i < list.length; i++) {
      if (list[i].position !== i) await supabase.from('dog_photos').update({ position: i }).eq('id', list[i].id)
    }
    await setThumbnail(list[0]?.url || null)
    setPhotos(list)
  }

  // Persistir el nuevo orden tras un drag (dnd-kit)
  async function persistOrder(reordered: any[]) {
    for (let i = 0; i < reordered.length; i++) await supabase.from('dog_photos').update({ position: i }).eq('id', reordered[i].id)
    await setThumbnail(reordered[0]?.url || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = photos.findIndex(p => p.id === active.id)
    const newIndex = photos.findIndex(p => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(photos, oldIndex, newIndex)
    setPhotos(reordered)            // optimista
    persistOrder(reordered)         // BD + portada (fire-and-forget)
  }

  async function handleUpscale(photo: any) {
    setUpscaleMsg(null); setUpscalingId(photo.id)
    try {
      const res = await fetch(`/api/dogs/${dogId}/upscale`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId: photo.id }) })
      const data = await res.json()
      if (!res.ok) setUpscaleMsg(data?.error || t('No se pudo mejorar la imagen.'))
      else { setUpscaleMsg(typeof data.remaining === 'number' ? `${t('Imagen mejorada. Te quedan')} ${data.remaining} ${t('mejoras gratis.')}` : t('Imagen mejorada con IA.')); await loadPhotos() }
    } catch { setUpscaleMsg(t('No se pudo mejorar la imagen. Inténtalo de nuevo.')) } finally { setUpscalingId(null) }
  }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
      <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={e => handleUploadVideo(e.target.files?.[0] || null)} />

      <p className="text-[11px] text-muted">{t('Arrastra (en el móvil, mantén pulsado) para reordenar. El primer elemento será la portada del perfil. Puedes añadir fotos y vídeos.')}</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2 sm:gap-2.5">
          {/* Subir foto */}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} title={t('Subir fotos')}
            className="aspect-square w-full border-2 border-dashed border-hairline rounded-lg flex flex-col items-center justify-center gap-1 hover:border-ink/40 transition cursor-pointer">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted" /> : <><Plus className="w-5 h-5 text-muted" /><span className="text-[9px] text-muted">{t('Foto')}</span></>}
          </button>
          {/* Añadir vídeo */}
          <button onClick={() => { setShowVideoForm(v => !v); setVideoError(null) }} title={t('Añadir vídeo')}
            className="aspect-square w-full border-2 border-dashed border-hairline rounded-lg flex flex-col items-center justify-center gap-1 hover:border-ink/40 transition cursor-pointer">
            <Film className="w-5 h-5 text-muted" /><span className="text-[9px] text-muted">{t('Vídeo')}</span>
          </button>

          {/* Media items (ordenables) */}
          <SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}>
            {photos.map((photo, idx) => (
              <SortableMediaItem
                key={photo.id}
                photo={photo}
                isFirst={idx === 0}
                upscaling={upscalingId === photo.id}
                t={t}
                onDelete={() => deletePhoto(photo)}
                onUpscale={() => handleUpscale(photo)}
                onChangePoster={() => setPosterPickerPhoto(photo)}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Formulario de vídeo */}
      {showVideoForm && (
        <div className="rounded-xl border border-hairline bg-surface-soft p-3 space-y-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-canvas p-0.5 w-fit">
            {(['youtube', 'vimeo', 'upload'] as VideoProvider[]).map(p => (
              <button key={p} onClick={() => { setVideoProvider(p); setVideoError(null) }}
                className={`rounded-md px-3 py-1 text-[12px] font-medium transition ${videoProvider === p ? 'bg-ink text-on-primary' : 'text-muted hover:text-ink'}`}>
                {p === 'youtube' ? 'YouTube' : p === 'vimeo' ? 'Vimeo' : t('Subir archivo')}
              </button>
            ))}
          </div>

          {videoProvider === 'upload' ? (
            <div>
              <button onClick={() => videoFileRef.current?.click()} disabled={videoBusy}
                className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50">
                {videoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                {videoBusy
                  ? (videoProgress !== null ? `${t('Subiendo vídeo…')} ${videoProgress}%` : t('Generando portada…'))
                  : t('Elegir vídeo (mp4)')}
              </button>
              {videoBusy && videoProgress !== null && (
                <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${videoProgress}%` }} />
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-muted">{t('Se genera una portada automática del primer fotograma; podrás cambiarla luego. Hasta 500 MB, con subida reanudable; para vídeos largos usa YouTube/Vimeo.')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                placeholder={videoProvider === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://vimeo.com/...'}
                className="min-w-0 flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
              <button onClick={handleAddVideoLink} disabled={videoBusy || !linkInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50">
                {videoBusy && <Loader2 className="h-4 w-4 animate-spin" />} {t('Añadir')}
              </button>
            </div>
          )}
          {videoError && <p className="text-[12px] text-red-500">{videoError}</p>}
        </div>
      )}

      {upscaleMsg && <p className="text-xs text-body bg-surface-card border border-hairline rounded-lg px-3 py-2">{upscaleMsg}</p>}

      {photos.length === 0 && !uploading && (
        <p className="text-xs text-muted text-center py-2">{t('Añade fotos o vídeos del perro.')}</p>
      )}
      <p className="text-[11px] text-muted">
        {t('En las fotos, pulsa')} <Sparkles className="w-3 h-3 inline -mt-0.5" /> {t('para mejorarlas con IA. En los vídeos subidos,')} <ImagePlus className="w-3 h-3 inline -mt-0.5" /> {t('elige la portada (un fotograma del propio vídeo).')}
      </p>

      {posterPickerPhoto && (
        <PosterPicker
          videoUrl={posterPickerPhoto.video_url}
          t={t}
          busy={videoBusy}
          onCancel={() => setPosterPickerPhoto(null)}
          onPick={(blob) => applyNewPoster(posterPickerPhoto, blob)}
        />
      )}
    </div>
  )
}

// ─── Item ordenable (dnd-kit) ─────────────────────────────────────────────
// La tarjeta entera es el área de arrastre; los botones de acción hacen
// stopPropagation en pointerDown para que un toque sea click y no un drag.
// Botones visibles SIEMPRE en móvil (sin hover) y hover-reveal en desktop.
function SortableMediaItem({
  photo, isFirst, upscaling, t, onDelete, onUpscale, onChangePoster,
}: {
  photo: any
  isFirst: boolean
  upscaling: boolean
  t: (s: string) => string
  onDelete: () => void
  onUpscale: () => void
  onChangePoster: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })
  const isVideo = photo.media_type === 'video'
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }
  // Evita que tocar un botón inicie un arrastre: corta los activadores de
  // dnd-kit (MouseSensor usa onMouseDown, TouchSensor usa onTouchStart).
  const stopDnd = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative aspect-square w-full rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-50 ring-2 ring-ink' : ''} ${isFirst ? 'ring-2 ring-ink/50' : ''}`}
    >
      <Img src={photo.url} w={180} alt="" className="w-full h-full object-cover pointer-events-none" />

      {isVideo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55"><Play className="h-3.5 w-3.5 translate-x-px fill-white text-white" /></span>
        </div>
      )}

      {isFirst && (
        <div className="pointer-events-none absolute top-1 left-1 bg-ink rounded px-1 py-0.5 flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5 text-white" /><span className="text-[8px] text-white font-bold">{t('PERFIL')}</span>
        </div>
      )}
      {isVideo && (
        <div className="pointer-events-none absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5 flex items-center gap-0.5">
          <Film className="w-2.5 h-2.5 text-white" /><span className="text-[8px] text-white font-bold uppercase">{photo.video_provider}</span>
        </div>
      )}
      {!isVideo && photo.upscaled_at && (
        <div className="pointer-events-none absolute bottom-1 left-1 bg-violet-600 rounded px-1 py-0.5 flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-white" /><span className="text-[8px] text-white font-bold">{t('IA')}</span>
        </div>
      )}
      {upscaling && (
        <div className="pointer-events-none absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>
      )}

      {/* Pista de arrastre (centro) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 sm:group-hover:bg-black/20 transition">
        <GripVertical className="w-4 h-4 text-white opacity-0 drop-shadow sm:group-hover:opacity-100 transition" />
      </div>

      {/* Acción: cambiar portada (vídeo) o mejorar IA (foto) — visible en móvil */}
      {isVideo ? (
        photo.video_provider === 'upload' && (
          <button {...stopDnd} onClick={onChangePoster} title={t('Elegir portada')}
            className="absolute bottom-1 right-1 w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-ink">
            <ImagePlus className="w-3 h-3" />
          </button>
        )
      ) : (!photo.upscaled_at && !upscaling && (
        <button {...stopDnd} onClick={onUpscale} title={t('Mejorar con IA')}
          className="absolute bottom-1 right-1 w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-violet-600">
          <Sparkles className="w-3 h-3" />
        </button>
      ))}
      <button {...stopDnd} onClick={onDelete} title={t('Eliminar')}
        className="absolute top-1 right-1 w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-red-500">
        <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
      </button>
    </div>
  )
}

// ─── Selector de portada (línea de tiempo, estilo Instagram) ──────────────
// Solo permite elegir un FOTOGRAMA REAL del vídeo subido — nada de imágenes
// personalizadas — para que la portada no se pueda falsear ni hacer clickbait.
function PosterPicker({ videoUrl, t, busy, onCancel, onPick }: {
  videoUrl: string
  t: (s: string) => string
  busy: boolean
  onCancel: () => void
  onPick: (blob: Blob) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [ready, setReady] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function onLoadedMetadata() {
    const v = videoRef.current; if (!v) return
    setDuration(v.duration || 0)
    setReady(true)
    const start = Math.min(0.1, (v.duration || 0) / 2)
    setTime(start)
    try { v.currentTime = start } catch {}
  }
  function onScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current; if (!v) return
    const tt = parseFloat(e.target.value)
    setTime(tt)
    try { v.currentTime = tt } catch {}
  }
  function fmt(s: number) { const m = Math.floor(s / 60); const ss = Math.floor(s % 60); return `${m}:${ss.toString().padStart(2, '0')}` }

  async function capture() {
    const v = videoRef.current; if (!v) return
    setCapturing(true); setErr(null)
    try {
      // asegura que el frame de `time` está pintado antes de capturar
      await new Promise<void>((res) => {
        if (Math.abs(v.currentTime - time) < 0.05 && v.readyState >= 2) return res()
        let done = false
        const finish = () => { if (done) return; done = true; v.removeEventListener('seeked', finish); res() }
        v.addEventListener('seeked', finish)
        try { v.currentTime = time } catch { finish() }
        setTimeout(finish, 1500)
      })
      const canvas = document.createElement('canvas')
      canvas.width = v.videoWidth || 640
      canvas.height = v.videoHeight || 360
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no-ctx')
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/jpeg', 0.85))
      if (!blob) throw new Error('no-blob')
      onPick(blob)
    } catch {
      setErr(t('No se pudo capturar el fotograma (permisos del vídeo). Inténtalo de nuevo.'))
      setCapturing(false)
    }
  }

  const working = capturing || busy

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-canvas p-4 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">{t('Elige la portada')}</h3>
          <button onClick={onCancel} className="rounded-full p-1 text-muted transition hover:text-ink"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            crossOrigin="anonymous"
            preload="metadata"
            muted
            playsInline
            onLoadedMetadata={onLoadedMetadata}
            onError={() => setErr(t('No se pudo cargar el vídeo.'))}
            className="mx-auto max-h-[50vh] w-full object-contain"
          />
        </div>

        <div className="mt-3">
          <input type="range" min={0} max={duration || 0} step={0.05} value={time} onChange={onScrub} disabled={!ready}
            style={{ accentColor: 'var(--brand)' }} className="w-full disabled:opacity-50" />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
            <span>{fmt(time)}</span><span>{fmt(duration)}</span>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-muted">{t('Arrastra para elegir el fotograma. La portada será exactamente ese momento del vídeo.')}</p>
        {err && <p className="mt-2 text-[12px] text-red-500">{err}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-hairline px-4 py-2 text-[13px] font-medium text-body transition hover:bg-surface-soft">{t('Cancelar')}</button>
          <button onClick={capture} disabled={!ready || working}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50">
            {working && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('Usar este fotograma')}
          </button>
        </div>
      </div>
    </div>
  )
}
