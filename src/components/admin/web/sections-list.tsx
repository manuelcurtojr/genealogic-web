'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { reorderSections } from '@/app/(dashboard)/web/actions';
import { SectionIcon } from './section-icon';

type SectionLite = {
  id: string;
  type: string;
  label: string;
  summary: string;
};

export function SectionsList({
  pageSlug,
  sections: initialSections,
  selectedId,
}: {
  pageSlug: string;
  sections: SectionLite[];
  selectedId: string | null;
}) {
  const [sections, setSections] = useState(initialSections);
  const [isPending, startTransition] = useTransition();

  // Sincroniza si llegan secciones nuevas desde el servidor (post-add/remove)
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(sections, oldIdx, newIdx);
    setSections(next);
    startTransition(async () => {
      await reorderSections(pageSlug, next.map((s) => s.id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('genealogic:web-saved'));
      }
    });
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-brand-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Secciones
          </p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            {sections.length} {sections.length === 1 ? 'sección' : 'secciones'}
            {isPending && ' · guardando…'}
          </p>
        </div>
      </div>
      {sections.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-ink-500">
            Aún no hay secciones.<br />Añade desde el catálogo.
          </p>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="overflow-y-auto">
            {sections.map((s) => (
              <SortableItem
                key={s.id}
                section={s}
                pageSlug={pageSlug}
                isSelected={selectedId === s.id}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableItem({
  section,
  pageSlug: _pageSlug,
  isSelected,
}: {
  section: SectionLite;
  pageSlug: string;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group border-b border-brand-50 transition ${
        isSelected ? 'bg-brand-50/60' : 'hover:bg-brand-50/30'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Mover sección"
          className="mt-0.5 inline-flex h-6 w-3 cursor-grab items-center justify-center text-ink-300 hover:text-ink-600 active:cursor-grabbing"
        >
          <svg viewBox="0 0 6 16" className="h-4 w-3 fill-current">
            <circle cx="1.5" cy="2" r="1" />
            <circle cx="4.5" cy="2" r="1" />
            <circle cx="1.5" cy="8" r="1" />
            <circle cx="4.5" cy="8" r="1" />
            <circle cx="1.5" cy="14" r="1" />
            <circle cx="4.5" cy="14" r="1" />
          </svg>
        </button>
        <Link
          href={`?section=${section.id}`}
          scroll={false}
          className="flex-1 min-w-0 flex gap-2"
        >
          <span
            className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${
              isSelected ? 'bg-brand text-white' : 'bg-ink-100 text-ink-600 group-hover:bg-ink-200'
            }`}
          >
            <SectionIcon type={section.type} className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-950 truncate">{section.label}</p>
            <p className="mt-0.5 text-[10px] text-ink-500 truncate">{section.summary}</p>
          </div>
        </Link>
      </div>
    </li>
  );
}
