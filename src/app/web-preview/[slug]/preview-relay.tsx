'use client';

import { useEffect } from 'react';

/**
 * Componente que vive dentro del iframe de preview. Captura clicks sobre
 * las secciones (envueltas con `data-section-id`) y los reenvía al
 * parent (el editor) vía postMessage. También gestiona el estado visual
 * de "seleccionada" leyendo `?selected=ID` de la URL.
 */
export function PreviewClickRelay() {
  useEffect(() => {
    function applySelection(id: string | null) {
      // Limpia selección anterior
      document
        .querySelectorAll('.genealogic-section-selected')
        .forEach((n) => n.classList.remove('genealogic-section-selected'));
      if (!id) return;
      const el = document.querySelector(`[data-section-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.classList.add('genealogic-section-selected');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Selección inicial (vía query param ?selected= cuando el iframe se monta)
    const url = new URL(window.location.href);
    applySelection(url.searchParams.get('selected'));

    // Selecciones posteriores enviadas por el parent vía postMessage
    function onParentMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'genealogic:set-selection') {
        applySelection(typeof data.id === 'string' ? data.id : null);
      }
    }
    window.addEventListener('message', onParentMessage);

    // Manejador de click delegado
    //
    // Política: clickar cualquier punto dentro de una sección la selecciona
    // en el editor. Pero NO bloqueamos toda la interactividad — la mayoría
    // de elementos (summary de FAQ, botones de toggle, video controls,
    // etc.) deben seguir funcionando para que la previsualización refleje
    // lo que verá el visitante. Solo interceptamos lo que provocaría
    // navegación o submit fuera del iframe:
    //   - <a href> con destino → preventDefault (evita salir del preview)
    //   - <button type="submit"> dentro de un <form> → preventDefault
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Si el click cae dentro de un elemento editable inline activo,
      // dejamos al navegador hacer su cosa.
      if (target.closest('[contenteditable="true"]')) return;
      const wrapper = target.closest('[data-section-id]') as HTMLElement | null;
      if (!wrapper) return;

      // Bloqueamos navegación real, salvo:
      //  - Links explícitamente marcados con data-genealogic-tab="true" (tabs
      //    internas que cambian ?tab=… dentro del mismo iframe)
      //  - Links con target="_blank" (abren en otra pestaña, no afectan
      //    al iframe — útil para "Ver pedigrí" externo a Genealogic)
      const link = target.closest('a') as HTMLAnchorElement | null;
      if (link && link.getAttribute('href')) {
        const allowNav = link.dataset.genealogicTab === 'true' || link.target === '_blank';
        if (!allowNav) e.preventDefault();
      }
      // Bloqueamos submits
      const submitBtn = target.closest(
        'button[type="submit"], input[type="submit"]',
      ) as HTMLElement | null;
      if (submitBtn) {
        e.preventDefault();
      }

      const id = wrapper.dataset.sectionId;
      if (!id) return;
      window.parent?.postMessage(
        { type: 'genealogic:select-section', id },
        window.location.origin,
      );
    }

    // Doble-click para edición inline en elementos con data-genealogic-edit
    function onDblClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const editable = target.closest('[data-genealogic-edit]') as HTMLElement | null;
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();
      const wrapper = editable.closest('[data-section-id]') as HTMLElement | null;
      if (!wrapper) return;
      const sectionId = wrapper.dataset.sectionId;
      const path = editable.dataset.genealogicEdit;
      if (!sectionId || !path) return;
      makeEditable(editable, sectionId, path);
    }

    function makeEditable(el: HTMLElement, sectionId: string, path: string) {
      const original = el.innerText;
      el.contentEditable = 'true';
      el.classList.add('genealogic-editing');
      el.focus();
      // Selecciona todo el contenido al entrar
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel?.removeAllRanges();
      sel?.addRange(range);

      function commit(save: boolean) {
        el.contentEditable = 'false';
        el.classList.remove('genealogic-editing');
        const newText = el.innerText.trim();
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('keydown', onKey);
        if (!save || newText === original.trim()) {
          el.innerText = original;
          return;
        }
        // Mandamos el cambio al parent
        window.parent?.postMessage(
          {
            type: 'genealogic:inline-update',
            sectionId,
            path,
            value: newText,
          },
          window.location.origin,
        );
      }

      function onBlur() {
        commit(true);
      }
      function onKey(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          el.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          commit(false);
        }
      }
      el.addEventListener('blur', onBlur);
      el.addEventListener('keydown', onKey);
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('dblclick', onDblClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('dblclick', onDblClick, true);
      window.removeEventListener('message', onParentMessage);
    };
  }, []);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          [data-section-id] {
            position: relative;
            cursor: pointer;
            transition: outline-color 0.15s ease;
            outline: 2px solid transparent;
            outline-offset: -2px;
          }
          [data-section-id]:hover {
            outline-color: rgba(255, 156, 64, 0.7);
          }
          [data-section-id]:hover::before {
            content: attr(data-section-type);
            position: absolute;
            top: 8px;
            left: 8px;
            z-index: 100;
            background: #f97316;
            color: white;
            font-family: ui-monospace, monospace;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 4px;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          [data-section-id].genealogic-section-selected {
            outline-color: rgba(215, 71, 9, 1);
            outline-width: 3px;
          }
          [data-section-id].genealogic-section-selected::before {
            content: attr(data-section-type) ' · seleccionada';
            position: absolute;
            top: 8px;
            left: 8px;
            z-index: 100;
            background: #d74709;
            color: white;
            font-family: ui-monospace, monospace;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 4px;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            opacity: 1;
          }
          /* Cursor crosshair en el body para indicar modo edición */
          html { cursor: default; }

          /* Edición inline */
          [data-genealogic-edit] {
            cursor: text;
            transition: background-color 0.15s ease, box-shadow 0.15s ease;
            border-radius: 4px;
          }
          [data-genealogic-edit]:hover {
            background: rgba(255, 156, 64, 0.12);
            box-shadow: 0 0 0 4px rgba(255, 156, 64, 0.12);
          }
          [data-genealogic-edit].genealogic-editing,
          [data-genealogic-edit][contenteditable="true"] {
            background: rgba(255, 156, 64, 0.18);
            box-shadow: 0 0 0 4px rgba(255, 156, 64, 0.25);
            outline: none;
          }
          [data-genealogic-edit]::after {
            content: '✎';
            display: inline-block;
            margin-left: 8px;
            font-size: 20px;
            line-height: 1;
            opacity: 0;
            transition: opacity 0.15s ease;
            vertical-align: middle;
            color: rgba(255, 156, 64, 0.9);
          }
          [data-genealogic-edit]:hover::after { opacity: 1; }
        `,
      }}
    />
  );
}
