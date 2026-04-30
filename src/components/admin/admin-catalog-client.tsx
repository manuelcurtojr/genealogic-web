'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Trash2, Pencil, Check, X, Dog, Palette, Image, Loader2 } from 'lucide-react'

interface Props {
  breeds: any[]
  colors: any[]
  breedColors: { breed_id: string; color_id: string }[]
}

export default function AdminCatalogClient({ breeds: initBreeds, colors: initColors, breedColors: initBC }: Props) {
  const [tab, setTab] = useState<'breeds' | 'colors'>('breeds')
  const [breeds, setBreeds] = useState(initBreeds)
  const [colors, setColors] = useState(initColors)
  const [breedColorLinks, setBreedColorLinks] = useState(initBC)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // Panels
  const [breedPanel, setBreedPanel] = useState<string | null>(null) // breed id
  const [colorPanel, setColorPanel] = useState<string | null>(null) // color id
  const [colorForm, setColorForm] = useState({ name: '', thumbnail_url: '' })
  const [saving, setSaving] = useState(false)

  const refresh = async () => {
    const supabase = createClient()
    const [b, c, bc] = await Promise.all([
      supabase.from('breeds').select('id, name').order('name'),
      supabase.from('colors').select('id, name, thumbnail_url, hex_code').order('name'),
      supabase.from('breed_colors').select('breed_id, color_id'),
    ])
    setBreeds((b.data || []).map(br => ({ ...br, dog_count: breeds.find(ob => ob.id === br.id)?.dog_count || 0 })))
    setColors(c.data || [])
    setBreedColorLinks(bc.data || [])
  }

  const addBreed = async () => {
    if (!newName.trim()) return
    const supabase = createClient()
    await supabase.from('breeds').insert({ name: newName.trim() })
    setNewName(''); refresh()
  }

  const addColor = async () => {
    if (!newName.trim()) return
    const supabase = createClient()
    await supabase.from('colors').insert({ name: newName.trim() })
    setNewName(''); refresh()
  }

  const updateItem = async (id: string) => {
    if (!editName.trim()) return
    const supabase = createClient()
    await supabase.from(tab === 'breeds' ? 'breeds' : 'colors').update({ name: editName.trim() }).eq('id', id)
    setEditingId(null); refresh()
  }

  const deleteItem = async (id: string) => {
    const supabase = createClient()
    await supabase.from(tab === 'breeds' ? 'breeds' : 'colors').delete().eq('id', id)
    refresh()
  }

  // Breed panel: toggle color for breed
  const toggleBreedColor = async (breedId: string, colorId: string) => {
    const supabase = createClient()
    const exists = breedColorLinks.some(bc => bc.breed_id === breedId && bc.color_id === colorId)
    if (exists) {
      await supabase.from('breed_colors').delete().eq('breed_id', breedId).eq('color_id', colorId)
    } else {
      await supabase.from('breed_colors').insert({ breed_id: breedId, color_id: colorId })
    }
    const { data } = await supabase.from('breed_colors').select('breed_id, color_id')
    setBreedColorLinks(data || [])
  }

  // Color panel: save
  const saveColor = async () => {
    if (!colorPanel || !colorForm.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('colors').update({
      name: colorForm.name.trim(),
      thumbnail_url: colorForm.thumbnail_url.trim() || null,
    }).eq('id', colorPanel)
    setSaving(false)
    refresh()
  }

  const items = tab === 'breeds' ? breeds : colors
  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const selectedBreed = breedPanel ? breeds.find(b => b.id === breedPanel) : null
  const breedLinkedColors = breedPanel ? breedColorLinks.filter(bc => bc.breed_id === breedPanel).map(bc => bc.color_id) : []

  const selectedColor = colorPanel ? colors.find(c => c.id === colorPanel) : null
  const colorLinkedBreeds = colorPanel ? breedColorLinks.filter(bc => bc.color_id === colorPanel).map(bc => bc.breed_id) : []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Catálogo</h1>
      <p className="text-fg-mute text-sm mb-6">Gestión de razas y colores</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setTab('breeds'); setSearch(''); setNewName(''); setBreedPanel(null); setColorPanel(null) }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'breeds' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-chip text-fg-dim hover:bg-chip'}`}>
          <Dog className="w-4 h-4" /> Razas ({breeds.length})
        </button>
        <button onClick={() => { setTab('colors'); setSearch(''); setNewName(''); setBreedPanel(null); setColorPanel(null) }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'colors' ? 'bg-[#D74709]/15 text-[#D74709]' : 'bg-chip text-fg-dim hover:bg-chip'}`}>
          <Palette className="w-4 h-4" /> Colores ({colors.length})
        </button>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-mute" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Buscar ${tab === 'breeds' ? 'raza' : 'color'}...`}
            className="w-full bg-chip border border-hair rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
        </div>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (tab === 'breeds' ? addBreed() : addColor())}
          placeholder={`Añadir ${tab === 'breeds' ? 'raza' : 'color'}...`}
          className="bg-chip border border-hair rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none transition" />
        <button onClick={tab === 'breeds' ? addBreed : addColor} disabled={!newName.trim()}
          className="bg-paper-50 text-ink-900 hover:opacity-90 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>

      {/* List */}
      <div className="bg-chip border border-hair rounded-xl overflow-hidden divide-y divide-white/5">
        {filtered.map(item => (
          <div key={item.id}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-ink-800 transition cursor-pointer ${
              (tab === 'breeds' && breedPanel === item.id) || (tab === 'colors' && colorPanel === item.id) ? 'bg-[#D74709]/5' : ''
            }`}
            onClick={() => {
              if (tab === 'breeds') { setBreedPanel(breedPanel === item.id ? null : item.id); setColorPanel(null) }
              else {
                setColorPanel(colorPanel === item.id ? null : item.id)
                setBreedPanel(null)
                if (colorPanel !== item.id) setColorForm({ name: item.name, thumbnail_url: item.thumbnail_url || '' })
              }
            }}>
            {/* Color thumbnail */}
            {tab === 'colors' && (
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-chip border border-hair flex-shrink-0">
                {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center"><Palette className="w-3 h-3 text-fg-mute" /></div>}
              </div>
            )}
            {editingId === item.id ? (
              <>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && updateItem(item.id)}
                  onClick={e => e.stopPropagation()}
                  autoFocus className="flex-1 bg-chip border border-[#D74709] rounded px-3 py-1.5 text-sm text-white focus:outline-none" />
                <button onClick={e => { e.stopPropagation(); updateItem(item.id) }} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                <button onClick={e => { e.stopPropagation(); setEditingId(null) }} className="text-fg-mute hover:text-fg-dim"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium flex-1">{item.name}</span>
                {tab === 'breeds' && (
                  <>
                    <span className="text-[10px] text-fg-mute">{item.dog_count} perros</span>
                    <span className="text-[10px] text-purple-400/60">{breedColorLinks.filter(bc => bc.breed_id === item.id).length} colores</span>
                  </>
                )}
                {tab === 'colors' && (
                  <span className="text-[10px] text-purple-400/60">{breedColorLinks.filter(bc => bc.color_id === item.id).length} razas</span>
                )}
                <button onClick={e => { e.stopPropagation(); setEditingId(item.id); setEditName(item.name) }} className="text-fg-mute hover:text-fg-dim transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} className="text-fg-mute hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-fg-mute text-sm">Sin resultados</p>}
      </div>

      {/* ===== BREED PANEL: select colors ===== */}
      {breedPanel && selectedBreed && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]" onClick={() => setBreedPanel(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-ink-800 border-l border-hair shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-hair flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold">Colores de {selectedBreed.name}</h2>
                <p className="text-[10px] text-fg-mute">{breedLinkedColors.length} colores seleccionados</p>
              </div>
              <button onClick={() => setBreedPanel(null)} className="text-fg-mute hover:text-fg"><X className="w-5 h-5" /></button>
            </div>
            <p className="px-5 py-2 text-xs text-fg-mute bg-ink-800 border-b border-hair">Selecciona los colores que son estándar para esta raza. Solo estos aparecerán al añadir un perro de esta raza.</p>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {colors.map(c => {
                const isLinked = breedLinkedColors.includes(c.id)
                return (
                  <button key={c.id} onClick={() => toggleBreedColor(breedPanel, c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left ${isLinked ? 'bg-[#D74709]/10 border border-[#D74709]/30' : 'bg-ink-800 border border-transparent hover:bg-chip'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isLinked ? 'bg-[#D74709] border-[#D74709]' : 'border border-hair-strong bg-chip'}`}>
                      {isLinked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="w-7 h-7 rounded-md overflow-hidden bg-chip border border-hair flex-shrink-0">
                      {c.thumbnail_url ? <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center"><Palette className="w-3 h-3 text-fg-mute" /></div>}
                    </div>
                    <span className="text-xs font-medium flex-1">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ===== COLOR PANEL: edit name + photo + linked breeds ===== */}
      {colorPanel && selectedColor && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]" onClick={() => setColorPanel(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-ink-800 border-l border-hair shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-hair flex-shrink-0">
              <h2 className="text-sm font-semibold">Editar color</h2>
              <button onClick={() => setColorPanel(null)} className="text-fg-mute hover:text-fg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-chip border border-hair flex-shrink-0">
                  {colorForm.thumbnail_url ? <img src={colorForm.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center"><Image className="w-6 h-6 text-fg-mute" /></div>}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{colorForm.name || 'Sin nombre'}</p>
                  <p className="text-[10px] text-fg-mute">{colorLinkedBreeds.length} razas asignadas</p>
                </div>
              </div>

              {/* Form */}
              <div>
                <label className="text-[10px] font-semibold text-fg-mute uppercase tracking-wider mb-1 block">Nombre del color *</label>
                <input type="text" value={colorForm.name} onChange={e => setColorForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-chip border border-hair rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D74709] focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-fg-mute uppercase tracking-wider mb-1 block">URL de la foto del color</label>
                <input type="text" value={colorForm.thumbnail_url} onChange={e => setColorForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-chip border border-hair rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-fg-mute focus:border-[#D74709] focus:outline-none" />
                <p className="text-[10px] text-fg-mute mt-1">Esta foto aparecerá en el selector de colores al añadir un perro</p>
              </div>
              <button onClick={saveColor} disabled={saving || !colorForm.name.trim()}
                className="w-full bg-paper-50 text-ink-900 hover:opacity-90 font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Guardar color'}
              </button>

              {/* Linked breeds */}
              <div className="border-t border-hair pt-4">
                <h3 className="text-xs font-semibold text-fg-mute uppercase tracking-wider mb-3">Razas con este color</h3>
                {colorLinkedBreeds.length === 0 ? (
                  <p className="text-xs text-fg-mute text-center py-4">Este color no está asignado a ninguna raza</p>
                ) : (
                  <div className="space-y-1">
                    {colorLinkedBreeds.map(breedId => {
                      const breed = breeds.find(b => b.id === breedId)
                      if (!breed) return null
                      return (
                        <div key={breedId} className="flex items-center gap-2 px-3 py-2 bg-ink-800 rounded-lg">
                          <Dog className="w-3.5 h-3.5 text-fg-mute" />
                          <span className="text-xs font-medium flex-1">{breed.name}</span>
                          <span className="text-[10px] text-fg-mute">{breed.dog_count} perros</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
