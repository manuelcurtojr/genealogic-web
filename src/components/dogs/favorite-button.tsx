'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  dogId: string
  initialFavorited: boolean
}

export default function FavoriteButton({ dogId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (favorited) {
      await supabase.from('favorites').delete().eq('dog_id', dogId).eq('user_id', user.id)
      setFavorited(false)
    } else {
      await supabase.from('favorites').insert({ dog_id: dogId, user_id: user.id })
      setFavorited(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center transition ${
        favorited
          ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
      }`}
      title={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
    </button>
  )
}
