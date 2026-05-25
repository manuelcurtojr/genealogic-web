import Link from 'next/link'

/**
 * Mini árbol genealógico para los posts del blog de perros legendarios.
 * Muestra padre + abuelos paternos en una columna, madre + abuelos maternos en otra.
 * Cada perro se enlaza a su ficha (/dogs/[slug]) si tenemos slug.
 *
 * Uso:
 *   <PedigreePreview
 *     dog={{ name: 'Old Hemp', slug: 'old-hemp' }}
 *     father={{ name: 'Roy', slug: 'roy-padre-old-hemp' }}
 *     mother={{ name: 'Meg', slug: 'meg-madre-old-hemp' }}
 *     fatherFather={{ name: 'Tommy' }}
 *     fatherMother={{ name: 'Nell' }}
 *     motherFather={undefined}
 *     motherMother={undefined}
 *   />
 */

type Node = {
  name: string
  slug?: string
  birthYear?: string | number
} | undefined

function NodeCard({ node, dim = false }: { node: Node; dim?: boolean }) {
  if (!node) {
    return (
      <div className="flex h-[42px] items-center justify-center rounded-[8px] border border-dashed border-hairline bg-surface-card/30 px-2">
        <span className="text-[11px] uppercase tracking-wider text-muted/60">Desconocido</span>
      </div>
    )
  }
  const inner = (
    <div className={`flex h-[42px] items-center justify-between rounded-[8px] border border-hairline bg-surface-card px-3 transition ${node.slug ? 'hover:border-ink/30 hover:bg-surface-card/80' : ''}`}>
      <span className={`truncate text-[13px] font-medium ${dim ? 'text-muted' : 'text-ink'}`}>
        {node.name}
      </span>
      {node.birthYear && (
        <span className="ml-2 shrink-0 text-[11px] tabular-nums text-muted">
          {node.birthYear}
        </span>
      )}
    </div>
  )
  if (node.slug) {
    return (
      <Link href={`/dogs/${node.slug}`} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}

export type PedigreePreviewProps = {
  dog: { name: string; slug: string; sex?: 'male' | 'female'; birthYear?: string | number }
  father?: Node
  mother?: Node
  fatherFather?: Node
  fatherMother?: Node
  motherFather?: Node
  motherMother?: Node
}

export function PedigreePreview({
  dog,
  father,
  mother,
  fatherFather,
  fatherMother,
  motherFather,
  motherMother,
}: PedigreePreviewProps) {
  return (
    <section className="my-10 rounded-[14px] border border-hairline bg-surface-card/40 p-6 sm:p-8">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="text-[16px] font-semibold uppercase tracking-[0.08em] text-ink">
          Genealogía
        </h3>
        <span className="text-[12px] uppercase tracking-[0.1em] text-muted">
          3 generaciones
        </span>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 sm:gap-4">
        {/* Gen 0: el perro */}
        <div className="col-span-1 flex items-center">
          <div className="w-full">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">El perro</div>
            <NodeCard node={{ name: dog.name, slug: dog.slug, birthYear: dog.birthYear }} />
          </div>
        </div>

        {/* Gen 1: padres */}
        <div className="col-span-1 flex flex-col justify-around gap-3">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Padre ♂</div>
            <NodeCard node={father} />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Madre ♀</div>
            <NodeCard node={mother} />
          </div>
        </div>

        {/* Gen 2: abuelos */}
        <div className="col-span-1 flex flex-col justify-around gap-3">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Abuelo paterno</div>
            <NodeCard node={fatherFather} dim />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Abuela paterna</div>
            <NodeCard node={fatherMother} dim />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Abuelo materno</div>
            <NodeCard node={motherFather} dim />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Abuela materna</div>
            <NodeCard node={motherMother} dim />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-hairline pt-5">
        <Link
          href={`/dogs/${dog.slug}`}
          className="inline-flex items-center gap-2 text-[15px] font-medium text-[color:var(--brand)] underline decoration-[color:var(--brand)]/40 underline-offset-4 transition hover:decoration-[color:var(--brand)]"
        >
          Ver la genealogía completa de {dog.name}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}
