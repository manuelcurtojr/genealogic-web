'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, Loader2, Trash2, AlertCircle, Image as ImageIcon, X, Pencil, Check,
} from 'lucide-react'
import {
  uploadKennelPhotoAction,
  deleteKennelPhotoAction,
  updatePhotoCaptionAction,
} from '@/lib/kennel/content-actions'
import { useT } from '@/components/i18n/locale-provider'

type Photo = {
  id: string
  url: string
  caption: string | null
  position: number | null
}

interface Props {
  kennelId: string
  kind: 'gallery' | 'facilities'
  photos: Photo[]
  /** Mínimo de fotos para que la página se publique (3). Informativo. */
  minToPublish?: number
}

export default function PhotosManager({ kennelId, kind, photos, minToPublish = 3 }: Props) {
  const t = useT()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const count = photos.length
  const remaining = Math.max(0, minToPublish - count)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)
    setProgress({ done: 0, total: files.length })

    let done = 0
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.set('kennelId', kennelId)
        fd.set('kind', kind)
        fd.set('file', file)
        await uploadKennelPhotoAction(fd)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        const human =
          msg === 'invalid_mime' ? `${file.name}: ${t('formato no soportado (JPG/PNG/WebP/HEIC)')}` :
          msg === 'file_too_large' ? `${file.name}: ${t('pesa más de 10 MB')}` :
          msg === 'requires_kennel_pro' ? t('Esta función requiere Kennel Pro') :
          `${file.name}: ${msg}`
        setError(human)
        // Continuamos con las siguientes
      }
      done++
      setProgress({ done, total: files.length })
    }
    setUploading(false)
    setProgress(null)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div className="rounded-2xl border-2 border-dashed border-hairline bg-surface-soft p-6 sm:p-8 text-center hover:border-ink/30 transition-colors">
        <Upload className="mx-auto h-7 w-7 text-muted" />
        <p className="mt-3 text-[14px] font-semibold text-ink">
          {kind === 'gallery' ? t('Sube fotos a tu galería') : t('Sube fotos de tus instalaciones')}
        </p>
        <p className="mt-1 text-[12px] text-muted max-w-md mx-auto leading-snug">
          {t('JPG, PNG, WebP o HEIC, hasta 10 MB por imagen. Puedes seleccionar varias a la vez.')}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          onChange={e => handleFiles(e.target.files)}
          disabled={uploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-50 transition"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progress ? `${t('Subiendo')} ${progress.done}/${progress.total}...` : t('Subiendo...')}
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" /> {t('Seleccionar fotos')}
            </>
          )}
        </button>
        <p className="mt-3 text-[11px] text-muted">
          {count} {count === 1 ? t('foto') : t('fotos')} ·{' '}
          {remaining > 0 ? (
            <span className="text-amber-700">{t('faltan')} {remaining} {t('para publicar esta página')}</span>
          ) : (
            <span className="text-emerald-700">✓ {t('Lista para publicar')}</span>
          )}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-red-700 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-canvas p-8 text-center">
          <ImageIcon className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-3 text-[13.5px] text-body">{t('Aún no has subido ninguna foto.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {photos.map(p => (
            <PhotoCard key={p.id} photo={p} kennelId={kennelId} />
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoCard({ photo, kennelId }: { photo: Photo; kennelId: string }) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(photo.caption || '')

  function remove() {
    if (!confirm(t('¿Borrar esta foto? No se puede deshacer.'))) return
    startTransition(async () => {
      try {
        await deleteKennelPhotoAction({ photoId: photo.id, kennelId })
        router.refresh()
      } catch { /* TODO surface */ }
    })
  }

  function saveCaption() {
    startTransition(async () => {
      try {
        await updatePhotoCaptionAction({ photoId: photo.id, kennelId, caption })
        setEditing(false)
        router.refresh()
      } catch { /* TODO surface */ }
    })
  }

  return (
    <figure className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas">
      <div className="aspect-square overflow-hidden bg-surface-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || ''}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      </div>

      {/* Caption + acciones (siempre visibles, no solo en hover) */}
      <div className="px-2.5 py-2 border-t border-hairline">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              autoFocus
              placeholder={t('Pie de foto (opcional)')}
              className="flex-1 min-w-0 rounded border border-hairline bg-canvas px-2 py-1 text-[11.5px] text-ink focus:border-ink focus:outline-none"
            />
            <button
              onClick={saveCaption}
              disabled={pending}
              className="inline-flex items-center justify-center h-6 w-6 rounded bg-ink text-on-primary hover:opacity-90 flex-shrink-0"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <p className={`flex-1 min-w-0 truncate text-[11.5px] ${photo.caption ? 'text-body' : 'text-muted italic'}`}>
              {photo.caption || t('Sin pie de foto')}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-muted hover:text-ink p-0.5 flex-shrink-0"
              title={t('Editar pie de foto')}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={remove}
              disabled={pending}
              className="text-muted hover:text-red-600 p-0.5 flex-shrink-0 disabled:opacity-50"
              title={t('Borrar foto')}
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>
    </figure>
  )
}
