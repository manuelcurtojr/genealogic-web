'use client'

/**
 * Botón de CTA del hero que soporta 2 modos:
 *
 * 1. Modal contacto (href === '#contact' | '#contacto' | '#form'):
 *    abre el ContactDialog UNIFICADO que usa el `contact_form_config` que
 *    el criador construyó en /kennel → "Formulario de contacto".
 *    Renderiza los campos custom (cría enfocada, genérico o custom).
 * 2. Link normal: cualquier otro href → <Link href> de Next.js.
 *
 * Hereda el tema activo (CSS vars) — sin hardcodes.
 */
import { useState } from 'react'
import Link from 'next/link'
import { ContactDialog } from './contact-dialog'
import type { ContactFormConfig } from '@/lib/kennel/contact-form'

type Variant = 'primary' | 'outline' | 'ghost'

export function HeroCtaButton({
  href, label, variant = 'primary', kennelId, kennelName, contactFormConfig, reproBreedNames,
}: {
  href: string
  label: string
  variant?: Variant
  kennelId?: string
  kennelName?: string
  contactFormConfig?: ContactFormConfig | null
  reproBreedNames?: string[]
}) {
  const [open, setOpen] = useState(false)
  const isContactModal = /^#(contact|contacto|form)/i.test(href.trim())

  const cls =
    variant === 'outline'
      ? 'inline-flex items-center justify-center border border-white/35 backdrop-blur-sm bg-white/5 text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/15 hover:border-white/60 transition-all'
      : variant === 'ghost'
        ? 'inline-flex items-center justify-center text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/10 transition-all'
        : 'btn-brand inline-flex items-center justify-center px-7 py-3.5 text-[14px] font-semibold shadow-2xl shadow-black/30 uppercase tracking-[0.08em]'

  const style = variant !== 'primary' ? { borderRadius: 'var(--button-radius, 12px)' } : undefined

  if (isContactModal && kennelId && kennelName) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={cls} style={style}>
          {label}
        </button>
        <ContactDialog
          open={open}
          onClose={() => setOpen(false)}
          kennelId={kennelId}
          kennelName={kennelName}
          config={contactFormConfig ?? null}
          reproBreedNames={reproBreedNames}
          themed
        />
      </>
    )
  }

  return (
    <Link href={href || '.'} className={cls} style={style}>
      {label}
    </Link>
  )
}
