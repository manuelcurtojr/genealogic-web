'use client'

import { Crown, ArrowRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isNativeApp } from '@/lib/is-native'

interface UpgradeBannerProps {
  message: string
  plan?: 'amateur' | 'pro'
  dismissKey?: string // localStorage key to remember dismissal
  variant?: 'subtle' | 'highlight' | 'urgent'
  className?: string
}

export default function UpgradeBanner({ message, plan = 'amateur', dismissKey, variant = 'subtle', className = '' }: UpgradeBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey) return false
    if (typeof window === 'undefined') return false
    const ts = localStorage.getItem(`dismiss_${dismissKey}`)
    if (!ts) return false
    // Re-show after 7 days
    return Date.now() - parseInt(ts) < 7 * 24 * 60 * 60 * 1000
  })

  if (dismissed) return null

  const styles = {
    subtle: 'bg-white/5 border-white/10 text-white/60',
    highlight: 'bg-[#D74709]/10 border-[#D74709]/30 text-white',
    urgent: 'bg-gradient-to-r from-[#D74709]/20 to-purple-500/20 border-[#D74709]/30 text-white',
  }

  function handleDismiss() {
    if (dismissKey) localStorage.setItem(`dismiss_${dismissKey}`, String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className={`border rounded-xl p-3 sm:p-4 flex items-center gap-3 ${styles[variant]} ${className}`}>
      <div className="w-9 h-9 rounded-full bg-[#D74709]/15 flex items-center justify-center flex-shrink-0">
        <Crown className="w-4 h-4 text-[#D74709]" />
      </div>
      <p className="text-sm flex-1 min-w-0">{message}</p>
      {isNativeApp() ? (
        <span className="text-xs text-white/30 flex-shrink-0">genealogic.io</span>
      ) : (
        <button
          onClick={() => router.push('/pricing')}
          className="bg-[#D74709] hover:bg-[#c03d07] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition flex-shrink-0 whitespace-nowrap"
        >
          {plan === 'pro' ? 'Ver Pro' : 'Mejorar'} <ArrowRight className="w-3 h-3" />
        </button>
      )}
      {dismissKey && (
        <button onClick={handleDismiss} className="p-1 text-white/20 hover:text-white/50 transition flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
