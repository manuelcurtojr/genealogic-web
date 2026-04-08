'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallback?: string
  className?: string
}

export default function BackButton({ fallback = '/dogs', className }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push(fallback)
        }
      }}
      className={className || 'w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition'}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  )
}
