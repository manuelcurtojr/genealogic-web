'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  userId: string
  currentUrl: string | null
  displayName: string
  onUploaded: (url: string) => void
}

export default function AvatarUpload({ userId, currentUrl, displayName, onUploaded }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Crop state
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const CROP_SIZE = 256 // output size
  const VIEW_SIZE = 280 // modal preview size

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImgSrc(ev.target?.result as string)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setModalOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  useEffect(() => {
    if (!imgSrc) return
    const img = new Image()
    img.onload = () => { imgRef.current = img }
    img.src = imgSrc
  }, [imgSrc])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const handleMouseUp = useCallback(() => { setDragging(false) }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    setDragging(true)
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y })
  }, [offset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return
    const t = e.touches[0]
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y })
  }, [dragging, dragStart])

  async function handleSave() {
    if (!imgRef.current || !canvasRef.current) return
    setUploading(true)

    const canvas = canvasRef.current
    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE
    const ctx = canvas.getContext('2d')!

    const img = imgRef.current
    const scale = zoom * (VIEW_SIZE / Math.min(img.width, img.height))
    const drawW = img.width * scale * (CROP_SIZE / VIEW_SIZE)
    const drawH = img.height * scale * (CROP_SIZE / VIEW_SIZE)
    const drawX = (CROP_SIZE - drawW) / 2 + offset.x * (CROP_SIZE / VIEW_SIZE)
    const drawY = (CROP_SIZE - drawH) / 2 + offset.y * (CROP_SIZE / VIEW_SIZE)

    // Draw circular clip
    ctx.beginPath()
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, drawX, drawY, drawW, drawH)

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return }

      const supabase = createClient()
      const path = `${userId}/avatar.webp`

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/webp', upsert: true })

      if (upErr) {
        console.error('Upload error:', upErr)
        setUploading(false)
        return
      }

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub.publicUrl + '?t=' + Date.now()

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)

      onUploaded(publicUrl)
      setUploading(false)
      setModalOpen(false)
      setImgSrc(null)
    }, 'image/webp', 0.85)
  }

  return (
    <>
      {/* Avatar display */}
      <button
        onClick={() => fileRef.current?.click()}
        className="relative w-16 h-16 rounded-full overflow-hidden bg-[#D74709]/20 flex items-center justify-center group"
      >
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#D74709] text-xl font-bold">
            {(displayName || '?')[0].toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Crop modal */}
      {modalOpen && imgSrc && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => { setModalOpen(false); setImgSrc(null) }} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Recortar avatar</h3>
              <button onClick={() => { setModalOpen(false); setImgSrc(null) }} className="text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-4">
              {/* Preview area */}
              <div
                className="relative overflow-hidden rounded-full cursor-move select-none"
                style={{ width: VIEW_SIZE, height: VIEW_SIZE, background: '#111' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={imgSrc}
                  alt=""
                  draggable={false}
                  className="absolute pointer-events-none"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    minWidth: '100%',
                    minHeight: '100%',
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center',
                  }}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 w-full px-4">
                <ZoomOut className="w-4 h-4 text-white/30" />
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#D74709]"
                />
                <ZoomIn className="w-4 h-4 text-white/30" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { setModalOpen(false); setImgSrc(null) }}
                  className="flex-1 py-2.5 rounded-lg text-sm text-white/50 bg-white/5 hover:bg-white/10 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#D74709] hover:bg-[#c03d07] text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</> : 'Guardar avatar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
