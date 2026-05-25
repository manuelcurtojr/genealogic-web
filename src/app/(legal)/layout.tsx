import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <article className="prose prose-sm max-w-none prose-headings:text-ink prose-headings:tracking-[-0.03em] prose-p:text-body prose-p:leading-[1.7] prose-li:text-body prose-strong:text-ink prose-a:text-ink prose-a:underline prose-a:underline-offset-4 prose-h1:text-[40px] prose-h1:font-semibold prose-h1:leading-[1.1] prose-h1:tracking-[-0.04em] prose-h2:mt-12 prose-h2:text-[24px] prose-h2:font-semibold prose-h2:tracking-[-0.03em] prose-h3:mt-8 prose-h3:text-[18px] prose-h3:font-semibold prose-hr:border-hairline">
            {children}
          </article>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}
