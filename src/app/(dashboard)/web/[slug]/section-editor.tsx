'use client';

import { useState, useTransition } from 'react';
import { updateSectionProps } from '../actions';
import { getSectionSchema } from '@/lib/kennel/section-schemas';
import { SectionForm } from '@/components/admin/web/section-form';
import { useT } from '@/components/i18n/locale-provider';

type Section = {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>;
};

/**
 * Si la sección tiene schema declarado → form con campos nombrados.
 * Si no → fallback a JSON crudo.
 */
export function SectionEditor({
  pageSlug,
  section,
}: {
  pageSlug: string;
  section: Section;
}) {
  const schema = getSectionSchema(section.type);
  if (schema) {
    return (
      <SectionForm
        pageSlug={pageSlug}
        sectionId={section.id}
        schema={schema}
        initialValue={section.props ?? {}}
      />
    );
  }
  return <RawJsonEditor pageSlug={pageSlug} section={section} />;
}

function RawJsonEditor({ pageSlug, section }: { pageSlug: string; section: Section }) {
  const t = useT();
  const initial = JSON.stringify(section.props ?? {}, null, 2);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = value !== initial;

  function format() {
    try {
      const parsed = JSON.parse(value);
      setValue(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function save() {
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateSectionProps(pageSlug, section.id, parsed);
        setSavedAt(new Date());
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div>
      <p className="mb-2 text-[11px] text-muted">
        {t('Esta sección aún no tiene formulario específico. Edita las props como JSON crudo.')}
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        rows={Math.min(20, Math.max(8, value.split('\n').length + 1))}
        className="w-full rounded-lg border border-hairline bg-surface-soft px-3 py-2 font-mono text-xs text-ink outline-none focus:border-brand"
      />
      {error && (
        <p className="mt-2 rounded-md bg-[var(--red-200/60)] px-3 py-2 text-xs text-[color:var(--red-700)] ring-1 ring-[color:var(--red-200/60)]">
          {t('JSON no válido:')} {error}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          {isPending && t('Guardando…')}
          {!isPending && savedAt && `✓ ${t('Guardado a las')} ${savedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={format}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-muted"
          >
            {t('Formatear')}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || isPending}
            className="rounded-lg bg-ink px-4 py-1.5 text-xs font-medium text-white transition hover:bg-ink disabled:opacity-40"
          >
            {t('Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
}
