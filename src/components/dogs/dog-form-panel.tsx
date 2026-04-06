'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, CreditCard, GitBranch, Weight, ImageIcon, Eye, EyeOff, Dog, Stethoscope, Trophy, FileText, History, Shield, Syringe, Bug, Pill, FlaskConical, Scissors, Plus, Pencil, Trash2, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface DogFormPanelProps {
  open: boolean; onClose: () => void; onSaved?: () => void; editDogId?: string | null; userId: string; defaultLitterId?: string | null; defaultBreedId?: string | null
}

const TABS = [
  { key: 'datos', label: 'Datos', icon: Dog },
  { key: 'salud', label: 'Salud', icon: Stethoscope },
  { key: 'palmares', label: 'Palmares', icon: Trophy },
  { key: 'pedigree-pdf', label: 'Pedigree PDF', icon: FileText },
  { key: 'historial', label: 'Historial', icon: History },
  { key: 'verificacion', label: 'Verificacion', icon: Shield },
] as const

type TabKey = typeof TABS[number]['key']

const VET_TYPES = [
  { key: 'vaccine', label: 'Vacuna', icon: Syringe, color: '#3498db' },
  { key: 'deworming', label: 'Desparasitacion', icon: Bug, color: '#27ae60' },
  { key: 'treatment', label: 'Tratamiento', icon: Pill, color: '#f39c12' },
  { key: 'test', label: 'Prueba medica', icon: FlaskConical, color: '#9b59b6' },
  { key: 'surgery', label: 'Cirugia', icon: Scissors, color: '#e74c3c' },
]

const AWARD_TYPES = [
  { key: 'CAC', label: 'CAC', color: '#f39c12' },
  { key: 'CACIB', label: 'CACIB', color: '#f39c12' },
  { key: 'BOB', label: 'BOB', color: '#3498db' },
  { key: 'BOS', label: 'BOS', color: '#e84393' },
  { key: 'BOG', label: 'BOG', color: '#27ae60' },
  { key: 'BIS', label: 'BIS', color: '#f1c40f' },
  { key: 'other', label: 'Otro', color: '#95a5a6' },
]

