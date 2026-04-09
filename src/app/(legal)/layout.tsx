import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Volver a Genealogic
        </Link>
        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-white/60 prose-li:text-white/60 prose-strong:text-white/80 prose-a:text-[#D74709] prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base">
          {children}
        </article>
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-wrap gap-4 text-xs text-white/30">
          <Link href="/privacy" className="hover:text-white/60 transition">Privacidad</Link>
          <Link href="/cookies" className="hover:text-white/60 transition">Cookies</Link>
          <Link href="/terms" className="hover:text-white/60 transition">Términos</Link>
          <Link href="/legal" className="hover:text-white/60 transition">Aviso Legal</Link>
        </div>
      </div>
    </div>
  )
}
