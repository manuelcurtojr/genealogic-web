'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { updateSectionProps } from '@/app/(dashboard)/web/actions';
import type { FieldDef, SectionSchema } from '@/lib/kennel/section-schemas';
import { MediaPicker } from './media-picker';

type Props = {
  pageSlug: string;
  sectionId: string;
  schema: SectionSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValue: Record<string, any>;
  onSaved?: () => void;
};

const AUTOSAVE_DELAY_MS = 600;

/**
 * Form schema-driven con autosave. Cada cambio agenda un save al backend
 * tras `AUTOSAVE_DELAY_MS` ms de inactividad. El indicador de estado
 * arriba a la derecha refleja si hay cambios pendientes, si está
 * guardando o cuándo se guardó por última vez.
 */
export function SectionForm({ pageSlug, sectionId, schema, initialValue, onSaved }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [value, setValue] = useState<Record<string, any>>(() => structuredClone(initialValue));
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [isPending, startTransition] = useTransition();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSavedRef = useRef<Record<string, any>>(initialValue);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si la sección cambia (otro click), reinicia estado
  useEffect(() => {
    setValue(structuredClone(initialValue));
    lastSavedRef.current = initialValue;
    setSavedAt(null);
    setPendingSave(false);
  }, [sectionId, initialValue]);

  // Cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function scheduleSave(next: Record<string, unknown>) {
    setPendingSave(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      doSave(next);
    }, AUTOSAVE_DELAY_MS);
  }

  function doSave(payload: Record<string, unknown>) {
    setPendingSave(false);
    startTransition(async () => {
      try {
        await updateSectionProps(pageSlug, sectionId, payload);
        lastSavedRef.current = payload;
        setSavedAt(new Date());
        setError(null);
        onSaved?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('genealogic:web-saved'));
        }
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function flushNow() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    doSave(value);
  }

  function setKey(key: string, val: unknown) {
    setValue((prev) => {
      const next = { ...prev, [key]: val };
      scheduleSave(next);
      return next;
    });
  }

  const isDirty = JSON.stringify(value) !== JSON.stringify(lastSavedRef.current);

  return (
    <div className="space-y-5">
      {schema.fields.map((field) => (
        <FieldRenderer key={field.key} field={field} value={value[field.key]} onChange={(v) => setKey(field.key, v)} />
      ))}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex items-center justify-between gap-3 border-t border-hairline bg-white/95 backdrop-blur px-5 py-3">
        <SaveStatus
          isPending={isPending}
          pendingSave={pendingSave}
          savedAt={savedAt}
          isDirty={isDirty}
        />
        <button
          type="button"
          onClick={flushNow}
          disabled={!isDirty || isPending}
          className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-body hover:border-muted disabled:opacity-30"
          title="Guardar ahora sin esperar al autosave"
        >
          Guardar ya
        </button>
      </div>
    </div>
  );
}

function SaveStatus({
  isPending,
  pendingSave,
  savedAt,
  isDirty,
}: {
  isPending: boolean;
  pendingSave: boolean;
  savedAt: Date | null;
  isDirty: boolean;
}) {
  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-muted">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Guardando…
      </p>
    );
  }
  if (pendingSave) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
        Cambios sin guardar
      </p>
    );
  }
  if (savedAt) {
    return (
      <p className="flex items-center gap-2 text-[11px] text-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Guardado a las {savedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </p>
    );
  }
  if (isDirty) {
    return <p className="text-[11px] text-muted">Cambios sin guardar</p>;
  }
  return <p className="text-[11px] text-muted">Todo al día</p>;
}

// ────────────────────────────────────────────────────────────────────
// Field renderer
// ────────────────────────────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (field.kind === 'text') {
    return (
      <Wrapper label={field.label} description={field.description}>
        <input
          type="text"
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </Wrapper>
    );
  }
  if (field.kind === 'textarea') {
    return (
      <Wrapper label={field.label} description={field.description}>
        <textarea
          value={(value as string) ?? ''}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </Wrapper>
    );
  }
  if (field.kind === 'number') {
    return (
      <Wrapper label={field.label} description={field.description}>
        <input
          type="number"
          value={(value as number | string) ?? ''}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </Wrapper>
    );
  }
  if (field.kind === 'select') {
    return (
      <Wrapper label={field.label} description={field.description}>
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Wrapper>
    );
  }
  if (field.kind === 'tags') {
    return <TagsField field={field} value={(value as string[]) ?? []} onChange={onChange} />;
  }
  if (field.kind === 'cta') {
    return <CtaField field={field} value={(value as Record<string, string>) ?? {}} onChange={onChange} />;
  }
  if (field.kind === 'image') {
    return (
      <Wrapper label={field.label} description={field.description}>
        <MediaPicker
          value={(value as string) ?? ''}
          onChange={(v) => onChange(v)}
          placeholder={field.placeholder}
        />
      </Wrapper>
    );
  }
  if (field.kind === 'list') {
    return <ListField field={field} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} />;
  }
  if (field.kind === 'group') {
    return <GroupField field={field} value={(value as Record<string, unknown>) ?? {}} onChange={onChange} />;
  }
  return null;
}

