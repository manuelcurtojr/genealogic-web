'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Image as ImageIcon, Building2, BookOpen, HelpCircle, MessageSquare, Dog } from 'lucide-react'

const ITEMS = [
  { href: '/kennel/contenido/sobre',              label: 'Sobre nosotros', icon: User },
  { href: '/kennel/contenido/perros-destacados',  label: 'Destacados',      icon: Dog },
  { href: '/kennel/contenido/galeria',            label: 'Galería',         icon: ImageIcon },
  { href: '/kennel/contenido/instalaciones',      label: 'Instalaciones',   icon: Building2 },
  { href: '/kennel/contenido/blog',               label: 'Blog',            icon: BookOpen },
  { href: '/kennel/contenido/faq',                label: 'FAQ',             icon: HelpCircle },
  { href: '/kennel/contenido/resenas',            label: 'Reseñas',         icon: MessageSquare },
]

export default function ContenidoSubNav() {
  const pathname = usePathname() || ''
  return (
    <nav className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-hairline -mb-px">
      {ITEMS.map(item => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              isActive
                ? 'text-ink border-ink'
                : 'text-body border-transparent hover:text-ink hover:border-ink/30'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
