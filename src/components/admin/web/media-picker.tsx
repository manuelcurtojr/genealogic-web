'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  listMediaAction,
  uploadMediaAction,
  deleteMediaAction,
} from '@/app/(dashboard)/web/media-actions';

type MediaItem = {
  name: string;
  url: string;
  size: number;
  created_at: string;
  mime_type?: string;
};

/**
 * Selector de imagen con 3 caminos:
 *  - Subir foto desde el dispositivo (input[type=file] oculto + server action)
 *  - Elegir de la biblioteca (drawer con todas las fotos del tenant)
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
        <div className="relative mb-2 overflow-hidden rounded-lg border border-ink-200 bg-ink-50/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
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
        <div className="mb-2 flex h-24 items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50/30">
          <p className="text-xs text-ink-400">Sin imagen</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-ink-300 disabled:opacity-50"
        >
          {uploading ? 'Subiendo…' : '↑ Subir'}
        </button>
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-ink-300"
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
        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-mono text-ink-950 outline-none focus:border-brand"
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
// Drawer de la biblioteca
// ────────────────────────────────────────────────────────────────────
function MediaLibraryDrawer({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listMediaAction();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function deleteItem(path: string) {
    if (!confirm('¿Borrar esta imagen? La operación es definitiva.')) return;
    setDeletingPath(path);
    startTransition(async () => {
      try {
        await deleteMediaAction(path);
        setItems((prev) => prev.filter((it) => it.name !== path));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setDeletingPath(null);
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Biblioteca de medios"
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Biblioteca
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink-950">
              Tus imágenes
            </h2>
            <p className="mt-0.5 text-[11px] text-ink-500">
              {items.length} {items.length === 1 ? 'imagen' : 'imágenes'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-500 hover:bg-ink-50"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-200 p-12 text-center">
              <p className="font-display text-lg text-ink-950">No has subido ninguna imagen aún</p>
              <p className="mt-2 text-sm text-ink-500">
                Cierra este panel y pulsa &laquo;Subir&raquo; para añadir tu primera foto.
              </p>
            </div>
          )}
          {!loading && items.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((it) => (
                <li
                  key={it.name}
                  className="group relative overflow-hidden rounded-lg border border-ink-100 bg-ink-50 transition hover:border-brand"
                >
                  <button
                    type="button"
                    onClick={() => onPick(it.url)}
                    className="block w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.url}
                      alt={it.name}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
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
          )}
        </div>
      </aside>
    </>
  );
}
