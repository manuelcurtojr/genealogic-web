'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { generatePedigreePdf } from '@/lib/pedigree-pdf'

interface Props {
  dogId: string
  dogName: string
  userId: string
}

interface TreeNode {
  name: string
  breed: string
  sex: string
  born_date: string
  father: TreeNode | null
  mother: TreeNode | null
}

export default function PedigreePdfTab({ dogId, dogName, userId }: Props) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  async function handleExport() {
    setGenerating(true)
    setDone(false)
    try {
      const supabase = createClient()

      // Fetch dog data
      const { data: dog, error: dogErr } = await supabase
        .from('dogs')
        .select('*, breed:breeds(name), color:colors(name), kennel:kennels(name)')
        .eq('id', dogId)
        .single()

      if (!dog || dogErr) throw new Error('Dog not found')

      // Fetch parents separately
      const [fatherRes, motherRes] = await Promise.all([
        dog.father_id ? supabase.from('dogs').select('name').eq('id', dog.father_id).single() : null,
        dog.mother_id ? supabase.from('dogs').select('name').eq('id', dog.mother_id).single() : null,
      ])
      const fatherName = fatherRes?.data?.name || 'Desconocido'
      const motherName = motherRes?.data?.name || 'Desconocido'

      // Fetch owner name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', userId)
        .single()

      // Fetch pedigree tree (4 generations)
      const { data: pedigreeData } = await supabase.rpc('get_pedigree', {
        dog_uuid: dogId,
        max_gen: 4,
      })

      // Build tree structure from flat pedigree data
      const tree = buildTree(pedigreeData || [], dogId)

      const b = Array.isArray(dog.breed) ? dog.breed[0] : dog.breed
      const c = Array.isArray(dog.color) ? dog.color[0] : dog.color
      const k = Array.isArray(dog.kennel) ? dog.kennel[0] : dog.kennel

      const dogData = {
        name: dog.name || '',
        breed: b?.name || 'Sin raza',
        color: c?.name || '',
        sex: dog.sex || 'male',
        birth_date: dog.birth_date ? formatDate(dog.birth_date) : '',
        microchip: dog.microchip || '',
        registration: dog.registration || '',
        father: fatherName,
        mother: motherName,
        kennel: k?.name || '',
        owner: profile?.display_name || profile?.email || 'Propietario',
      }

      generatePedigreePdf(dogData, tree)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (err: any) {
      console.error('PDF generation error:', err)
      alert('Error al generar el PDF: ' + (err?.message || 'Inténtalo de nuevo'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5 text-center">
      <div className="text-[#D74709] mx-auto w-16 h-16 rounded-2xl bg-[#D74709]/10 flex items-center justify-center">
        <FileText className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Exportar Pedigree en PDF</h3>
        <p className="text-sm text-white/50 mt-2">
          Genera un documento PDF con la genealogia digital de{' '}
          <strong className="text-white">{dogName || 'este perro'}</strong>, incluyendo los datos
          del perro, propietario y arbol genealogico de 4 generaciones.
        </p>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-2 text-left">
        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-orange-400">
          Este PDF es una version digital de la genealogia registrada en Genealogic. No es un
          pedigri oficial emitido por un club canofilo (FCI, AKC, KC, RSCE, etc.).
        </p>
      </div>
      <button
        onClick={handleExport}
        disabled={generating}
        className="inline-flex items-center gap-2 bg-[#D74709]/10 border border-[#D74709]/30 text-[#D74709] font-semibold px-6 py-3 rounded-lg hover:bg-[#D74709]/20 transition disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Generando...
          </>
        ) : done ? (
          <>
            <CheckCircle className="w-5 h-5" /> Descargado
          </>
        ) : (
          <>
            <Download className="w-5 h-5" /> Descargar Pedigree PDF
          </>
        )}
      </button>
    </div>
  )
}

function buildTree(
  flatData: { id: string; name: string; sex: string; father_id: string | null; mother_id: string | null; generation: number; breed_name: string | null; color_name: string | null; photo_url: string | null }[],
  rootId: string
): TreeNode | null {
  if (!flatData.length) return null

  const nodeMap = new Map<string, typeof flatData[0]>()
  flatData.forEach(n => nodeMap.set(n.id, n))

  function build(id: string | null, gen: number): TreeNode | null {
    if (!id || gen > 4) return null
    const n = nodeMap.get(id)
    if (!n) return null
    return {
      name: n.name,
      breed: n.breed_name || '',
      sex: n.sex || 'male',
      born_date: '',
      father: build(n.father_id, gen + 1),
      mother: build(n.mother_id, gen + 1),
    }
  }

  return build(rootId, 0)
}

function formatDate(d: string): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return d
  }
}
