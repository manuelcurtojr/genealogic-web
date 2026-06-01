/**
 * Botón "Sembrar 16 perfiles default" — usado en profiles page.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export default function TestSuiteSeedButton({ kennelId }: { kennelId: string }) {
  const t = useT()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function seed() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/emailbot/test-suite/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'seed_failed')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={seed}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {t('Sembrar 16 perfiles default')}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
