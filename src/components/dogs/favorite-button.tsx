'use client'

import { useState } from 'react'
import { Heart, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  dogId: string
  initialFavorited: boolean
}

export default function FavoriteButton({ dogId, initialFavorited }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setShowAuthPopup(true)
      return
    }

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
    <>
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

      {/* Auth popup for unauthenticated users */}
      {showAuthPopup && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthPopup(false)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <button onClick={() => setShowAuthPopup(false)} className="absolute top-3 right-3 text-white/30 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">Te ha gustado este perro?</h3>
              <p className="text-sm text-white/50 mb-6">Inicia sesion o registrate para guardar perros en tus favoritos y verlos mas adelante.</p>
              <div className="flex gap-3">
                <Link href="/login" className="flex-1 py-2.5 rounded-lg border border-white/20 text-sm font-medium text-white/80 hover:bg-white/5 transition text-center">
                  Iniciar sesion
                </Link>
                <Link href="/register" className="flex-1 py-2.5 rounded-lg bg-[#D74709] hover:bg-[#c03d07] text-sm font-semibold text-white transition text-center">
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
