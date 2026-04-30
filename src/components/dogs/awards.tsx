'use client'

import { useState, useEffect } from 'react'
import { Trophy, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Lightbox from '@/components/ui/lightbox'

interface AwardRecord {
  id: string
  award_type: string
  event_name: string
  date: string
  judge: string | null
  notes: string | null
  file_url: string | null
  is_public: boolean
}

interface AwardsProps {
  dogId: string
  ownerId: string
  isOwner: boolean
}

const AWARD_TYPES = [
  { key: 'CAC', label: 'CAC', color: 'bg-blue-500/15 text-blue-400' },
  { key: 'CACIB', label: 'CACIB', color: 'bg-indigo-500/15 text-indigo-400' },
  { key: 'BOB', label: 'BOB', color: 'bg-amber-500/15 text-amber-400' },
  { key: 'BOS', label: 'BOS', color: 'bg-pink-500/15 text-pink-400' },
  { key: 'BOG', label: 'BOG', color: 'bg-purple-500/15 text-purple-400' },
  { key: 'BIS', label: 'BIS', color: 'bg-yellow-500/15 text-yellow-400' },
  { key: 'other', label: 'Otro', color: 'bg-chip text-fg-dim' },
] as const

function getAwardType(key: string) {
  return AWARD_TYPES.find(t => t.key === key) || AWARD_TYPES[6]
}

function parseFiles(fileUrl: string | null): string[] {
  if (!fileUrl) return []
  try { return JSON.parse(fileUrl) } catch { return fileUrl ? [fileUrl] : [] }
}

function isImage(url: string) { return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) }

export default function Awards({ dogId, ownerId, isOwner }: AwardsProps) {
  const [awards, setAwards] = useState<AwardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxFiles, setLightboxFiles] = useState<string[] | null>(null)
  const [lightboxStart, setLightboxStart] = useState(0)

  const supabase = createClient()

  async function fetchAwards() {
    setLoading(true)
    const { data } = await supabase
      .from('awards')
      .select('*')
      .eq('dog_id', dogId)
      .eq('is_public', true)
      .order('date', { ascending: false })
    setAwards(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAwards() }, [dogId])

  if (loading) return <div className="text-fg-mute text-sm py-8 text-center">Cargando palmares...</div>

  if (awards.length === 0) {
    return (
      <div className="text-center py-12 text-fg-mute">
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay premios publicos registrados</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {awards.map(award => {
          const type = getAwardType(award.award_type)
          const files = parseFiles(award.file_url)
          return (
            <div key={award.id} className="bg-chip border border-hair rounded-lg p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${type.color}`}>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{award.event_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${type.color}`}>{type.label}</span>
                </div>
                <p className="text-xs text-fg-mute mt-0.5">
                  {new Date(award.date).toLocaleDateString('es-ES')}
                  {award.judge && <> &middot; Juez: {award.judge}</>}
                </p>
                {award.notes && <p className="text-xs text-fg-dim mt-0.5 truncate">{award.notes}</p>}
              </div>
              {files.length > 0 && (
                <div className="flex gap-1.5 flex-shrink-0">
                  {files.map((url, i) => (
                    <button key={i} onClick={() => { setLightboxFiles(files); setLightboxStart(i) }}
                      className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition">
                      {isImage(url) ? (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-chip flex items-center justify-center"><FileText className="w-4 h-4 text-[#D74709]" /></div>
                      )}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )
        })}
      </div>

      {lightboxFiles && (
        <Lightbox files={lightboxFiles} startIndex={lightboxStart} onClose={() => setLightboxFiles(null)} />
      )}
    </div>
  )
}
