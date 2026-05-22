'use client'

import { useEffect, useState } from 'react'
import SlidePanel from '@/components/ui/slide-panel'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink } from 'lucide-react'

interface Page {
  id: string
  slug: string
  title: string
  page_type: string
  content_md: string | null
  cover_image_url: string | null
  is_published: boolean
  position: number
  show_in_nav: boolean
  updated_at: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (p: Page) => void
  onDeleted: (id: string) => void
  editing: Page | null
  kennelId: string
  kennelSlug: string
  customDomain: string | null
}

export default function PageEditorPanel({
  open, onClose, onSaved, onDeleted, editing, kennelId, kennelSlug, customDomain,
}: Props) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [pageType, setPageType] = useState('custom')
  const [contentMd, setContentMd] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [showInNav, setShowInNav] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setSlug(editing.slug)
      setPageType(editing.page_type)
      setContentMd(editing.content_md || '')
      setCoverUrl(editing.cover_image_url || '')
      setIsPublished(editing.is_published)
      setShowInNav(editing.show_in_nav)
    } else {
      setTitle(''); setSlug(''); setPageType('custom')
      setContentMd(''); setCoverUrl(''); setIsPublished(false); setShowInNav(true)
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) {
      alert('Título y slug son obligatorios')
      return
    }
    setSaving(true)
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    try {
      const url = editing ? `/api/pages/${editing.id}` : '/api/pages'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId,
          title: title.trim(),
          slug: cleanSlug,
          page_type: pageType,
          content_md: contentMd,
          cover_image_url: coverUrl.trim() || null,
          is_published: isPublished,
          show_in_nav: showInNav,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      const data = await res.json()
      onSaved(data.page)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('¿Eliminar esta página? La URL pública dejará de funcionar.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pages/${editing.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      onDeleted(editing.id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const publicBase = customDomain ? `https://${customDomain}` : `https://genealogic.io/c/${kennelSlug}`
  const publicUrl = editing && editing.is_published ? `${publicBase}/${editing.slug}` : null

  return (
    <SlidePanel open={open} onClose={onClose} title={editing ? 'Editar página' : 'Nueva página'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Título *">
            <input type="text" required value={title} onChange={e => {
              setTitle(e.target.value)
              if (!editing && !slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
            }} className="input" placeholder="Sobre nosotros" />
          </Field>

          <Field label="Slug (URL) *">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted whitespace-nowrap">/{kennelSlug}/</span>
              <input type="text" required value={slug} onChange={e => setSlug(e.target.value)} className="input" placeholder="sobre-nosotros" />
            </div>
          </Field>

          <Field label="Tipo de página">
            <select value={pageType} onChange={e => setPageType(e.target.value)} className="input">
              <option value="home">Inicio</option>
              <option value="about">Sobre nosotros</option>
              <option value="dogs">Perros</option>
              <option value="litters">Camadas</option>
              <option value="contact">Contacto</option>
              <option value="faq">FAQ</option>
              <option value="blog">Blog</option>
              <option value="custom">Personalizada</option>
            </select>
          </Field>

          <Field label="Imagen de portada (URL)">
            <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="input" placeholder="https://…" />
          </Field>
        </div>

        <Field label="Contenido (Markdown)">
          <textarea
            value={contentMd}
            onChange={e => setContentMd(e.target.value)}
            className="input min-h-[300px] font-mono"
            placeholder="# Título\n\nTu contenido aquí. Soporta **negrita**, *cursiva*, listas y enlaces."
          />
          <span className="block text-[11px] text-muted mt-1">{contentMd.length} caracteres</span>
        </Field>

        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-body">Publicada (visible en la web pública)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={showInNav} onChange={e => setShowInNav(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-body">Mostrar en la navegación del sitio</span>
          </label>
        </div>

        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-body hover:text-ink underline">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver página pública
          </a>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          {editing ? (
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="text-sm text-muted hover:text-[color:var(--error)] transition inline-flex items-center gap-1.5 disabled:opacity-50">
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : (editing ? 'Guardar' : 'Crear')}
            </Button>
          </div>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--hairline, #e5e5e5);
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          color: var(--ink, #0f0f0f);
          outline: none;
          font-family: inherit;
        }
        :global(.input:focus) { border-color: var(--ink, #0f0f0f); }
      `}</style>
    </SlidePanel>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}
