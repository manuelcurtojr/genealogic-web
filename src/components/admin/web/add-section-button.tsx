'use client';

import { useState, useTransition } from 'react';
import { addSection } from '@/app/(dashboard)/web/actions';
import { SectionIcon } from './section-icon';

type CatalogEntry = {
  type: string;
  label: string;
  description: string;
  liveData?: boolean;
};

/**
 * Botón "+ Añadir sección" que abre un drawer con el catálogo filtrado para
 * la página actual. Al pulsar una entrada, llama a addSection y cierra.
 */
export function AddSectionButton({
  pageSlug,
  catalog,
  usedTypes,
}: {
  pageSlug: string;
  catalog: CatalogEntry[];
  usedTypes: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const used = new Set(usedTypes);

  function add(type: string) {
    startTransition(async () => {
      await addSection(pageSlug, type);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('genealogic:web-saved'));
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        + Añadir sección
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="Añadir sección"
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-md"
          >
            <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  Catálogo
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-ink-950">
                  Añadir sección
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-ink-500 hover:bg-ink-50"
                aria-label="Cerrar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-3 text-xs text-ink-500">
                {catalog.length} {catalog.length === 1 ? 'sección disponible' : 'secciones disponibles'} para esta página.
              </p>
              <ul className="space-y-2">
                {catalog.map((entry) => (
                  <li key={entry.type}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => add(entry.type)}
                      className="group w-full rounded-xl border border-ink-100 px-3 py-3 text-left transition hover:border-brand hover:bg-brand-50/30 disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-600 group-hover:bg-brand group-hover:text-white">
                          <SectionIcon type={entry.type} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-ink-950">{entry.label}</span>
                            <div className="flex items-center gap-1">
                              {used.has(entry.type) && (
                                <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[9px] font-medium text-ink-500">
                                  ya en uso
                                </span>
                              )}
                              {entry.liveData && (
                                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                                  LIVE
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-ink-500 leading-snug">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
