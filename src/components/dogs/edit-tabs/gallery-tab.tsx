'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageIcon, Plus, X, Loader2 } from 'lucide-react'

interface GalleryTabProps { dogId: string; userId: string }

export default function GalleryTab({ dogId, userId }: GalleryTabProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
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

      await supabase.from('dog_photos').insert({
        dog_id: dogId, url: publicUrl, storage_path: path,
        position: photos.length + i,
      })
    }
    setUploading(false)
    loadPhotos()
  }

  async function deletePhoto(photo: any) {
    if (photo.storage_path) {
      await supabase.storage.from('dog-photos').remove([photo.storage_path])
    }
    await supabase.from('dog_photos').delete().eq('id', photo.id)
    loadPhotos()
  }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />

      <div className="flex gap-2 flex-wrap">
        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 border-2 border-dashed border-white/15 rounded-lg flex flex-col items-center justify-center hover:border-[#D74709]/40 transition cursor-pointer"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white/30" /> : <Plus className="w-5 h-5 text-white/30" />}
        </button>

        {/* Existing photos */}
        {photos.map(photo => (
          <div key={photo.id} className="relative w-20 h-20 rounded-lg overflow-hidden group">
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => deletePhoto(photo)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
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
