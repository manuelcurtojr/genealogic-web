'use client'

import { useState } from 'react'
import { FileInput, Search, Upload, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleScan = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    // TODO: Call Supabase Edge Function for AI extraction
    setTimeout(() => {
      setLoading(false)
      setError('Importador en desarrollo — proximamente disponible.')
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <FileInput className="w-12 h-12 text-[#D74709] mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Importar Pedigri</h1>
        <p className="text-white/50 text-sm mt-2">Pega la URL de cualquier plataforma de pedigri y la IA extraera el arbol genealogico.</p>
      </div>

      {/* URL input */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">URL del pedigri</label>
          <div className="flex gap-3">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://presadb.com/dogocanario/..."
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
            <button onClick={handleScan} disabled={loading || !url.trim()}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Escanear
            </button>
          </div>
          <p className="text-white/30 text-xs mt-2">Funciona con presadb.com, ingrus.net, pedigreedatabase.com y mas.</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 text-white/20">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs uppercase tracking-wider">o</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Image upload */}
        <div className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center hover:border-[#D74709]/50 transition cursor-pointer">
          <Upload className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Arrastra una captura de pantalla o foto del pedigri</p>
          <p className="text-white/25 text-xs mt-1">JPG, PNG, WebP hasta 10MB</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
