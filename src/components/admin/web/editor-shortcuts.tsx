'use client';

import { useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  duplicateSection,
  removeSection,
  undoChange,
  redoChange,
  publishPage,
} from '@/app/(dashboard)/web/actions';

/**
 * Atajos de teclado del editor. Solo dispara cuando el foco no está en
 * un input/textarea/contenteditable. Emite `genealogic:web-saved` tras cada
 * acción mutante para que el iframe se recargue.
 *
 *  - Backspace / Delete  → eliminar sección seleccionada
 *  - D                   → duplicar sección seleccionada
 *  - Esc                 → deseleccionar
 *  - Cmd/Ctrl + Z        → undo
 *  - Cmd/Ctrl + Shift+Z  → redo
 *  - Cmd/Ctrl + S        → publicar
 */
export function EditorShortcuts({ pageSlug }: { pageSlug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('section');
  const [, startTransition] = useTransition();

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null;
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }

    function emitSaved() {
      window.dispatchEvent(new CustomEvent('genealogic:web-saved'));
    }

    function clearSelection() {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('section');
      const s = params.toString();
      router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
    }

    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+Z / Cmd+Shift+Z (incluso con foco en input — patrón común)
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          startTransition(async () => {
            await redoChange(pageSlug);
            emitSaved();
          });
        } else {
          startTransition(async () => {
            await undoChange(pageSlug);
            emitSaved();
          });
        }
        return;
      }

      // Cmd+S → publicar
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        startTransition(async () => {
          await publishPage(pageSlug);
          emitSaved();
        });
        return;
      }

      // Atajos sin modifier solo si no está escribiendo
      if (isTypingTarget(e.target)) return;

      // Esc → deseleccionar
      if (e.key === 'Escape') {
        if (selectedId) {
          e.preventDefault();
          clearSelection();
        }
        return;
      }

      if (!selectedId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        startTransition(async () => {
          await removeSection(pageSlug, selectedId);
          clearSelection();
          emitSaved();
        });
        return;
      }

      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        startTransition(async () => {
          await duplicateSection(pageSlug, selectedId);
          emitSaved();
        });
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pageSlug, selectedId, pathname, router, searchParams]);

  return null;
}

/**
 * Botones visibles de Undo/Redo para el header. Llaman a las server
 * actions y emiten el evento de save para refrescar iframe.
 */
export function UndoRedoButtons({
  pageSlug,
  canUndo,
  canRedo,
}: {
  pageSlug: string;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const [, startTransition] = useTransition();

  function emit() {
    window.dispatchEvent(new CustomEvent('genealogic:web-saved'));
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white">
      <button
        type="button"
        title="Deshacer (Cmd+Z)"
        disabled={!canUndo}
        onClick={() => startTransition(async () => { await undoChange(pageSlug); emit(); })}
        className="rounded-l-lg px-2 py-1.5 text-xs text-ink-600 hover:bg-ink-50 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Deshacer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 00-15-6.7L3 13" />
        </svg>
      </button>
      <span className="h-4 w-px bg-ink-100" />
      <button
        type="button"
        title="Rehacer (Cmd+Shift+Z)"
        disabled={!canRedo}
        onClick={() => startTransition(async () => { await redoChange(pageSlug); emit(); })}
        className="rounded-r-lg px-2 py-1.5 text-xs text-ink-600 hover:bg-ink-50 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="Rehacer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0115-6.7l3 2.7" />
        </svg>
      </button>
    </div>
  );
}
