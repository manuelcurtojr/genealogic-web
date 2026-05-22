'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { updateSectionPropPath } from '@/app/(dashboard)/web/actions';

const VIEWPORTS = {
  desktop: { label: 'Desktop', width: '100%' },
  tablet: { label: 'Tablet', width: '768px' },
  mobile: { label: 'Móvil', width: '390px' },
} as const;

type Viewport = keyof typeof VIEWPORTS;

/**
 * Iframe que renderiza /web-preview/[slug] con draft_sections.
 *
 * Comunicación con el iframe (mismo origen) vía postMessage:
 *  - Click en una sección dentro del iframe → mensaje `genealogic:select-section`
 *    con `id`. El parent actualiza el query param `?section=ID` para que
 *    el panel derecho muestre el form de esa sección.
 *  - Save / reorder en el editor → CustomEvent `genealogic:web-saved`. El
 *    iframe se remonta con un nuevo `_v` para garantizar GET fresco.
 *
 * El iframe URL incluye `?selected={id}` para que dentro del iframe se
 * pueda dar feedback visual de cuál es la seleccionada actualmente
 * (outline naranja sólido).
 */
export function PreviewFrame({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('section');

  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [version, setVersion] = useState(() => Date.now());
  const [reloading, setReloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Push selección al iframe sin recargarlo cuando el usuario cambia la
  // sección activa desde la lista de la izquierda.
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'genealogic:set-selection', id: selectedId },
      window.location.origin,
    );
  }, [selectedId]);

  // Recarga al guardar
  useEffect(() => {
    function onSave() {
      setReloading(true);
      setVersion(Date.now());
    }
    window.addEventListener('genealogic:web-saved', onSave as EventListener);
    return () => window.removeEventListener('genealogic:web-saved', onSave as EventListener);
  }, []);

  // Escucha clicks + edición inline dentro del iframe
  const [, startTransition] = useTransition();
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'genealogic:select-section' && typeof data.id === 'string') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('section', data.id);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
      if (
        data.type === 'genealogic:inline-update' &&
        typeof data.sectionId === 'string' &&
        typeof data.path === 'string'
      ) {
        startTransition(async () => {
          await updateSectionPropPath(slug, data.sectionId, data.path, data.value);
          window.dispatchEvent(new CustomEvent('genealogic:web-saved'));
        });
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pathname, router, searchParams, slug]);

  function manualReload() {
    setReloading(true);
    setVersion(Date.now());
  }

  const src = `/web-preview/${slug}?_v=${version}${selectedId ? `&selected=${encodeURIComponent(selectedId)}` : ''}`;

  return (
    <div className="flex h-full flex-col bg-ink-100/40">
      <div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-white px-4 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-ink-100 p-0.5">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewport(v)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                viewport === v
                  ? 'bg-white text-ink-950 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {VIEWPORTS[v].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-500">
          {reloading && <span>Actualizando…</span>}
          <span className="hidden sm:inline text-ink-400">
            Pulsa cualquier sección para editarla
          </span>
          <button
            type="button"
            onClick={manualReload}
            className="rounded-md p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Recargar previsualización"
            title="Recargar"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1015.5-6.5L21 8M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className="mx-auto h-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/10 transition-[width] duration-300"
          style={{ width: VIEWPORTS[viewport].width, maxWidth: '100%' }}
        >
          <iframe
            ref={iframeRef}
            key={version}
            src={src}
            className="h-full w-full border-0"
            title="Previsualización"
            onLoad={() => {
              setReloading(false);
              // Tras cada (re)carga, sincroniza la selección actual con el iframe
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'genealogic:set-selection', id: selectedId },
                window.location.origin,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
