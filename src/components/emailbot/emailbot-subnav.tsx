'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, MessageSquare, Beaker, BookOpen, FlaskConical } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

/**
 * Subnav compartido entre /emailbot, /emailbot/hilos, /emailbot/test
 * y /conocimiento (la Biblioteca de conocimiento alimenta al bot).
 *
 * Los 4 forman parte del mismo workflow conceptual: el bot responde
 * usando la Biblioteca, gestiona hilos, y se prueba en el playground.
 * Tener 4 entradas separadas en el sidebar/CommandBar es ruido —
 * este subnav las une visualmente.
 *
 * Todo /emailbot/* y /conocimiento están gateados a Enterprise en el
 * servidor, así que aquí ya solo llegan usuarios Enterprise: mostramos
 * todas las tabs (incluida la Suite de tests).
 */
export default function EmailbotSubnav() {
  const t = useT()
  const pathname = usePathname()

  const tabs = [
    {
      href: '/emailbot',
      label: t('Configuración'),
      hint: t('Activación, tono, reglas y stats del bot'),
      icon: Mail,
      active: pathname === '/emailbot',
    },
    {
      href: '/emailbot/hilos',
      label: t('Hilos'),
      hint: t('Conversaciones reales del bot con contactos'),
      icon: MessageSquare,
      active: pathname.startsWith('/emailbot/hilos'),
    },
    {
      href: '/emailbot/test',
      label: t('Probar'),
      hint: t('Playground 1-shot para testear una respuesta del bot'),
      icon: Beaker,
      active: pathname === '/emailbot/test' || pathname.startsWith('/emailbot/test/'),
    },
    {
      href: '/emailbot/test-suite',
      label: t('Suite tests'),
      hint: t('Bate 16 perfiles ficticios contra tu bot y evalúa calidad (con coste)'),
      icon: FlaskConical,
      active: pathname.startsWith('/emailbot/test-suite'),
    },
    {
      href: '/conocimiento',
      label: t('Biblioteca'),
      hint: t('Entradas de conocimiento que alimentan al bot'),
      icon: BookOpen,
      active: pathname.startsWith('/conocimiento'),
    },
  ]

  return (
    <nav className="-mx-1 flex overflow-x-auto pb-1">
      <div className="flex gap-1 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.hint}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab.active
                  ? 'border-ink bg-ink text-on-primary'
                  : 'border-hairline bg-canvas text-body hover:bg-surface-soft'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
