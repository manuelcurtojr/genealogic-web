'use client'

/**
 * Botón flotante de "Solicitudes" en la esquina inferior izquierda de la
 * web custom. Tematizado: usa .btn-brand + accent stripe + font display.
 * Abre el ContactDialog unificado con el form configurado por el criador.
 */
import { useState } from 'react'
import { Send } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { ContactDialog } from './contact-dialog'
import type { ContactFormConfig } from '@/lib/kennel/contact-form'

export function FloatingContactButton({
  kennelId, kennelName, config, reproBreedNames,
}: {
  kennelId: string
  kennelName: string
  config: ContactFormConfig | null
  reproBreedNames?: string[]
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-brand fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] shadow-2xl"
        title={t('Enviar solicitud')}
        aria-label={t('Abrir formulario de solicitud')}
      >
        <Send className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('Solicitudes')}</span>
      </button>
      <ContactDialog
        open={open}
        onClose={() => setOpen(false)}
        kennelId={kennelId}
        kennelName={kennelName}
        config={config}
        reproBreedNames={reproBreedNames}
        themed
      />
    </>
  )
}

/**
 * Variante para el footer (mobile): no es fixed, va dentro del flow del
 * footer como un botón normal full-width.
 */
export function FloatingContactButtonFooter({
  kennelId, kennelName, config, reproBreedNames,
}: {
  kennelId: string
  kennelName: string
  config: ContactFormConfig | null
  reproBreedNames?: string[]
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-brand inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] w-full sm:w-auto"
      >
        <Send className="h-3.5 w-3.5" />
        {t('Enviar solicitud')}
      </button>
      <ContactDialog
        open={open}
        onClose={() => setOpen(false)}
        kennelId={kennelId}
        kennelName={kennelName}
        config={config}
        reproBreedNames={reproBreedNames}
        themed
      />
    </>
  )
}
