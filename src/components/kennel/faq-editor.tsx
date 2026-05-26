'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Check, Trash2, Pencil, X, HelpCircle, AlertCircle } from 'lucide-react'
import { upsertFAQEntryAction, deleteFAQEntryAction } from '@/lib/kennel/content-actions'

type Entry = { id: string; title: string; content: string }

export default function FAQEditor({
  kennelId, initialEntries,
}: {
  kennelId: string
  initialEntries: Entry[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Preguntas frecuentes
          </h2>
          <p className="mt-1 text-[12.5px] text-muted max-w-prose">
            Aparecen en el Inicio de tu web pública. Las respondes una vez y ahorras
            tiempo a tus clientes (y a ti).
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-bold text-on-primary hover:opacity-90 transition self-start"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva pregunta
          </button>
        )}
      </div>

      {creating && (
        <EntryForm
          kennelId={kennelId}
          onDone={() => { setCreating(false); router.refresh() }}
          onCancel={() => setCreating(false)}
          onError={setError}
        />
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {initialEntries.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 text-center">
          <HelpCircle className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-3 text-[14px] font-semibold text-ink">Aún no hay preguntas</p>
          <p className="mt-1 text-[12.5px] text-body max-w-sm mx-auto leading-snug">
            Empieza con las 3-5 que te preguntan siempre: precio, disponibilidad, garantía,
            documentación, visitas...
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-hairline divide-y divide-hairline bg-canvas">
          {initialEntries.map(entry => (
            <EntryRow key={entry.id} entry={entry} kennelId={kennelId} onError={setError} />
          ))}
        </ul>
      )}
    </div>
  )
}

function EntryRow({
  entry, kennelId, onError,
}: { entry: Entry; kennelId: string; onError: (msg: string | null) => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('¿Borrar esta pregunta?')) return
    onError(null)
    startTransition(async () => {
      try {
        await deleteFAQEntryAction({ entryId: entry.id, kennelId })
        router.refresh()
      } catch (err) {
        onError(err instanceof Error ? err.message : 'No se pudo borrar')
      }
    })
  }

  if (editing) {
    return (
      <li className="p-3 sm:p-4">
        <EntryForm
          kennelId={kennelId}
          initialEntry={entry}
          onDone={() => { setEditing(false); router.refresh() }}
          onCancel={() => setEditing(false)}
          onError={onError}
        />
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 p-3 sm:p-4">
      <HelpCircle className="h-4 w-4 mt-1 text-muted flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{entry.title}</p>
        <p className="mt-1 text-[12.5px] text-body line-clamp-2 leading-snug whitespace-pre-line">{entry.content}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-muted hover:text-ink p-1.5 rounded-md hover:bg-surface-soft"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-muted hover:text-red-600 p-1.5 rounded-md hover:bg-surface-soft disabled:opacity-50"
          title="Borrar"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </li>
  )
}

function EntryForm({
  kennelId, initialEntry, onDone, onCancel, onError,
}: {
  kennelId: string
  initialEntry?: Entry
  onDone: () => void
  onCancel: () => void
  onError: (msg: string | null) => void
}) {
  const [title, setTitle] = useState(initialEntry?.title || '')
  const [content, setContent] = useState(initialEntry?.content || '')
  const [pending, startTransition] = useTransition()

  function save() {
    onError(null)
    startTransition(async () => {
      try {
        await upsertFAQEntryAction({
          kennelId,
          entryId: initialEntry?.id,
          title,
          content,
        })
        onDone()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        const human =
          msg === 'title_too_short' ? 'La pregunta es muy corta.' :
          msg === 'content_too_short' ? 'La respuesta es muy corta.' :
          `No se pudo guardar: ${msg}`
        onError(human)
      }
    })
  }

  return (
    <div className="rounded-xl border border-ink bg-canvas p-3 sm:p-4 space-y-3">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Pregunta (ej: ¿Hacéis envíos a península?)"
        autoFocus
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] font-semibold text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        placeholder="Respuesta clara y directa..."
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-body placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-y leading-[1.55]"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:text-ink transition"
        >
          <X className="h-3 w-3" /> Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !title.trim() || !content.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Guardar
        </button>
      </div>
    </div>
  )
}
