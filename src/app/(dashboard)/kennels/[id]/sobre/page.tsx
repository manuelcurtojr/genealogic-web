import { loadProPage, pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'

export const dynamic = 'force-dynamic'

export default async function KennelSobrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { kennel, isOwner, hasContent } = await loadProPage({
    kennelId: id,
    pageId: 'sobre',
    contentChecker: async () => ({ aboutMd: kennel?.about_md }),
  })

  return (
    <ProPageShell eyebrow="Quiénes somos" title={`Sobre ${kennel.name}`}>
      {isOwner && !hasContent && (
        <OwnerDraftBanner
          message={pageNotYetPublicMessage('sobre')}
          ctaHref="/kennel/edit"
          ctaLabel="Editar criadero"
        />
      )}

      {kennel.about_md ? (
        <article className="prose prose-sm sm:prose max-w-none text-body whitespace-pre-line leading-[1.65] text-[15px] sm:text-[16px]">
          {kennel.about_md}
        </article>
      ) : isOwner ? (
        <EmptyContentState
          title="Cuenta tu historia"
          description='Escribe la historia del criadero, vuestra filosofía de cría, cómo empezasteis y qué os distingue. Se gestiona desde "Editar criadero".'
        />
      ) : (
        <EmptyContentState
          title="Próximamente"
          description={`Más información sobre ${kennel.name} estará disponible muy pronto.`}
        />
      )}
    </ProPageShell>
  )
}
