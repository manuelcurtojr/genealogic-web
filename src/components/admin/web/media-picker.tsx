'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  listMediaAction,
  uploadMediaAction,
  deleteMediaAction,
  listDogPhotosAction,
  type DogPhoto,
} from '@/app/(dashboard)/web/media-actions';
import { Img } from '@/components/ui/img';

type MediaItem = {
  name: string;
  url: string;
  size: number;
  created_at: string;
  mime_type?: string;
};

type SourceTab = 'library' | 'my-dogs' | 'bred-by-me' | 'site-section';

const TAB_LABELS: Record<SourceTab, string> = {
  library: 'Biblioteca',
  'my-dogs': 'Mis perros',
  'bred-by-me': 'Criados por mí',
  'site-section': 'En la web',
};

/**
 * Selector de imagen con 3 caminos:
 *  - Subir foto desde el dispositivo (input[type=file] oculto + server action)
 *  - Elegir de la biblioteca (drawer con todas las fotos del kennel)
 *  - Pegar URL externa (input directo, fallback de siempre)
 *
 * Renderiza un preview cuando hay valor.
 */
export function MediaPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    const fd = new FormData();
    fd.append('file', f);
    startUpload(async () => {
      try {
        const result = await uploadMediaAction(fd);
        onChange(result.url);
      } catch (err) {
        const msg = (err as Error).message;
        setError(translateError(msg));
      } finally {
        if (inputRef.current) inputRef.current.value = '';
      }
    });
  }

  return (
    <div>
      {/* Preview */}
      {value ? (
        <div className="relative mb-2 overflow-hidden rounded-lg border border-hairline bg-surface-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Img
            w={480}
            src={value}
            alt="preview"
            className="h-32 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-black/80"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="mb-2 flex h-24 items-center justify-center rounded-lg border border-dashed border-hairline bg-surface-soft">
          <p className="text-xs text-muted">Sin imagen</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-muted disabled:opacity-50"
        >
          {uploading ? 'Subiendo…' : '↑ Subir'}
        </button>
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="flex-1 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-muted"
        >
          ⊞ Biblioteca
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pickFile}
        className="hidden"
      />

      {/* URL manual */}
      <input
        type="text"
        value={value}
        placeholder={placeholder ?? 'O pega una URL externa'}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-xs font-mono text-ink outline-none focus:border-brand"
      />

      {error && (
        <p className="mt-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {libraryOpen && (
        <MediaLibraryDrawer
          onClose={() => setLibraryOpen(false)}
          onPick={(url) => {
            onChange(url);
            setLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}

function translateError(msg: string): string {
  switch (msg) {
    case 'no_file':
      return 'No se ha seleccionado ningún archivo.';
    case 'empty_file':
      return 'El archivo está vacío.';
    case 'file_too_large':
      return 'Archivo demasiado grande. Máximo 12 MB.';
    case 'mime_not_allowed':
      return 'Solo imágenes (JPG, PNG, WebP, GIF, AVIF, SVG).';
    case 'forbidden':
      return 'No tienes permisos para subir.';
    default:
      return msg;
  }
}

// ────────────────────────────────────────────────────────────────────
// Drawer multi-fuente: Biblioteca · Mis perros · Criados por mí · En la web
// ────────────────────────────────────────────────────────────────────
function MediaLibraryDrawer({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const [tab, setTab] = useState<SourceTab>('library');
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [dogPhotos, setDogPhotos] = useState<DogPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lib, dogs] = await Promise.all([
          listMediaAction(),
          listDogPhotosAction(),
        ]);
        if (cancelled) return;
        setLibraryItems(lib);
        setDogPhotos(dogs);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function deleteItem(path: string) {
    if (!confirm('¿Borrar esta imagen? La operación es definitiva.')) return;
    setDeletingPath(path);
    startTransition(async () => {
      try {
        await deleteMediaAction(path);
        setLibraryItems((prev) => prev.filter((it) => it.name !== path));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setDeletingPath(null);
      }
    });
  }

  // Counts por tab
  const counts: Record<SourceTab, number> = {
    library: libraryItems.length,
    'my-dogs': dogPhotos.filter((p) => p.source === 'my-dogs').length,
    'bred-by-me': dogPhotos.filter((p) => p.source === 'bred-by-me').length,
    'site-section': dogPhotos.filter((p) => p.source === 'site-section').length,
  };

  // Items que se muestran según el tab activo
  const visibleDogs = dogPhotos.filter((p) => p.source === tab);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Biblioteca de medios"
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Biblioteca de medios
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Elegir imagen</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Tus uploads, fotos de tus perros, fotos del criadero o ya publicadas en la web
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-surface-card"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-hairline overflow-x-auto">
          {(Object.keys(TAB_LABELS) as SourceTab[]).map((k) => {
            const isActive = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`text-[11px] font-semibold uppercase tracking-[0.12em] px-4 py-3 whitespace-nowrap transition-all relative -mb-px border-b-2 ${
                  isActive
                    ? 'border-ink text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {TAB_LABELS[k]}
                <span className={`ml-2 text-[10px] font-mono ${isActive ? 'text-ink' : 'text-muted'}`}>
                  {String(counts[k]).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-surface-card" />
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100 mb-3">
              {error}
            </div>
          )}

          {/* Tab: Biblioteca (uploads) */}
          {!loading && tab === 'library' && (
            libraryItems.length === 0 ? (
              <EmptyState
                title="No has subido ninguna imagen aún"
                hint="Cierra este panel y pulsa «↑ Subir» para añadir tu primera foto."
              />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {libraryItems.map((it) => (
                  <li
                    key={it.name}
                    className="group relative overflow-hidden rounded-lg border border-surface-card bg-surface-card transition hover:border-ink/30"
                  >
                    <button type="button" onClick={() => onPick(it.url)} className="block w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Img w={240} src={it.url} alt={it.name} className="aspect-square w-full object-cover" loading="lazy" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(it.name)}
                      disabled={deletingPath === it.name}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
                    >
                      {deletingPath === it.name ? '…' : '✕'}
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* Tabs: dog photos / site-section */}
          {!loading && tab !== 'library' && (
            visibleDogs.length === 0 ? (
              <EmptyState
                title={
                  tab === 'my-dogs'
                    ? 'No tienes perros públicos con foto'
                    : tab === 'bred-by-me'
                      ? 'Aún no hay perros criados con foto pública'
                      : 'No hay fotos publicadas en otras secciones de la web'
                }
                hint={
                  tab === 'my-dogs'
                    ? 'Añade fotos a tus perros desde el catálogo y volverán a aparecer aquí.'
                    : tab === 'bred-by-me'
                      ? 'Cuando registres perros con tu criadero como kennel_id aparecerán aquí.'
                      : 'En cuanto añadas imágenes a galerías u otras secciones, aparecerán aquí para reutilizarlas.'
                }
              />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleDogs.map((p, i) => (
                  <li
                    key={`${p.url}-${i}`}
                    className="group relative overflow-hidden rounded-lg border border-surface-card bg-surface-card transition hover:border-ink/30"
                  >
                    <button type="button" onClick={() => onPick(p.url)} className="block w-full text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Img w={240} src={p.url} alt={p.name} className="aspect-square w-full object-cover" loading="lazy" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2">
                        <p className="text-[11px] font-semibold text-white truncate">{p.name}</p>
                        {p.meta && <p className="text-[10px] text-white/80 truncate">{p.meta}</p>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </aside>
    </>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline p-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </div>
  );
}
