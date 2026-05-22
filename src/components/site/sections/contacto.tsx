/**
 * Secciones "Contacto" — server wrappers + client form interno.
 */
import ContactFormInner from './contact-form-inner'

export function ContactFormSection({
  title, subtitle, eyebrow, headline, topics, success_message,
}: {
  title?: string
  subtitle?: string
  eyebrow?: string
  headline?: string
  topics?: string[]
  success_message?: string
}) {
  const t = title || headline || 'Cuéntanos'
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">{t}</h2>
        {subtitle && <p className="text-body mb-6 leading-relaxed">{subtitle}</p>}
        <ContactFormInner topics={topics} success_message={success_message} />
      </div>
    </section>
  )
}

export function ContactInfoSection({
  title, items = [], eyebrow,
}: {
  title?: string
  eyebrow?: string
  items?: { label: string; value: string }[]
}) {
  return (
    <section className="py-12 lg:py-16 bg-surface-card border-y border-hairline">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2 text-center">{eyebrow}</p>
        )}
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8 text-center tracking-tight">{title}</h2>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-1">{it.label}</dt>
              <dd className="text-sm text-ink font-medium">{it.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function MapEmbedSection({
  title, embed_url, address,
}: {
  title?: string
  embed_url?: string
  address?: string
}) {
  if (!embed_url) return null
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-6 tracking-tight">{title}</h2>
        )}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-hairline">
          <iframe
            src={embed_url}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={address || 'Mapa'}
          />
        </div>
        {address && (
          <p className="text-sm text-muted mt-3 text-center">{address}</p>
        )}
      </div>
    </section>
  )
}
