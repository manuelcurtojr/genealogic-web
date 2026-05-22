/**
 * Secciones de "Sobre la raza" — bloques estáticos editables por el criador.
 */

export async function BreedHeroSection(props: {
  breed_name?: string
  tagline?: string
  background_image_url?: string
}) {
  return (
    <section className="relative min-h-[40vh] flex items-center bg-ink overflow-hidden">
      {props.background_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.background_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      )}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-20 w-full">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 mb-3">Sobre la raza</p>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4">
          {props.breed_name || 'Nuestra raza'}
        </h1>
        {props.tagline && <p className="text-lg text-white/85 max-w-2xl">{props.tagline}</p>}
      </div>
    </section>
  )
}

export async function BreedSummarySection(props: { title?: string; body?: string }) {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {props.title && <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4 tracking-tight">{props.title}</h2>}
        {props.body && (
          <div className="prose-content text-body leading-relaxed whitespace-pre-wrap">{props.body}</div>
        )}
      </div>
    </section>
  )
}

export async function BreedTemperamentSection(props: {
  title?: string
  traits?: { label: string; description?: string }[]
}) {
  return (
    <section className="py-12 lg:py-16 bg-surface-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8 text-center tracking-tight">
          {props.title || 'Temperamento'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(props.traits || []).map((t, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas p-5">
              <p className="text-sm font-bold text-ink mb-1">{t.label}</p>
              {t.description && <p className="text-sm text-body leading-relaxed">{t.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function BreedColorsSection(props: {
  title?: string
  colors?: { name: string; hex?: string; description?: string; image_url?: string }[]
}) {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8 text-center tracking-tight">
          {props.title || 'Colores aceptados'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(props.colors || []).map((c, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas overflow-hidden">
              {c.image_url ? (
                <div className="aspect-square bg-surface-card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image_url} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
              ) : c.hex ? (
                <div className="aspect-square" style={{ background: c.hex }} />
              ) : null}
              <div className="p-3">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                {c.description && <p className="text-[11px] text-muted mt-0.5">{c.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function BreedTraitsSection(props: {
  title?: string
  stats?: { label: string; value: string }[]
}) {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8 text-center tracking-tight">
          {props.title || 'Características'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(props.stats || []).map((s, i) => (
            <div key={i} className="text-center rounded-xl border border-hairline bg-canvas p-5">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
