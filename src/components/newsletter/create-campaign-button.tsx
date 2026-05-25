'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

export default function NewsletterCreateButton({ kennelId }: { kennelId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function create() {
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId }),
      })
      const json = await res.json()
      if (!res.ok || !json.id) throw new Error(json.error || 'create_failed')
      router.push(`/newsletter/${json.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error creando campaña')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      Nueva campaña
    </button>
  )
}
