'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, GripVertical, Star, Sparkles, Film, Play, ImagePlus } from 'lucide-react'
import { parseVideoUrl, youtubePoster, fetchVimeoPoster, type VideoProvider } from '@/lib/video'
import { useT } from '@/components/i18n/locale-provider'

interface GalleryTabProps { dogId: string; userId: string }

const POSTER_FALLBACK = '/icon.svg?v=2'

export default function GalleryTab({ dogId, userId }: GalleryTabProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [upscalingId, setUpscalingId] = useState<string | null>(null)
  const [upscaleMsg, setUpscaleMsg] = useState<string | null>(null)
  const [dogThumb, setDogThumb] = useState<string | null>(null)
  // Vídeo
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('youtube')
  const [linkInput, setLinkInput] = useState('')
  const [videoBusy, setVideoBusy] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [posterTargetId, setPosterTargetId] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const posterFileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const t = useT()

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
      await supabase.from('dogs').update({ thumbnail_url: photos[0].url }).eq('id', dogId)
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
      if (newPos === 0) await supabase.from('dogs').update({ thumbnail_url: publicUrl }).eq('id', dogId)
    }
    setUploading(false)
    loadPhotos()
  }

  // Captura un fotograma del vídeo (en el navegador) como portada.
  function capturePoster(file: File): Promise<Blob | null> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video')
        video.preload = 'metadata'; video.muted = true; (video as any).playsInline = true
        const objUrl = URL.createObjectURL(file)
        video.src = objUrl
        const cleanup = () => URL.revokeObjectURL(objUrl)
        video.onloadeddata = () => { try { video.currentTime = Math.min(1, (video.duration || 2) / 2) } catch { resolve(null); cleanup() } }
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 360
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(null); cleanup(); return }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((b) => { resolve(b); cleanup() }, 'image/jpeg', 0.85)
        }
        video.onerror = () => { resolve(null); cleanup() }
      } catch { resolve(null) }
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

  // Subir vídeo (archivo) → captura portada
  async function handleUploadVideo(file: File | null) {
    if (!file) return
    setVideoError(null); setVideoBusy(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${dogId}/video-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('dog-photos').upload(path, file)
    if (upErr) { setVideoError(upErr.message); setVideoBusy(false); return }
    const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(path)
    // Portada: fotograma capturado o fallback
    let posterUrl = dogThumb || POSTER_FALLBACK
    let posterPath: string | null = null
    const blob = await capturePoster(file)
    if (blob) { const up = await uploadPoster(blob); if (up) { posterUrl = up.url; posterPath = up.path } }
    await insertVideoRow({ video_provider: 'upload', video_url: publicUrl, url: posterUrl, storage_path: posterPath, video_storage_path: path })
    setVideoBusy(false); setShowVideoForm(false)
    loadPhotos()
  }

  // Cambiar la portada de un vídeo
  async function handleChangePoster(file: File | null) {
    const target = photos.find(p => p.id === posterTargetId)
    setPosterTargetId(null)
    if (!file || !target) return
    setVideoBusy(true)
    // borra portada anterior (si era de nuestro storage)
    if (target.storage_path) await supabase.storage.from('dog-photos').remove([target.storage_path])
    const up = await uploadPoster(file)
    if (up) await supabase.from('dog_photos').update({ url: up.url, storage_path: up.path }).eq('id', target.id)
    setVideoBusy(false)
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
    await supabase.from('dogs').update({ thumbnail_url: list[0]?.url || null }).eq('id', dogId)
    setPhotos(list)
  }

  async function movePhoto(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    const reordered = [...photos]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setPhotos(reordered)
    for (let i = 0; i < reordered.length; i++) await supabase.from('dog_photos').update({ position: i }).eq('id', reordered[i].id)
    await supabase.from('dogs').update({ thumbnail_url: reordered[0]?.url || null }).eq('id', dogId)
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

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent) { e.preventDefault() }
  function handleDrop(idx: number) { if (dragIdx !== null) movePhoto(dragIdx, idx); setDragIdx(null) }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
      <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={e => handleUploadVideo(e.target.files?.[0] || null)} />
      <input ref={posterFileRef} type="file" accept="image/*" className="hidden" onChange={e => handleChangePoster(e.target.files?.[0] || null)} />

      <p className="text-[11px] text-muted">{t('Arrastra para reordenar. El primer elemento será la portada del perfil. Puedes añadir fotos y vídeos.')}</p>

      <div className="flex gap-2 flex-wrap">
        {/* Subir foto */}
        <button onClick={() => fileRef.current?.click()} disabled={uploading} title={t('Subir fotos')}
          className="w-[88px] h-[88px] border-2 border-dashed border-hairline rounded-lg flex flex-col items-center justify-center gap-1 hover:border-ink/40 transition cursor-pointer flex-shrink-0">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted" /> : <><Plus className="w-5 h-5 text-muted" /><span className="text-[9px] text-muted">{t('Foto')}</span></>}
        </button>
        {/* Añadir vídeo */}
        <button onClick={() => { setShowVideoForm(v => !v); setVideoError(null) }} title={t('Añadir vídeo')}
          className="w-[88px] h-[88px] border-2 border-dashed border-hairline rounded-lg flex flex-col items-center justify-center gap-1 hover:border-ink/40 transition cursor-pointer flex-shrink-0">
          <Film className="w-5 h-5 text-muted" /><span className="text-[9px] text-muted">{t('Vídeo')}</span>
        </button>

        {/* Media items */}
        {photos.map((photo, idx) => {
          const isVideo = photo.media_type === 'video'
          return (
          <div key={photo.id}
            draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)}
            className={`relative w-[88px] h-[88px] rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing flex-shrink-0 ${dragIdx === idx ? 'opacity-40 ring-2 ring-ink' : ''} ${idx === 0 ? 'ring-2 ring-ink/50' : ''}`}>
            <img src={photo.url} alt="" className="w-full h-full object-cover" />

            {isVideo && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55"><Play className="h-3.5 w-3.5 translate-x-px fill-white text-white" /></span>
              </div>
            )}

            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-ink rounded px-1 py-0.5 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-white" /><span className="text-[8px] text-white font-bold">{t('PERFIL')}</span>
              </div>
            )}
            {isVideo && (
              <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5 flex items-center gap-0.5">
                <Film className="w-2.5 h-2.5 text-white" /><span className="text-[8px] text-white font-bold uppercase">{photo.video_provider}</span>
              </div>
            )}
            {!isVideo && photo.upscaled_at && (
              <div className="absolute bottom-1 left-1 bg-violet-600 rounded px-1 py-0.5 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-white" /><span className="text-[8px] text-white font-bold">{t('IA')}</span>
              </div>
            )}
            {upscalingId === photo.id && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition"><GripVertical className="w-4 h-4 text-ink" /></div>
            </div>

            {/* Acción: cambiar portada (vídeo) o mejorar IA (foto) */}
            {isVideo ? (
              <button onClick={() => { setPosterTargetId(photo.id); posterFileRef.current?.click() }} title={t('Cambiar portada')}
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-ink">
                <ImagePlus className="w-3 h-3" />
              </button>
            ) : (!photo.upscaled_at && upscalingId !== photo.id && (
              <button onClick={() => handleUpscale(photo)} title={t('Mejorar con IA')}
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-violet-600">
                <Sparkles className="w-3 h-3" />
              </button>
            ))}
            <button onClick={() => deletePhoto(photo)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500">
              <X className="w-3 h-3" />
            </button>
          </div>
        )})}
      </div>

      {/* Formulario de vídeo */}
      {showVideoForm && (
        <div className="rounded-xl border border-hairline bg-surface-soft p-3 space-y-3">
          <div className="flex gap-1 rounded-lg bg-canvas p-0.5 w-fit">
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
                {videoBusy ? t('Subiendo y generando portada...') : t('Elegir vídeo (mp4)')}
              </button>
              <p className="mt-1.5 text-[11px] text-muted">{t('Se genera una portada automática del primer fotograma; podrás cambiarla luego. Recomendado < 100 MB; para vídeos largos usa YouTube/Vimeo.')}</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                placeholder={videoProvider === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://vimeo.com/...'}
                className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
              <button onClick={handleAddVideoLink} disabled={videoBusy || !linkInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50">
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
        {t('En las fotos, pulsa')} <Sparkles className="w-3 h-3 inline -mt-0.5" /> {t('para mejorarlas con IA. En los vídeos,')} <ImagePlus className="w-3 h-3 inline -mt-0.5" /> {t('cambia la portada.')}
      </p>
    </div>
  )
}
