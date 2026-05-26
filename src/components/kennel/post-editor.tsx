'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, Loader2, AlertCircle, Trash2, Upload, X, ImagePlus,
} from 'lucide-react'
import {
  upsertPostAction,
  deletePostAction,
  uploadPostCoverAction,
} from '@/lib/kennel/content-actions'

interface Props {
  kennelId: string
  /** Si pasa post → modo editar. Si no → modo crear. */
  initialPost?: {
    id: string
    title: string
    excerpt: string | null
    body_text: string | null
    cover_image_url: string | null
    status: string
  } | null
}

export default function PostEditor({ kennelId, initialPost }: Props) {
  const router = useRouter()
  const isEdit = !!initialPost

  const [title, setTitle] = useState(initialPost?.title || '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '')
  const [body, setBody] = useState(initialPost?.body_text || '')
  const [coverUrl, setCoverUrl] = useState<string | null>(initialPost?.cover_image_url || null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [pending, startTransition] = useTransition()
  const [deleting, startDeleting] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function save(publish: boolean) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await upsertPostAction({
          kennelId,
          postId: initialPost?.id,
          title,
          excerpt: excerpt || null,
          body,
          coverImageUrl: coverUrl,
          publish,
        })
        if (!isEdit) {
          // Tras crear, vamos a la edición del nuevo post
          router.push(`/kennel/contenido/blog/${result.id}`)
        } else {
          router.refresh()
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'No se pudo guardar'
        const human = msg === 'title_too_short' ? 'El título es muy corto (mínimo 3 caracteres)' : msg
        setError(human)
      }
    })
  }

  function handleDelete() {
    if (!initialPost) return
    if (!confirm('¿Borrar este post? No se puede deshacer.')) return
    startDeleting(async () => {
      try {
        await deletePostAction({ postId: initialPost.id, kennelId })
        router.push('/kennel/contenido/blog')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo borrar')
      }
    })
  }

  async function handleCoverUpload(file: File) {
    setError(null)
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.set('kennelId', kennelId)
      fd.set('file', file)
      const { url } = await uploadPostCoverAction(fd)
      setCoverUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingCover(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6 space-y-4">
        {/* Título */}
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Título</span>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Nueva camada disponible — primavera 2026"
            className="mt-1.5 w-full rounded-lg border border-hairline bg-canvas px-3 py-2.5 text-[16px] font-semibold text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
          />
        </label>

        {/* Excerpt */}
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Resumen <span className="font-normal lowercase text-muted/70">(opcional)</span></span>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Frase corta que invite a leer (aparece en la lista del blog y en redes sociales)."
            className="mt-1.5 w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-body placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-y"
          />
        </label>

        {/* Cover */}
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Imagen de portada</span>
          {coverUrl ? (
            <div className="mt-1.5 relative rounded-lg overflow-hidden border border-hairline aspect-[16/9] bg-surface-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="absolute top-2 right-2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition"
                title="Quitar imagen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleCoverUpload(f)
                }}
                disabled={uploadingCover}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-soft px-3 py-2 text-[13px] font-medium text-body hover:border-ink/30 hover:text-ink transition disabled:opacity-50"
              >
                {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                {uploadingCover ? 'Subiendo...' : 'Subir imagen'}
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Cuerpo del post</span>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={18}
            placeholder="Escribe el contenido del post. Soporta saltos de párrafo."
            className="mt-1.5 w-full rounded-lg border border-hairline bg-canvas px-3 py-3 text-[14.5px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-y leading-[1.55]"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={pending || !title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-semibold text-body hover:border-ink/30 hover:text-ink disabled:opacity-40 transition"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={pending || !title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Publicar
          </button>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-muted hover:text-red-600 transition disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Borrar post
          </button>
        )}
      </div>
    </div>
  )
}
