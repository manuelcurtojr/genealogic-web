/**
 * Gestión de papeles de un perro (lado criador / dueño).
 *
 * Acceso permitido si:
 *  - El user es owner del kennel del perro (criador)
 *  - O es el breeder_id
 *  - O es el owner_id actual del perro (caso cliente gestionando sus propios docs)
 *
 * Si solo es owner_id (cliente sin ser criador), modo lectura.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { listDogDocuments } from '@/lib/dogs/documents'
import DogDocumentsGrid from '@/components/dogs/dog-documents-grid'
import UploadDogDocumentForm from './upload-form'
import { deleteDogDocumentAction } from './actions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { Img } from '@/components/ui/img'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Papeles del perro · Genealogic' }

export default async function DogPapelesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = getTranslator(await getLocale())
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: dog } = await admin
    .from('dogs')
    .select('id, slug, name, thumbnail_url, kennel_id, breeder_id, owner_id, kennel:kennels(id, name, owner_id)')
    .eq('id', id)
    .maybeSingle()
  if (!dog) notFound()

  const isKennelOwner = dog.kennel?.owner_id === user.id
  const isBreeder = dog.breeder_id === user.id
  const isDogOwner = dog.owner_id === user.id
  const canManage = isKennelOwner || isBreeder || isDogOwner
  if (!canManage) {
    redirect('/dogs')
  }

  const documents = await listDogDocuments(dog.id)

  return (
    <div>
      <Link
        href={`/dogs/${dog.slug || dog.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {dog.name}
      </Link>

      <div className="flex items-center gap-4 mb-6">
        {dog.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <Img
            w={200}
            src={dog.thumbnail_url}
            alt={dog.name}
            className="w-14 h-14 rounded-xl object-cover border border-hairline"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-surface-card border border-hairline flex items-center justify-center text-lg font-bold text-ink">
            {dog.name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{t('Papeles')}</h1>
          <p className="text-sm text-muted mt-0.5">
            {t('Contratos, cartillas, registros y documentos de')} <strong>{dog.name}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              {t('Documentos')} ({documents.length})
            </h2>
          </div>
          <DogDocumentsGrid
            documents={documents}
            showVisibilityBadge
            onDeleteAction={deleteDogDocumentAction}
          />
        </section>

        <aside>
          <UploadDogDocumentForm dogId={dog.id} />
          <div className="mt-4 rounded-2xl border border-hairline bg-canvas p-4 text-xs text-muted">
            <p className="font-semibold text-ink mb-1">{t('¿Cuándo se ve el documento?')}</p>
            <p>
              {t('Marca')} <strong>{t('Visible para el propietario')}</strong> {t('para que aparezca en su panel')}{' '}
              <code>/mis-perros/{dog.id.slice(0, 6)}…</code>. {t('Desmárcalo si es una copia interna.')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
