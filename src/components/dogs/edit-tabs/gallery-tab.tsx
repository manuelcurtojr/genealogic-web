'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, GripVertical, Star } from 'lucide-react'

interface GalleryTabProps { dogId: string; userId: string }

export default function GalleryTab({ dogId, userId }: GalleryTabProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function loadPhotos() {
    const { data } = await supabase.from('dog_photos').select('*').eq('dog_id', dogId).order('position')
    setPhotos(data || [])
  }
  useEffect(() => { loadPhotos() }, [dogId])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `${userId}/${dogId}/${Date.now()}-${i}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('dog-photos').upload(path, file)
      if (uploadErr) { console.error(uploadErr); continue }
      const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(path)
      const newPos = photos.length + i
      await supabase.from('dog_photos').insert({ dog_id: dogId, url: publicUrl, storage_path: path, position: newPos })

      // First photo overall becomes thumbnail
      if (newPos === 0) {
        await supabase.from('dogs').update({ thumbnail_url: publicUrl }).eq('id', dogId)
      }
    }
    setUploading(false)
    loadPhotos()
  }

  async function deletePhoto(photo: any) {
    if (photo.storage_path) await supabase.storage.from('dog-photos').remove([photo.storage_path])
    await supabase.from('dog_photos').delete().eq('id', photo.id)

    // Reload and fix positions + thumbnail
    const { data: remaining } = await supabase.from('dog_photos').select('*').eq('dog_id', dogId).order('position')
    const list = remaining || []
    for (let i = 0; i < list.length; i++) {
      if (list[i].position !== i) await supabase.from('dog_photos').update({ position: i }).eq('id', list[i].id)
    }
    // Update thumbnail to first photo or null
    await supabase.from('dogs').update({ thumbnail_url: list[0]?.url || null }).eq('id', dogId)
    setPhotos(list)
  }

  async function movePhoto(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    const reordered = [...photos]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setPhotos(reordered)

    // Update positions in DB
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('dog_photos').update({ position: i }).eq('id', reordered[i].id)
    }
    // First photo = thumbnail
    await supabase.from('dogs').update({ thumbnail_url: reordered[0]?.url || null }).eq('id', dogId)
  }

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault() }
  function handleDrop(idx: number) { if (dragIdx !== null) movePhoto(dragIdx, idx); setDragIdx(null) }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />

      <p className="text-[11px] text-white/30">Arrastra para reordenar. La primera foto sera la de perfil.</p>

      <div className="flex gap-2 flex-wrap">
        {/* Upload button */}
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-[88px] h-[88px] border-2 border-dashed border-white/15 rounded-lg flex flex-col items-center justify-center hover:border-[#D74709]/40 transition cursor-pointer flex-shrink-0">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white/30" /> : <Plus className="w-5 h-5 text-white/30" />}
        </button>

        {/* Photos — draggable */}
        {photos.map((photo, idx) => (
          <div key={photo.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            className={`relative w-[88px] h-[88px] rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing flex-shrink-0 ${dragIdx === idx ? 'opacity-40 ring-2 ring-[#D74709]' : ''} ${idx === 0 ? 'ring-2 ring-[#D74709]/50' : ''}`}>
            <img src={photo.url} alt="" className="w-full h-full object-cover" />

            {/* Profile badge on first photo */}
            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-[#D74709] rounded px-1 py-0.5 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-white" />
                <span className="text-[8px] text-white font-bold">PERFIL</span>
              </div>
            )}

            {/* Drag handle + delete */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                <GripVertical className="w-4 h-4 text-white/70" />
              </div>
            </div>
            <button onClick={() => deletePhoto(photo)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {photos.length === 0 && !uploading && (
        <p className="text-xs text-white/30 text-center py-2">Haz clic en + para subir fotos</p>
      )}
    </div>
  )
}
