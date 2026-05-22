'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createKennelAdminClient } from '@/lib/supabase/server';
import { getMyKennel } from '@/lib/kennel-site';
import {
  catalogForPage,
  getCatalogEntry,
  newSectionId,
} from '@/lib/kennel/section-catalog';
import type { Section } from '@/lib/kennel/pages';

async function assertOwner() {
  // getMyKennel ya valida Supabase auth + ownership.
  const kennel = await getMyKennel();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any;
  return { kennel, admin };
}

/**
 * Lee el draft (si existe) o el publicado, garantizando que devuelve un array.
 */
async function getDraft(slug: string): Promise<Section[]> {
  const { kennel, admin } = await assertOwner();
  const { data } = await admin
    .from('kennel_pages')
    .select('sections, draft_sections')
    .eq('kennel_id', kennel.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) throw new Error('page_not_found');
  return (data.draft_sections ?? data.sections ?? []) as Section[];
}

const HISTORY_LIMIT = 30;

/**
 * Guarda el draft empujando el estado anterior al stack de undo y vaciando
 * el stack de redo (cualquier cambio nuevo invalida los redos).
 *
 * Si `skipHistory` se pone a true, se omite la lógica de history (lo
 * usamos en undo/redo para no contaminar el historial mientras navegamos
 * por él).
 */
async function saveDraft(slug: string, sections: Section[], skipHistory = false) {
  const { kennel, admin } = await assertOwner();

  if (skipHistory) {
    await admin
      .from('kennel_pages')
      .update({ draft_sections: sections })
      .eq('kennel_id', kennel.id)
      .eq('slug', slug);
  } else {
    // Lee el estado actual para empujarlo al stack de undo
    const { data: current } = await admin
      .from('kennel_pages')
      .select('draft_sections, sections, undo_history')
      .eq('kennel_id', kennel.id)
      .eq('slug', slug)
      .maybeSingle();
    const previous = current?.draft_sections ?? current?.sections ?? [];
    const undoStack: unknown[] = Array.isArray(current?.undo_history) ? current.undo_history : [];
    // Solo apilamos si realmente cambia algo (evita ruido de saves idempotentes)
    const isSame = JSON.stringify(previous) === JSON.stringify(sections);
    const newUndo = isSame ? undoStack : [...undoStack, previous].slice(-HISTORY_LIMIT);
    await admin
      .from('kennel_pages')
      .update({
        draft_sections: sections,
        undo_history: newUndo,
        redo_history: [],
      })
      .eq('kennel_id', kennel.id)
      .eq('slug', slug);
  }

  revalidatePath(`/web/${slug}`);
  revalidatePath(`/web-preview/${slug}`);
}

/**
 * Deshace el último cambio. Pone el estado actual en redo_history y
 * restaura el último snapshot de undo_history como draft_sections.
 */
