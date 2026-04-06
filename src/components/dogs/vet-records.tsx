'use client'

import { useState, useEffect } from 'react'
import { Syringe, Bug, Pill, FlaskConical, Scissors, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Lightbox from '@/components/ui/lightbox'

interface VetRecord {
  id: string
  type: string
  title: string
  date: string
  notes: string | null
  file_url: string | null
  is_public: boolean
}

interface VetRecordsProps {
  dogId: string
  ownerId: string
  isOwner: boolean
}

const RECORD_TYPES = [
  { key: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#3498db', bg: 'bg-blue-500/15 text-blue-400' },
  { key: 'deworming', label: 'Desparasitacion', icon: Bug, color: '#27ae60', bg: 'bg-green-500/15 text-green-400' },
  { key: 'treatment', label: 'Tratamiento', icon: Pill, color: '#f39c12', bg: 'bg-orange-500/15 text-orange-400' },
  { key: 'test', label: 'Test', icon: FlaskConical, color: '#9b59b6', bg: 'bg-purple-500/15 text-purple-400' },
  { key: 'surgery', label: 'Cirugia', icon: Scissors, color: '#e74c3c', bg: 'bg-red-500/15 text-red-400' },
] as const

function getRecordType(key: string) {
  return RECORD_TYPES.find(t => t.key === key) || RECORD_TYPES[0]
}

function parseFiles(fileUrl: string | null): string[] {
  if (!fileUrl) return []
  try { return JSON.parse(fileUrl) } catch { return fileUrl ? [fileUrl] : [] }
}

function isImage(url: string) { return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) }

export default function VetRecords({ dogId, ownerId, isOwner }: VetRecordsProps) {
  const [records, setRecords] = useState<VetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxFiles, setLightboxFiles] = useState<string[] | null>(null)
  const [lightboxStart, setLightboxStart] = useState(0)

  const supabase = createClient()

  async function fetchRecords() {
    setLoading(true)
    const { data } = await supabase
      .from('vet_records')
      .select('*')
      .eq('dog_id', dogId)
      .eq('is_public', true)
      .order('date', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [dogId])

  if (loading) return <div className="text-white/30 text-sm py-8 text-center">Cargando registros veterinarios...</div>

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <Syringe className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay registros veterinarios publicos</p>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {records.map(record => {
          const type = getRecordType(record.type)
          const Icon = type.icon
          const files = parseFiles(record.file_url)
          return (
            <div key={record.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${type.bg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{record.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg}`}>{type.label}</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  {new Date(record.date).toLocaleDateString('es-ES')}
                </p>
                {record.notes && <p className="text-xs text-white/50 mt-1">{record.notes}</p>}
                {files.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {files.map((url, i) => (
                      <button key={i} onClick={() => { setLightboxFiles(files); setLightboxStart(i) }}
                        className="w-10 h-10 rounded overflow-hidden cursor-pointer hover:opacity-80 transition">
                        {isImage(url) ? (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center"><FileText className="w-4 h-4 text-[#D74709]" /></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