function GroupField({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { kind: 'group' }>;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  return (
    <Wrapper label={field.label} description={field.description}>
      <div className="rounded-lg border border-hairline bg-surface-soft p-3 space-y-3">
        {field.fields.map((f) => (
          <FieldRenderer
            key={f.key}
            field={f}
            value={value[f.key]}
            onChange={(v) => onChange({ ...value, [f.key]: v })}
          />
        ))}
      </div>
    </Wrapper>
  );
}

function Wrapper({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-body">
          {label}
        </span>
      </div>
      {children}
      {description && <p className="mt-1 text-[11px] text-muted">{description}</p>}
    </label>
  );
}

function TagsField({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { kind: 'tags' }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...value, v]);
    setDraft('');
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <Wrapper label={field.label} description={field.description}>
      <div className="rounded-lg border border-hairline bg-white p-2 focus-within:border-brand">
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-1 text-xs text-body"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-muted hover:text-red-600"
                aria-label={`Quitar ${tag}`}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                add();
              } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
                removeAt(value.length - 1);
              }
            }}
            onBlur={add}
            placeholder={field.placeholder ?? 'Añadir y pulsar Enter'}
            className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
      </div>
    </Wrapper>
  );
}

function CtaField({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { kind: 'cta' }>;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  return (
    <Wrapper label={field.label} description={field.description}>
      <div className="rounded-lg border border-hairline bg-surface-soft p-3 space-y-2">
        <input
          type="text"
          value={value.label ?? ''}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="Texto del botón"
          className="w-full rounded-md border border-hairline bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-brand"
        />
        <input
          type="text"
          value={value.href ?? ''}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="Enlace (/raza, https://…)"
          className="w-full rounded-md border border-hairline bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-brand"
        />
        <select
          value={value.variant ?? 'primary'}
          onChange={(e) => onChange({ ...value, variant: e.target.value })}
          className="w-full rounded-md border border-hairline bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-brand"
        >
          <option value="primary">Primary (sólido blanco)</option>
          <option value="outline">Outline (borde)</option>
          <option value="ghost">Ghost (sin borde)</option>
        </select>
      </div>
    </Wrapper>
  );
}

function ListField({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { kind: 'list' }>;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(value.length === 1 ? 0 : null);

  function addItem() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empty: Record<string, any> = {};
    for (const f of field.itemFields) {
      empty[f.key] = f.kind === 'list' || f.kind === 'tags' ? [] : f.kind === 'number' ? 0 : '';
    }
    onChange([...value, empty]);
    setOpenIdx(value.length);
  }
  function removeItem(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
    if (openIdx === i) setOpenIdx(null);
  }
  function moveItem(i: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? i - 1 : i + 1;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    const a = next[i];
    const b = next[target];
    if (!a || !b) return;
    next[i] = b;
    next[target] = a;
    onChange(next);
    if (openIdx === i) setOpenIdx(target);
    else if (openIdx === target) setOpenIdx(i);
  }
  function updateItem(i: number, key: string, val: unknown) {
    const next = value.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }

  return (
    <Wrapper label={field.label} description={field.description}>
      <ul className="space-y-2">
        {value.map((item, i) => {
          const isOpen = openIdx === i;
          const headLabel =
            (field.itemLabelKey && (item[field.itemLabelKey] as string)) ||
            `Item ${i + 1}`;
          return (
            <li key={i} className="rounded-lg border border-hairline bg-white">
              <div className="flex items-center gap-1 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                    {i + 1}
                  </span>
                  <span className="ml-2 text-sm text-ink truncate">
                    {headLabel || <span className="italic text-muted">Sin título</span>}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, 'up')}
                  disabled={i === 0}
                  className="rounded p-1 text-xs text-muted hover:bg-surface-card disabled:opacity-30"
                  aria-label="Subir"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, 'down')}
                  disabled={i === value.length - 1}
                  className="rounded p-1 text-xs text-muted hover:bg-surface-card disabled:opacity-30"
                  aria-label="Bajar"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
                  aria-label="Eliminar"
                >
                  ✕
                </button>
              </div>
              {isOpen && (
                <div className="space-y-3 border-t border-surface-card bg-surface-soft px-3 py-3">
                  {field.itemFields.map((f) => (
                    <FieldRenderer
                      key={f.key}
                      field={f}
                      value={item[f.key]}
                      onChange={(v) => updateItem(i, f.key, v)}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={addItem}
        className="mt-3 w-full rounded-lg border border-dashed border-hairline px-3 py-2 text-xs font-medium text-body hover:border-ink/30 hover:text-brand"
      >
        + {field.addLabel ?? 'Añadir'}
      </button>
    </Wrapper>
  );
}