export async function undoChange(slug: string) {
  const { kennel, admin } = await assertOwner();
  const { data } = await admin
    .from('kennel_pages')
    .select('draft_sections, sections, undo_history, redo_history')
    .eq('kennel_id', kennel.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return;
  const undoStack: unknown[] = Array.isArray(data.undo_history) ? data.undo_history : [];
  if (undoStack.length === 0) return;
  const popped = undoStack[undoStack.length - 1];
  const newUndo = undoStack.slice(0, -1);
  const current = data.draft_sections ?? data.sections ?? [];
  const redoStack: unknown[] = Array.isArray(data.redo_history) ? data.redo_history : [];
  const newRedo = [...redoStack, current].slice(-HISTORY_LIMIT);
  await admin
    .from('kennel_pages')
    .update({
      draft_sections: popped,
      undo_history: newUndo,
      redo_history: newRedo,
    })
    .eq('kennel_id', kennel.id)
    .eq('slug', slug);
  revalidatePath(`/web/${slug}`);
  revalidatePath(`/web-preview/${slug}`);
}

/** Rehace el último cambio deshecho. */
export async function redoChange(slug: string) {
  const { kennel, admin } = await assertOwner();
  const { data } = await admin
    .from('kennel_pages')
    .select('draft_sections, sections, undo_history, redo_history')
    .eq('kennel_id', kennel.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return;
  const redoStack: unknown[] = Array.isArray(data.redo_history) ? data.redo_history : [];
  if (redoStack.length === 0) return;
  const popped = redoStack[redoStack.length - 1];
  const newRedo = redoStack.slice(0, -1);
  const current = data.draft_sections ?? data.sections ?? [];
  const undoStack: unknown[] = Array.isArray(data.undo_history) ? data.undo_history : [];
  const newUndo = [...undoStack, current].slice(-HISTORY_LIMIT);
  await admin
    .from('kennel_pages')
    .update({
      draft_sections: popped,
      undo_history: newUndo,
      redo_history: newRedo,
    })
    .eq('kennel_id', kennel.id)
    .eq('slug', slug);
  revalidatePath(`/web/${slug}`);
  revalidatePath(`/web-preview/${slug}`);
}

/**
 * Deep-set para edición inline: actualiza una propiedad en una ruta tipo
 * "tagline" o "pillars[0].title" dentro de la sección dada.
 */
export async function updateSectionPropPath(
  slug: string,
  sectionId: string,
  path: string,
  value: unknown,
) {
  const draft = await getDraft(slug);
  const sec = draft.find((s) => s.id === sectionId);
  if (!sec) throw new Error('section_not_found');
  if (!sec.props) sec.props = {};
  setByPath(sec.props as Record<string, unknown>, path, value);
  await saveDraft(slug, draft);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  // Soporta segmentos tipo "a.b[2].c"
  const tokens: (string | number)[] = [];
  for (const seg of path.split('.')) {
    const m = seg.match(/^([^[]+)((?:\[\d+\])*)$/);
    if (!m) {
      tokens.push(seg);
      continue;
    }
    tokens.push(m[1]!);
    const arrPart = m[2] ?? '';
    const idxs = [...arrPart.matchAll(/\[(\d+)\]/g)].map((x) => Number(x[1]));
    for (const idx of idxs) tokens.push(idx);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i]!;
    const next = tokens[i + 1]!;
    if (cur[t] == null) {
      cur[t] = typeof next === 'number' ? [] : {};
    }
    cur = cur[t];
  }
  cur[tokens[tokens.length - 1]!] = value;
}

// ─────────────────────────────────────────────────────────────────────
// Acciones sobre la lista de páginas
// ─────────────────────────────────────────────────────────────────────

export async function togglePageEnabled(slug: string, enabled: boolean) {
  const { kennel, admin } = await assertOwner();
  await admin
    .from('kennel_pages')
    .update({ enabled })
    .eq('kennel_id', kennel.id)
    .eq('slug', slug);
  revalidatePath('/web');
}

export async function updateNavLabel(slug: string, navLabel: string | null) {
  const { kennel, admin } = await assertOwner();
  await admin
    .from('kennel_pages')
    .update({ nav_label: navLabel || null })
    .eq('kennel_id', kennel.id)
    .eq('slug', slug);
  revalidatePath('/web');
}

export async function reorderPages(slugsInOrder: string[]) {
  const { kennel, admin } = await assertOwner();
  await Promise.all(
    slugsInOrder.map((slug, i) =>
      admin
        .from('kennel_pages')
        .update({ nav_order: i })
        .eq('kennel_id', kennel.id)
        .eq('slug', slug),
    ),
  );
  revalidatePath('/web');
}

// ─────────────────────────────────────────────────────────────────────
// Acciones sobre las secciones de una página (operan sobre draft_sections)
// ─────────────────────────────────────────────────────────────────────

export async function addSection(slug: string, type: string) {
  const entry = getCatalogEntry(type);
  if (!entry) throw new Error('unknown_type');
  if (!entry.pages.includes('*') && !entry.pages.includes(slug)) {
    throw new Error('section_not_allowed_in_page');
  }
  const draft = await getDraft(slug);
  draft.push({
    id: newSectionId(type),
    type,
    props: structuredClone(entry.defaultProps),
  });
  await saveDraft(slug, draft);
}

export async function removeSection(slug: string, sectionId: string) {
  const draft = await getDraft(slug);
  await saveDraft(
    slug,
    draft.filter((s) => s.id !== sectionId),
  );
}

export async function duplicateSection(slug: string, sectionId: string) {
  const draft = await getDraft(slug);
  const idx = draft.findIndex((s) => s.id === sectionId);
  if (idx < 0) return;
  const src = draft[idx];
  if (!src) return;
  const copy: Section = {
    ...structuredClone(src),
    id: newSectionId(src.type),
  };
  draft.splice(idx + 1, 0, copy);
  await saveDraft(slug, draft);
}

/**
 * Reordena las secciones de la página según el orden de IDs proporcionado.
 * Las IDs ausentes se descartan; las desconocidas se ignoran.
 */
export async function reorderSections(slug: string, idsInOrder: string[]) {
  const draft = await getDraft(slug);
  const byId = new Map(draft.map((s) => [s.id, s]));
  const next: Section[] = [];
  for (const id of idsInOrder) {
    const s = byId.get(id);
    if (s) {
      next.push(s);
      byId.delete(id);
    }
  }
  // Cualquier sección no incluida la dejamos al final (defensivo)
  for (const s of byId.values()) next.push(s);
  await saveDraft(slug, next);
}

export async function moveSection(slug: string, sectionId: string, direction: 'up' | 'down') {
  const draft = await getDraft(slug);
  const idx = draft.findIndex((s) => s.id === sectionId);
  if (idx < 0) return;
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= draft.length) return;
  const a = draft[idx];
  const b = draft[target];
  if (!a || !b) return;
  draft[idx] = b;
  draft[target] = a;
  await saveDraft(slug, draft);
}

export async function updateSectionProps(
  slug: string,
  sectionId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>,
) {
  const draft = await getDraft(slug);
  const sec = draft.find((s) => s.id === sectionId);
  if (!sec) throw new Error('section_not_found');
  sec.props = props;
  await saveDraft(slug, draft);
}

// ─────────────────────────────────────────────────────────────────────
// Publicar / descartar borrador
// ─────────────────────────────────────────────────────────────────────

export async function publishPage(slug: string) {
  const { kennel, admin } = await assertOwner();
  const { data } = await admin
    .from('kennel_pages')
    .select('draft_sections')
    .eq('kennel_id', kennel.id)
    .eq('slug', slug)
    .maybeSingle();
  if (!data) throw new Error('page_not_found');
  if (!data.draft_sections) {
    // No hay nada que publicar
    return;
  }
  await admin
    .from('kennel_pages')
    .update({
      sections: data.draft_sections,
      draft_sections: null,
    })
    .eq('kennel_id', kennel.id)
    .eq('slug', slug);
  revalidatePath(`/web/${slug}`);
  revalidatePath(`/web-preview/${slug}`);
  revalidatePath('/web');
  // Revalidar también la web pública correspondiente
  if (slug === 'home') revalidatePath('/');
  else if (slug === 'razas') revalidatePath('/raza');
  else revalidatePath(`/${slug}`);
}

export async function discardDraft(slug: string) {
  const { kennel, admin } = await assertOwner();
  await admin
    .from('kennel_pages')
    .update({ draft_sections: null })
    .eq('kennel_id', kennel.id)
    .eq('slug', slug);
  revalidatePath(`/web/${slug}`);
}

/**
 * Asegura que existen las 8 filas troncales para el kennel. Si falta alguna,
 * la inserta deshabilitada (para que el usuario decida si activarla).
 */
export async function ensureAllPages() {
  const { kennel, admin } = await assertOwner();
  const SLUGS = ['home', 'perros', 'razas', 'historia', 'servicios', 'instalaciones', 'blog', 'contacto'];
  const { data: existing } = await admin
    .from('kennel_pages')
    .select('slug')
    .eq('kennel_id', kennel.id);
  const existingSlugs = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  const missing = SLUGS.filter((s) => !existingSlugs.has(s));
  if (missing.length === 0) return;
  await admin.from('kennel_pages').insert(
    missing.map((slug, i) => ({
      kennel_id: kennel.id,
      slug,
      enabled: false,
      nav_order: 100 + i,
      sections: [],
    })),
  );
  revalidatePath('/web');
}

// Helper: catálogo expuesto al cliente
export async function getCatalogForPage(slug: string) {
  return catalogForPage(slug);
}
