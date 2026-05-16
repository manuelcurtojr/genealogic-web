'use client'

import Modal from './modal'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  loading?: boolean
}

export default function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmLabel = 'Confirmar', destructive = false, loading = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
      <p className="mb-6 text-[14px] text-body">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-[13px] font-medium text-on-primary transition-colors disabled:opacity-50 ${
            destructive ? 'bg-[color:var(--error)] hover:opacity-90' : 'bg-ink hover:opacity-90'
          }`}
        >
          {loading ? 'Procesando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