export default function DogFormPanel({ open, onClose, onSaved, editDogId, userId, defaultLitterId, defaultBreedId }: DogFormPanelProps) {
  const router = useRouter()
  const isEdit = !!editDogId
  const [activeTab, setActiveTab] = useState<TabKey>('datos')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  // Reference data
  const [breeds, setBreeds] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [allColors, setAllColors] = useState<any[]>([])
  const [kennels, setKennels] = useState<any[]>([])
  const [maleDogs, setMaleDogs] = useState<any[]>([])
  const [femaleDogs, setFemaleDogs] = useState<any[]>([])
  const [allMaleDogs, setAllMaleDogs] = useState<any[]>([])
  const [allFemaleDogs, setAllFemaleDogs] = useState<any[]>([])

  // Vet records + awards for tabs
  const [vetRecords, setVetRecords] = useState<any[]>([])
  const [awards, setAwards] = useState<any[]>([])
  const [vetFilter, setVetFilter] = useState('all')
  const [awardFilter, setAwardFilter] = useState('all')

  const [form, setForm] = useState({
    name: '', sex: 'male', birth_date: '', registration: '', microchip: '',
    weight: '', height: '', breed_id: '', color_id: '', kennel_id: '',
    father_id: '', mother_id: '', is_public: true,
  })

  useEffect(() => {
    if (!open) return
    setActiveTab('datos'); setDataLoading(true); setError('')
    const supabase = createClient()
    async function load() {
      const [bRes, cRes, kRes, mRes, fRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name, breed_id').order('name'),
        supabase.from('kennels').select('id, name, logo_url').eq('owner_id', userId).order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'male').order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'female').order('name'),
      ])
      setBreeds(bRes.data||[]); setAllColors(cRes.data||[]); setColors(cRes.data||[])
      setKennels(kRes.data||[]); setAllMaleDogs(mRes.data||[]); setAllFemaleDogs(fRes.data||[])
      setMaleDogs(mRes.data||[]); setFemaleDogs(fRes.data||[])

      if (editDogId) {
        const { data: dog } = await supabase.from('dogs').select('*').eq('id', editDogId).single()
        if (dog) {
          setForm({ name: dog.name||'', sex: dog.sex||'male', birth_date: dog.birth_date||'', registration: dog.registration||'', microchip: dog.microchip||'', weight: dog.weight?.toString()||'', height: dog.height?.toString()||'', breed_id: dog.breed_id||'', color_id: dog.color_id||'', kennel_id: dog.kennel_id||'', father_id: dog.father_id||'', mother_id: dog.mother_id||'', is_public: dog.is_public??true })
          if (dog.breed_id) filterByBreed(dog.breed_id, cRes.data||[], mRes.data||[], fRes.data||[])
        }
        // Load vet records and awards
        const [vRes, aRes] = await Promise.all([
          supabase.from('vet_records').select('*').eq('dog_id', editDogId).order('date', { ascending: false }),
          supabase.from('awards').select('*').eq('dog_id', editDogId).order('date', { ascending: false }),
        ])
        setVetRecords(vRes.data||[]); setAwards(aRes.data||[])
      } else {
        const breedId = defaultBreedId||''
        setForm({ name:'',sex:'male',birth_date:'',registration:'',microchip:'',weight:'',height:'',breed_id:breedId,color_id:'',kennel_id:'',father_id:'',mother_id:'',is_public:true })
        if (breedId) filterByBreed(breedId, cRes.data||[], mRes.data||[], fRes.data||[])
        setVetRecords([]); setAwards([])
      }
      setDataLoading(false)
    }
    load()
  }, [open, editDogId, userId])

  useEffect(() => { if (!open) return; const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [open, onClose])

  function filterByBreed(breedId: string, cd?: any[], md?: any[], fd?: any[]) {
    const c=cd||allColors,m=md||allMaleDogs,f=fd||allFemaleDogs
    if(!breedId){setColors(c);setMaleDogs(m);setFemaleDogs(f)}
    else{setColors(c.filter((cl:any)=>!cl.breed_id||cl.breed_id===breedId));setMaleDogs(m.filter((d:any)=>d.breed_id===breedId));setFemaleDogs(f.filter((d:any)=>d.breed_id===breedId))}
  }

  const set = (field: string, value: any) => {
    setForm(prev => { const next = { ...prev, [field]: value }; if (field === 'breed_id') { filterByBreed(value); next.color_id=''; next.father_id=''; next.mother_id='' }; return next })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return; setLoading(true); setError('')
    const supabase = createClient()
    const payload = { name:form.name.trim(),sex:form.sex,birth_date:form.birth_date||null,registration:form.registration||null,microchip:form.microchip||null,weight:form.weight?parseFloat(form.weight):null,height:form.height?parseFloat(form.height):null,breed_id:form.breed_id||null,color_id:form.color_id||null,kennel_id:form.kennel_id||null,father_id:form.father_id||null,mother_id:form.mother_id||null,is_public:form.is_public }
    if (isEdit) { const{error:err}=await supabase.from('dogs').update(payload).eq('id',editDogId!); setLoading(false); if(err){setError(err.message);return} }
    else { const{error:err}=await supabase.from('dogs').insert({...payload,owner_id:userId}); setLoading(false); if(err){setError(err.message);return} }
    onClose(); if(onSaved)onSaved(); router.refresh()
  }

  const selBreed=breeds.find(b=>b.id===form.breed_id),selFather=allMaleDogs.find(d=>d.id===form.father_id),selMother=allFemaleDogs.find(d=>d.id===form.mother_id),selKennel=kennels.find(k=>k.id===form.kennel_id)

  // Vet record counts per type
  const vetCounts = VET_TYPES.map(t => ({ ...t, count: vetRecords.filter(r => r.record_type === t.key).length }))
  const filteredVet = vetFilter === 'all' ? vetRecords : vetRecords.filter(r => r.record_type === vetFilter)

  // Award counts per type
  const awardCounts = AWARD_TYPES.map(t => ({ ...t, count: awards.filter(a => a.award_type === t.key).length }))
  const filteredAwards = awardFilter === 'all' ? awards : awards.filter(a => a.award_type === awardFilter)

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open?'opacity-100':'opacity-0 pointer-events-none'}`} onClick={onClose}/>
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open?'translate-x-0':'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">{isEdit?'Editar perro':defaultLitterId?'Anadir cachorro':'Anadir perro'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs — only show all tabs in edit mode */}
        {isEdit && (
          <div className="flex border-b border-white/10 px-4 overflow-x-auto flex-shrink-0">
            {TABS.map(t => {
              const Icon = t.icon; const active = activeTab === t.key
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${active?'border-[#D74709] text-[#D74709]':'border-transparent text-white/40 hover:text-white/60'}`}>
                  <Icon className="w-3.5 h-3.5"/>{t.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30"/></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">{error}</div>}

            {/* TAB: DATOS */}
            {activeTab === 'datos' && (
              <div className="space-y-6">
                <Sec icon={CreditCard} title="Identidad">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre *" value={form.name} onChange={v=>set('name',v)}/>
                    <div>
                      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Sexo *</label>
                      <div className="flex gap-2">
                        {(['male','female'] as const).map(s=><button key={s} type="button" onClick={()=>set('sex',s)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${form.sex===s?(s==='male'?'border-blue-400 bg-blue-400/10 text-blue-400':'border-pink-400 bg-pink-400/10 text-pink-400'):'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}>{s==='male'?'♂ Macho':'♀ Hembra'}</button>)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nacimiento" value={form.birth_date} onChange={v=>set('birth_date',v)} type="date"/>
                    <Field label="Microchip" value={form.microchip} onChange={v=>set('microchip',v)} placeholder="Numero"/>
                  </div>
                  <Field label="Registro" value={form.registration} onChange={v=>set('registration',v)} placeholder="UKC, FCI, etc."/>
                </Sec>
                <Sec icon={GitBranch} title="Genealogia">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <GCard label="RAZA" name={selBreed?.name} onClear={()=>set('breed_id','')} selector={<ISearch items={breeds.map(b=>({id:b.id,name:b.name,image:null}))} value={form.breed_id} onChange={v=>set('breed_id',v)} placeholder="Buscar raza..."/>}/>
                    <GCard label="PADRE" name={selFather?.name} image={selFather?.thumbnail_url} sexColor={BRAND.male} onClear={()=>set('father_id','')} disabled={!form.breed_id} selector={<ISearch items={maleDogs.filter(d=>d.id!==editDogId).map(d=>({id:d.id,name:d.name,image:d.thumbnail_url}))} value={form.father_id} onChange={v=>set('father_id',v)} placeholder="Buscar padre..." sexColor={BRAND.male}/>}/>
                    <GCard label="MADRE" name={selMother?.name} image={selMother?.thumbnail_url} sexColor={BRAND.female} onClear={()=>set('mother_id','')} disabled={!form.breed_id} selector={<ISearch items={femaleDogs.filter(d=>d.id!==editDogId).map(d=>({id:d.id,name:d.name,image:d.thumbnail_url}))} value={form.mother_id} onChange={v=>set('mother_id',v)} placeholder="Buscar madre..." sexColor={BRAND.female}/>}/>
                    <GCard label="CRIADERO" name={selKennel?.name} image={selKennel?.logo_url} onClear={()=>set('kennel_id','')} selector={<ISearch items={kennels.map(k=>({id:k.id,name:k.name,image:k.logo_url}))} value={form.kennel_id} onChange={v=>set('kennel_id',v)} placeholder="Buscar criadero..."/>}/>
                  </div>
                  {form.breed_id && <InlineSearch label="Color" items={colors.map(c=>({id:c.id,name:c.name,image:null}))} value={form.color_id} onChange={v=>set('color_id',v)} placeholder="Buscar color..."/>}
                </Sec>
                <Sec icon={Weight} title="Medidas">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Peso (kg)" value={form.weight} onChange={v=>set('weight',v)} type="number"/>
                    <Field label="Altura (cm)" value={form.height} onChange={v=>set('height',v)} type="number"/>
                  </div>
                </Sec>
                <Sec icon={ImageIcon} title="Galeria">
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                    <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2"/>
                    <p className="text-xs text-white/30">Arrastra fotos aqui o haz clic para subir</p>
                    <p className="text-[10px] text-white/20 mt-1">Proximamente</p>
                  </div>
                </Sec>
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {form.is_public?<Eye className="w-4 h-4 text-green-400"/>:<EyeOff className="w-4 h-4 text-white/30"/>}
                    <div><p className="text-sm font-medium">{form.is_public?'Publico':'Privado'}</p><p className="text-xs text-white/40">{form.is_public?'Visible para otros':'Solo tu'}</p></div>
                  </div>
                  <button type="button" onClick={()=>set('is_public',!form.is_public)} className={`w-10 h-5 rounded-full transition relative ${form.is_public?'bg-[#D74709]':'bg-white/20'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition ${form.is_public?'left-[22px]':'left-0.5'}`}/></button>
                </div>
              </div>
            )}

            {/* TAB: SALUD */}
            {activeTab === 'salud' && (
              <div className="space-y-4">
                {/* Type summary cards */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {vetCounts.map(t => {
                    const Icon = t.icon
                    return <div key={t.key} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[120px]">
                      <div className="flex items-center gap-2"><Icon className="w-4 h-4" style={{color:t.color}}/><span className="text-xs font-semibold">{t.label}</span></div>
                      <p className="text-[11px] text-white/40 mt-0.5">{t.count} registros</p>
                    </div>
                  })}
                </div>
                {/* Filter buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={()=>setVetFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition ${vetFilter==='all'?'bg-[#D74709] text-white':'bg-white/5 text-white/50 hover:bg-white/10'}`}>Todos</button>
                  {VET_TYPES.map(t=><button key={t.key} onClick={()=>setVetFilter(t.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${vetFilter===t.key?'text-white':'bg-white/5 text-white/50 hover:bg-white/10'}`} style={vetFilter===t.key?{backgroundColor:t.color}:undefined}>{t.label}</button>)}
                </div>
                {/* Add button */}
                <button className="flex items-center gap-1.5 text-sm text-[#D74709] hover:text-[#c03d07] transition font-medium">
                  <Plus className="w-4 h-4"/> Anadir registro
                </button>
                {/* Records list */}
                {filteredVet.length === 0 ? (
                  <div className="text-center py-10 text-white/30"><Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="text-sm">Aun no hay registros veterinarios. Anade el primero!</p></div>
                ) : filteredVet.map(r => {
                  const type = VET_TYPES.find(t=>t.key===r.record_type)||VET_TYPES[0]; const Icon=type.icon
                  return <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:type.color+'20'}}><Icon className="w-4 h-4" style={{color:type.color}}/></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{r.name}</p><p className="text-xs text-white/40">{new Date(r.date).toLocaleDateString('es-ES')}{r.vet_name&&` · ${r.vet_name}`}</p></div>
                  </div>
                })}
              </div>
            )}

            {/* TAB: PALMARES */}
            {activeTab === 'palmares' && (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {awardCounts.map(t => <div key={t.key} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[90px]">
                    <span className="text-xs font-bold" style={{color:t.color}}>{t.label}</span>
                    <p className="text-[11px] text-white/40">{t.count} titulos</p>
                  </div>)}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={()=>setAwardFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition ${awardFilter==='all'?'bg-[#D74709] text-white':'bg-white/5 text-white/50 hover:bg-white/10'}`}>Todos</button>
                  {AWARD_TYPES.map(t=><button key={t.key} onClick={()=>setAwardFilter(t.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${awardFilter===t.key?'text-white':'bg-white/5 text-white/50 hover:bg-white/10'}`} style={awardFilter===t.key?{backgroundColor:t.color}:undefined}>{t.label}</button>)}
                </div>
                <button className="flex items-center gap-1.5 text-sm text-[#D74709] hover:text-[#c03d07] transition font-medium"><Plus className="w-4 h-4"/> Anadir titulo</button>
                {filteredAwards.length === 0 ? (
                  <div className="text-center py-10 text-white/30"><Trophy className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="text-sm">Aun no hay titulos registrados. Anade el primer premio!</p></div>
                ) : filteredAwards.map(a => {
                  const type = AWARD_TYPES.find(t=>t.key===a.award_type)||AWARD_TYPES[6]
                  return <div key={a.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:type.color+'20'}}><Trophy className="w-4 h-4" style={{color:type.color}}/></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{a.event_name}</p><p className="text-xs text-white/40">{type.label} · {new Date(a.date).toLocaleDateString('es-ES')}{a.judge&&` · Juez: ${a.judge}`}</p></div>
                  </div>
                })}
              </div>
            )}

            {/* TAB: PEDIGREE PDF */}
            {activeTab === 'pedigree-pdf' && (
              <div className="space-y-5 text-center">
                <div className="text-[#D74709] mx-auto w-16 h-16 rounded-2xl bg-[#D74709]/10 flex items-center justify-center"><FileText className="w-8 h-8"/></div>
                <div>
                  <h3 className="text-xl font-bold">Exportar Pedigree en PDF</h3>
                  <p className="text-sm text-white/50 mt-2">Genera un documento PDF con la genealogia digital de <strong className="text-white">{form.name||'este perro'}</strong>, incluyendo los datos del perro, propietario y arbol genealogico de 4 generaciones.</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0"/>
                  <p className="text-xs text-orange-400">Este PDF es una version digital de la genealogia registrada en Genealogic. No es un pedigri oficial emitido por un club canofilo (FCI, AKC, KC, RSCE, etc.).</p>
                </div>
                <button className="inline-flex items-center gap-2 bg-[#D74709]/10 border border-[#D74709]/30 text-[#D74709] font-semibold px-6 py-3 rounded-lg hover:bg-[#D74709]/20 transition">
                  <Download className="w-5 h-5"/> Descargar Pedigree PDF
                </button>
              </div>
            )}

            {/* TAB: HISTORIAL */}
            {activeTab === 'historial' && (
              <div className="space-y-4">
                <Sec icon={History} title="Historial de cambios">
                  <div className="text-center py-10 text-white/30">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-30"/>
                    <p className="text-sm">No hay cambios registrados para este perro.</p>
                  </div>
                </Sec>
              </div>
            )}

            {/* TAB: VERIFICACION */}
            {activeTab === 'verificacion' && (
              <div className="space-y-5">
                <div className="text-[#D74709] mx-auto w-14 h-14 rounded-2xl bg-[#D74709]/10 flex items-center justify-center"><Shield className="w-7 h-7"/></div>
                <div className="text-center">
                  <h3 className="text-lg font-bold">Verifica la genealogia</h3>
                  <p className="text-sm text-white/50 mt-2">La verificacion confirma que la genealogia de tu perro esta respaldada por un <strong className="text-white">registro oficial de un club canino</strong>. Los perros verificados muestran un distintivo especial en su perfil.</p>
                </div>
                {[
                  { num: '1', title: 'Microchip', desc: 'Introduce el numero de microchip de tu perro para identificarlo de forma unica.' },
                  { num: '2', title: 'Pedigri oficial', desc: 'Sube una foto o PDF del pedigri emitido por un club canino oficial (FCI, AKC, KC, RSCE, etc.).' },
                  { num: '3', title: 'Revision', desc: 'Nuestro equipo verificara que la documentacion coincide con los datos del perro.' },
                ].map(step => (
                  <div key={step.num} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D74709] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{step.num}</div>
                    <div><p className="text-sm font-semibold">{step.title}</p><p className="text-xs text-white/40 mt-0.5">{step.desc}</p></div>
                  </div>
                ))}
                <button className="w-full bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4"/> Iniciar verificacion
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer — only show save button on Datos tab */}
        {activeTab === 'datos' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading||!form.name.trim()||dataLoading}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
              {loading&&<Loader2 className="w-4 h-4 animate-spin"/>}{loading?'Guardando...':isEdit?'Actualizar perro':'Crear perro'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* Helpers */
function Sec({icon:Icon,title,children}:{icon:React.ElementType;title:string;children:React.ReactNode}){
  return <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3"><div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-[#D74709]"/><h3 className="text-sm font-semibold">{title}</h3></div>{children}</div>
}
function Field({label,value,onChange,type='text',placeholder}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string}){
  return <div><label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"/></div>
}
function GCard({label,name,image,sexColor,onClear,selector,disabled}:{label:string;name?:string;image?:string|null;sexColor?:string;onClear:()=>void;selector:React.ReactNode;disabled?:boolean}){
  const[open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])
  return <div ref={ref} className="relative flex-shrink-0" style={{width:150}}>
    <div onClick={()=>{if(!disabled)setOpen(!open)}} className={`w-full bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer transition min-h-[56px] ${disabled?'opacity-40 cursor-not-allowed':'hover:border-white/20'} ${open?'border-[#D74709]':''}`}>
      {name?<><div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-white truncate">{name}</p><p className="text-[9px] text-white/30 uppercase">{label}</p></div></>:<div className="w-full text-center"><p className="text-[9px] text-white/30 uppercase">{label}</p><p className="text-[10px] text-white/40 mt-0.5">Seleccionar</p></div>}
    </div>
    {open&&!disabled&&<div className="absolute z-[80] top-full mt-1 left-0 w-[240px] bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 overflow-hidden">{selector}{name&&<button onClick={()=>{onClear();setOpen(false)}} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 border-t border-white/5">Quitar</button>}</div>}
  </div>
}
function ISearch({items,value,onChange,placeholder,sexColor}:{items:{id:string;name:string;image:string|null}[];value:string;onChange:(v:string)=>void;placeholder?:string;sexColor?:string}){
  const[search,setSearch]=useState('');const inputRef=useRef<HTMLInputElement>(null);const filtered=items.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()))
  useEffect(()=>{if(inputRef.current)inputRef.current.focus()},[])
  return <><div className="p-2 border-b border-white/5"><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"/><input ref={inputRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder={placeholder||'Buscar...'} className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none"/></div></div>
  <div className="overflow-y-auto max-h-40">{filtered.length===0?<p className="text-sm text-white/30 p-3 text-center">Sin resultados</p>:filtered.map(item=><button key={item.id} type="button" onClick={()=>{onChange(item.id);setSearch('')}} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${item.id===value?'bg-[#D74709]/15 text-[#D74709]':'text-white/70 hover:bg-white/5'}`}>{item.image!==null&&<div className="w-6 h-6 rounded-full border overflow-hidden flex-shrink-0 bg-white/5" style={{borderColor:sexColor||'rgba(255,255,255,0.1)'}}>{item.image?<img src={item.image} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-3 h-3 opacity-30"/></div>}</div>}<span className="truncate">{item.name}</span></button>)}</div></>
}
function InlineSearch({label,items,value,onChange,placeholder}:{label:string;items:{id:string;name:string;image:string|null}[];value:string;onChange:(v:string)=>void;placeholder?:string}){
  const[open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);const sel=items.find(i=>i.id===value)
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])
  return <div ref={ref} className="relative"><label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
    <div onClick={()=>setOpen(!open)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition hover:border-white/20 ${open?'border-[#D74709]':'border-white/10'}`}><span className={sel?'text-white':'text-white/30'}>{sel?.name||placeholder}</span><div className="ml-auto flex items-center gap-1">{value&&<span onClick={e=>{e.stopPropagation();onChange('');setOpen(false)}} className="text-white/30 hover:text-white/60"><X className="w-3 h-3"/></span>}<ChevronDown className={`w-3.5 h-3.5 text-white/30 transition ${open?'rotate-180':''}`}/></div></div>
    {open&&<div className="absolute z-[80] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-48 flex flex-col"><ISearch items={items} value={value} onChange={v=>{onChange(v);setOpen(false)}} placeholder={placeholder}/></div>}
  </div>
}
