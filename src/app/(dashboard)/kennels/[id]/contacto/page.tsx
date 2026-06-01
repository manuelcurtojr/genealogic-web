import { loadProPage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell } from '@/components/kennel/pro-page-shell'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'
import { MapPin, Calendar, Globe, ExternalLink, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isUUID } from '@/lib/slug'
import type { Metadata } from 'next'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug, city, country')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  const loc = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const title = `Contacto · ${kennel.name}`
  const description = `Contacta con ${kennel.name}${loc ? ` en ${loc}` : ''} para resolver dudas, planificar una visita o informarte sobre próximas camadas.`
  const canonical = `https://genealogic.io/kennels/${kennel.slug}/contacto`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'es_ES' },
  }
}

export default async function KennelContactoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = getTranslator(await getLocale())
  const { kennel } = await loadProPage({ kennelId: id, pageId: null })

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null
  const hasOwner = !!kennel.owner_id

  return (
    <ProPageShell
      eyebrow={t('Hablemos')}
      title={`${t('Contacta con')} ${kennel.name}`}
      description={t('Estamos aquí para responder dudas, planificar visitas y mantenerte al día sobre próximas camadas. Sin compromiso.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8">
        {/* Form CTA */}
        <div className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Formulario')}</p>
          <h2 className="mt-1 text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-ink">
            {t('Escríbenos por aquí')}
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-prose">
            {t('Te respondemos en menos de 24 horas. El formulario es la mejor vía para que no se nos escape ningún mensaje.')}
          </p>
          <div className="mt-5">
            {hasOwner ? (
              <ContactKennelButton kennelId={kennel.id} kennelName={kennel.name} config={kennel.contact_form_config || null} />
            ) : (
              <p className="text-[13px] text-muted italic">
                {t('Este criadero aún no tiene un dueño registrado en Genealogic.')}
              </p>
            )}
          </div>
        </div>

        {/* Datos del kennel */}
        <aside className="rounded-2xl border border-hairline bg-surface-soft p-6 sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('El criadero')}</p>
          <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.01em] text-ink">{kennel.name}</h3>
          <dl className="mt-4 space-y-3 text-[13.5px]">
            {location && (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <span className="text-body">{location}</span>
              </div>
            )}
            {foundationYear && (
              <div className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <span className="text-body">{t('Fundado en')} {foundationYear}</span>
              </div>
            )}
            {kennel.whatsapp_enabled && kennel.whatsapp_phone && (
              <div className="flex items-start gap-2">
                <MessageCircle className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <a
                  href={`https://wa.me/${kennel.whatsapp_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body hover:text-ink transition"
                >
                  WhatsApp
                </a>
              </div>
            )}
            {kennel.website && (
              <div className="flex items-start gap-2">
                <Globe className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <a href={kennel.website} target="_blank" rel="noopener noreferrer" className="text-body hover:text-ink transition truncate">
                  {t('Web propia')}
                </a>
              </div>
            )}
            {kennel.social_instagram && (
              <div className="flex items-start gap-2">
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <a href={kennel.social_instagram} target="_blank" rel="noopener noreferrer" className="text-body hover:text-ink transition">
                  Instagram
                </a>
              </div>
            )}
            {kennel.social_facebook && (
              <div className="flex items-start gap-2">
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted flex-shrink-0" />
                <a href={kennel.social_facebook} target="_blank" rel="noopener noreferrer" className="text-body hover:text-ink transition">
                  Facebook
                </a>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </ProPageShell>
  )
}
