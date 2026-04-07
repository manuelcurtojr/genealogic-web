'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Trash2, Pencil, Check, X, Dog, Palette } from 'lucide-react'

interface Props { breeds: any[]; colors: any[] }

export default function AdminCatalogClient({ breeds: initBreeds, colors: initColors }: Props) {
  const [tab, setTab] = useState<'breeds' | 'colors'>('breeds')
  const [breeds, setBreeds] = useState(initBreeds)
  const [colors, setColors] = useState(initColors)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newColorBreed, setNewColorBreed] = useState('')

  const refresh = async () => {
    const supabase = createClient()
    const [b, c] = await Promise.all([
      supabase.from('breeds').select('id, name').order('name'),
      supabase.from('colors').select('id, name, breed_id').order('name'),
    ])
    setBreeds((b.data || []).map(br => ({ ...br, dog_count: breeds.find(ob => ob.id === br.id)?.dog_count || 0 })))
    setColors(c.data || [])
  }

  const addBreed = async () => {
    if (!newName.trim()) return
    const supabase = createClient()
    await supabase.from('breeds').insert({ name: newName.trim() })
    setNewName('')
    refresh()
  }

  const addColor = async () => {
    if (!newName.trim()) return
    const supabase = createClient()
    await supabase.from('colors').insert({ name: newName.trim(), breed_id: newColorBreed || null })
    setNewName('')
    setNewColorBreed('')
    refresh()
  }

  const updateItem = async (id: string) => {
    if (!editName.trim()) return
    const supabase = createClient()
    const table = tab === 'breeds' ? 'breeds' : 'colors'
    await supabase.from(table).update({ name: editName.trim() }).eq('id', id)
    setEditingId(null)
    refresh()
  }

  const deleteItem = async (id: string) => {
    const supabase = createClient()
    const table = tab === 'breeds' ? 'breeds' : 'colors'
    await supabase.from(table).delete().eq('id', id)
    refresh()
  }

  const items = tab === 'breeds' ? breeds : colors
  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Catálogo</h1>
      <p className="text-white/40 text-sm mb-6">Gestión de razas y colores</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('breeds'); setSearch(''); setNewName('') }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'breeds' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
          <Dog className="w-4 h-4" /> Razas ({breeds.length})
        </button>
        <button onClick={() => { setTab('colors'); setSearch(''); setNewName('') }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'colors' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
          <Palette className="w-4 h-4" /> Colores ({colors.length})
        </button>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Buscar ${tab === 'breeds' ? 'raza' : 'color'}...`}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (tab === 'breeds' ? addBreed() : addColor())}
          placeholder={`Nombre de ${tab === 'breeds' ? 'nueva raza' : 'nuevo color'}...`}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none transition" />
        {tab === 'colors' && (
          <select value={newColorBreed} onChange={e => setNewColorBreed(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/60 focus:border-[#D74709] focus:outline-none transition appearance-none">
            <option value="">Sin raza (global)</option>
            {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <button onClick={tab === 'breeds' ? addBreed : addColor} disabled={!newName.trim()}
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>

      {/* List */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
            {editingId === item.id ? (
              <>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && updateItem(item.id)}
                  autoFocus className="flex-1 bg-white/5 border border-[#D74709] rounded px-3 py-1.5 text-sm text-white focus:outline-none" />
                <button onClick={() => updateItem(item.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium flex-1">{item.name}</span>
                {tab === 'breeds' && <span className="text-[10px] text-white/30">{item.dog_count} perros</span>}
                {tab === 'colors' && item.breed_id && (
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{breeds.find(b => b.id === item.breed_id)?.name || '?'}</span>
                )}
                <button onClick={() => { setEditingId(item.id); setEditName(item.name) }} className="text-white/20 hover:text-white/60 transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteItem(item.id)} className="text-white/20 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-white/30 text-sm">Sin resultados</p>}
      </div>
    </div>
  )
}
