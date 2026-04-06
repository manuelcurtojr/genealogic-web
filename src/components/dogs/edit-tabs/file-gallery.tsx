'use client'

import { useState, useRef } from 'react'
import { Plus, X, Loader2, FileText, Image, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileGalleryProps {
  files: string[]  // array of URLs
  onChange: (files: string[]) => void
  folder: string   // storage path prefix e.g. "vet/dogId"
}

export default function FileGallery({ files, onChange, folder }: FileGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function isImage(url: string) {
    return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    const newFiles = [...files]

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const ext = file.name.split('.').pop()
      const path = `${folder}/${Date.now()}-${i}.${ext}`

      const { error } = await supabase.storage.from('documents').upload(path, file)
      if (error) { console.error(error); continue }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      newFiles.push(publicUrl)
    }

    setUploading(false)
    onChange(newFiles)
  }

  function removeFile(idx: number) {
    const updated = files.filter((_, i) => i !== idx)
    onChange(updated)
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-16 h-16 border-2 border-dashed border-white/15 rounded-lg flex items-center justify-center hover:border-[#D74709]/40 transition cursor-pointer flex-shrink-0">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white/30" /> : <Plus className="w-4 h-4 text-white/30" />}
        </button>

        {files.map((url, idx) => (
          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group flex-shrink-0 bg-white/5 border border-white/10">
            {isImage(url) ? (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </a>
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition">
                <FileText className="w-5 h-5 text-[#D74709]" />
                <span className="text-[8px] text-white/40 uppercase">{url.split('.').pop()?.split('?')[0]}</span>
              </a>
            )}
            <button onClick={() => removeFile(idx)}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
