'use client'

import { X, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { isNativeApp } from '@/lib/is-native'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  currentPlan?: string
}

export default function UpgradeModal({ open, onClose, title, message, currentPlan }: UpgradeModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/30 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-[#D74709]/15 mx-auto flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-[#D74709]" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/50 mb-6">{message}</p>

          <button
            onClick={() => { onClose(); if (!isNativeApp()) router.push('/pricing') }}
            className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition"
          >
            {isNativeApp() ? 'Mejora en genealogic.io' : 'Ver planes'}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 text-sm text-white/40 hover:text-white transition py-2"
          >
            Ahora no
          </button>
        </div>
      </div>
    </>
  )
}
