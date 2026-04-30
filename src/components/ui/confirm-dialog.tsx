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
      <p className="text-sm text-fg-dim mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-chip hover:bg-white/15 text-white transition"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 ${
            destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#D74709] hover:bg-[#c03d07]'
          }`}
        >
          {loading ? 'Procesando...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
