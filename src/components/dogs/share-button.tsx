'use client'

import { useState } from 'react'
import { Share2, Copy, Check, X, Download } from 'lucide-react'

interface Props {
  dog: { name: string; sex: string; breed_name?: string; kennel_name?: string; thumbnail_url?: string | null; birth_date?: string | null }
  dogUrl: string
}

export default function ShareButton({ dog, dogUrl }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${dogUrl}` : dogUrl

  function copyLink() {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({
        title: `${dog.name} | Genealogic`,
        text: `Mira el perfil de ${dog.name}${dog.breed_name ? ` (${dog.breed_name})` : ''} en Genealogic`,
        url: fullUrl,
      })
    } else {
      setShowModal(true)
    }
  }

  async function downloadCard() {
    setGenerating(true)
    // Create a canvas-based social card
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 1080, 1080)

    // Orange accent bar
    ctx.fillStyle = '#D74709'
    ctx.fillRect(0, 0, 1080, 6)

    // Load and draw dog photo
    if (dog.thumbnail_url) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject()
          img.src = dog.thumbnail_url!
        })
        // Draw photo centered, covering top portion
        const ratio = Math.max(1080 / img.width, 700 / img.height)
        const w = img.width * ratio, h = img.height * ratio
        ctx.drawImage(img, (1080 - w) / 2, 6, w, h)
        // Gradient overlay
        const grad = ctx.createLinearGradient(0, 400, 0, 750)
        grad.addColorStop(0, 'rgba(10,10,10,0)')
        grad.addColorStop(1, 'rgba(10,10,10,1)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 400, 1080, 350)
      } catch { /* no photo */ }
    }

    // Bottom section
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 700, 1080, 380)

    // Sex indicator line
    ctx.fillStyle = dog.sex === 'male' ? '#017DFA' : '#e84393'
    ctx.fillRect(0, 700, 1080, 4)

    // Dog name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 52px Arial, Helvetica, sans-serif'
    ctx.fillText(dog.name, 60, 780)

    // Sex icon
    const sexIcon = dog.sex === 'male' ? '♂' : '♀'
    const nameWidth = ctx.measureText(dog.name).width
    ctx.fillStyle = dog.sex === 'male' ? '#017DFA' : '#e84393'
    ctx.font = '44px Arial'
    ctx.fillText(sexIcon, 60 + nameWidth + 15, 780)

    // Breed badge
    if (dog.breed_name) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      const breedWidth = ctx.measureText(dog.breed_name).width
      ctx.font = '24px Arial'
      const bw = ctx.measureText(dog.breed_name).width
      ctx.beginPath()
      ctx.roundRect(60, 800, bw + 30, 36, 18)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText(dog.breed_name, 75, 825)
    }

    // Birth date
    if (dog.birth_date) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '22px Arial'
      ctx.fillText(new Date(dog.birth_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 60, 870)
    }

    // Kennel
    if (dog.kennel_name) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '22px Arial'
      ctx.fillText(dog.kennel_name, 60, 905)
    }

    // Branding
    ctx.fillStyle = '#D74709'
    ctx.font = 'bold 20px Arial'
    ctx.fillText('GENEALOGIC', 60, 1040)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '16px Arial'
    ctx.fillText(fullUrl, 60, 1065)

    // Bottom orange bar
    ctx.fillStyle = '#D74709'
    ctx.fillRect(0, 1074, 1080, 6)

    // Download
    canvas.toBlob(blob => {
      if (!blob) { setGenerating(false); return }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dog.name.replace(/[^a-zA-Z0-9]/g, '-')}-genealogic.png`
      a.click()
      URL.revokeObjectURL(url)
      setGenerating(false)
    }, 'image/png')
  }

  return (
    <>
      <button onClick={shareNative}
        className="w-10 h-10 rounded-full backdrop-blur-sm bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
        title="Compartir">
        <Share2 className="w-5 h-5" />
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Compartir {dog.name}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Copy link */}
              <div className="flex gap-2">
                <input type="text" readOnly value={fullUrl}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 focus:outline-none" />
                <button onClick={copyLink} className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#D74709]/10 text-[#D74709] hover:bg-[#D74709]/20 transition flex items-center gap-1">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              {/* Download social card */}
              <button onClick={downloadCard} disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 transition disabled:opacity-50">
                <Download className="w-4 h-4" />
                {generating ? 'Generando...' : 'Descargar tarjeta para redes sociales'}
              </button>

              {/* Social share buttons */}
              <div className="flex gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`Mira ${dog.name} en Genealogic: ${fullUrl}`)}`}
                  target="_blank" rel="noopener" className="flex-1 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold text-center hover:bg-green-500/20 transition">WhatsApp</a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Mira ${dog.name} en Genealogic`)}&url=${encodeURIComponent(fullUrl)}`}
                  target="_blank" rel="noopener" className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-semibold text-center hover:bg-blue-500/20 transition">Twitter</a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
                  target="_blank" rel="noopener" className="flex-1 py-2 rounded-lg bg-blue-600/10 text-blue-300 text-xs font-semibold text-center hover:bg-blue-600/20 transition">Facebook</a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
