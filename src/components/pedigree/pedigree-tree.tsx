'use client'

import { useState, useMemo, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import Link from 'next/link'
import { Search, ArrowLeftRight, GitBranch, ChevronLeft, ChevronRight, Dna, CheckCircle, Plus } from 'lucide-react'

const PedigreeCtx = createContext<{ onClickDog?: (id: string) => void; onClickEmpty?: (parentId: string, role: 'father' | 'mother') => void }>({})
import { calculateCOI, getCOILevel, getCOIInterpretation } from './coi-calculator'

interface PN { id:string;name:string;sex:string;registration:string|null;father_id:string|null;mother_id:string|null;generation:number;photo_url:string|null;breed_name:string|null;color_name:string|null }
interface Props { data:PN[];rootId:string;onClickDog?:(dogId:string)=>void;onClickEmpty?:(parentDogId:string,role:'father'|'mother')=>void }

function countOcc(nId:string|null,nm:Map<string,PN>,mx:number,g:number,c:Map<string,number>){if(!nId||g>mx)return;const n=nm.get(nId);if(!n)return;c.set(nId,(c.get(nId)||0)+1);countOcc(n.father_id,nm,mx,g+1,c);countOcc(n.mother_id,nm,mx,g+1,c)}
// Repetition badge colors — pastels Cal
const RC=['','','#3b82f6','#34d399','#f59e0b','#ef4444','#8b5cf6','#ec4899']
const CW=200,CH=64,PH=56
// Línea conectora — usa token + fallback Cal (oscuro suave sobre canvas)
const L='var(--pedigree-line, rgba(17, 17, 17, 0.14))'

export default function PedigreeTree({data,rootId,onClickDog,onClickEmpty}:Props){
  const[isNative,setIsNative]=useState(false)
  useEffect(()=>{if((window as any).Capacitor?.isNativePlatform?.())setIsNative(true)},[])
  const[maxGen,setMaxGen]=useState(4)
  const[zoom,setZoom]=useState(100)
  const[showIB,setShowIB]=useState(false)
  const[coiPanel,setCoiPanel]=useState(false)
  const[genMenu,setGenMenu]=useState(false)
  const[zoomMenu,setZoomMenu]=useState(false)
  const[vert,setVert]=useState(false)
  const nm=useMemo(()=>{const m=new Map<string,PN>();data.forEach(n=>m.set(n.id,n));return m},[data])
  const root=nm.get(rootId);if(!root)return null
  const coi=useMemo(()=>calculateCOI(rootId,data,10),[rootId,data])
  const coiLvl=getCOILevel(coi),coiTxt=getCOIInterpretation(coi)
  const rc=useMemo(()=>{const c=new Map<string,number>();countOcc(root.father_id,nm,maxGen,1,c);countOcc(root.mother_id,nm,maxGen,1,c);return c},[root,nm,maxGen])
  // Niveles COI con pastels Cal sobre tints suaves
  const cc:Record<string,{bg:string;text:string}>={
    green:{bg:'bg-[color:var(--success)]/10',text:'text-[color:var(--success)]'},
    orange:{bg:'bg-[color:var(--warning)]/10',text:'text-[color:var(--warning)]'},
    red:{bg:'bg-[color:var(--error)]/10',text:'text-[color:var(--error)]'},
  }
  const toggleIB=()=>{setShowIB(s=>!s);setCoiPanel(p=>!p)}
  const close=()=>{setGenMenu(false);setZoomMenu(false)}

  return(
    <>
      <div className="relative" onClick={close}>
        <PedigreeCtx.Provider value={{onClickDog,onClickEmpty}}>
        {/* Container con scroll horizontal + vertical. Aplicamos `zoom`
            (CSS no-estándar pero soportado en WebKit, Blink, Edge) en lugar
            de `transform: scale`, porque scale NO recalcula el bounding box
            del hijo — el contenedor padre cree que el árbol "cabe" cuando en
            realidad escalado se sale del viewport. Con zoom el child reflowea
            con las dimensiones aparentes, así el overflow-auto scrollea bien. */}
        <div className="overflow-auto pb-20" style={{ zoom: zoom / 100 } as React.CSSProperties}>
          <div className="min-w-max py-4 px-4 lg:px-2">
            {vert?<VN n={root} nm={nm} g={0} mx={maxGen} isRoot si={showIB} rc={rc}/>:<HN n={root} nm={nm} g={0} mx={maxGen} isRoot si={showIB} rc={rc}/>}
          </div>
        </div>
      </PedigreeCtx.Provider>
      </div>
      {/* COI Panel — outside transform context.
          Mobile (<sm): full-screen overlay con backdrop. Antes era panel
          320px que tapaba el header sin backdrop ni botón cerrar visible.
          Desktop: panel lateral 320px como antes.
          Posicionamiento respeta safe-area-top en iPhones con notch. */}
      {coiPanel && (
        <div
          className="sm:hidden fixed inset-0 z-[9099] bg-black/45 backdrop-blur-[2px]"
          onClick={() => setCoiPanel(false)}
          aria-hidden="true"
        />
      )}
      {/* Posicionamiento responsive:
            mobile: full-width (left-0 right-0 bottom-0), top respeta safe-area
            desktop sm+: pegado a la derecha 320px de ancho
          Antes usaba `inset-0 sm:inset-auto` pero `inset-0` setea TODOS los
          insets a 0 y el `sm:inset-auto` no resetea el `right` ni `bottom`
          de forma consistente — el panel quedaba flotando en medio. */}
      {/* Panel COI:
            mobile: full-screen — top:0 right:0 bottom:0 left:0 con padding-top
              que respeta safe-area-inset-top (notch iPhone). Igual que el
              panel de editar perro y añadir perro.
            desktop: panel lateral 320px desde el top de la viewport. */}
      <div
        className={`fixed top-0 bottom-0 right-0 left-0 sm:left-auto z-[9100] flex flex-col border-l border-hairline bg-canvas shadow-[-8px_0_24px_rgba(0,0,0,0.06)] transition-transform duration-300 w-full sm:w-[320px] ${coiPanel?'translate-x-0':'translate-x-full pointer-events-none'}`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >
        <button
          onClick={()=>setCoiPanel(!coiPanel)}
          className="pointer-events-auto absolute -left-7 top-1/2 hidden sm:flex h-14 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-hairline bg-canvas text-muted transition-colors hover:text-ink"
        >
          {coiPanel?<ChevronRight className="h-3.5 w-3.5"/>:<ChevronLeft className="h-3.5 w-3.5"/>}
        </button>
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4 text-ink"/>
            <h3 className="text-[14px] font-semibold text-ink">Salud genética</h3>
          </div>
          <button onClick={()=>setCoiPanel(false)} className="text-muted transition-colors hover:text-ink">
            <ChevronRight className="h-4 w-4"/>
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="text-center">
            <p className={`text-[40px] font-semibold tabular-nums tracking-[-0.04em] ${cc[coiLvl].text}`}>{coi}%</p>
            <p className="mt-1 text-[12px] text-muted">Coeficiente de consanguinidad</p>
          </div>
          <div>
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="flex-1" style={{backgroundColor:'#34d399'}}/>
              <div className="flex-1" style={{backgroundColor:'#fbbf24'}}/>
              <div className="flex-1" style={{backgroundColor:'#fb923c'}}/>
              <div className="flex-1" style={{backgroundColor:'#ef4444'}}/>
            </div>
            <div className="relative -mt-0.5 h-3">
              <div className="absolute h-3 w-3 -translate-x-1.5 rounded-full border-2 border-canvas bg-ink shadow-[0_1px_3px_rgba(0,0,0,0.2)]" style={{left:`${Math.min((coi/25)*100,100)}%`}}/>
            </div>
            <div className="mt-1.5 flex justify-between text-[9.5px] text-muted">
              <span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span>
            </div>
          </div>
          <div className={`flex items-start gap-2 rounded-lg p-3 ${cc[coiLvl].bg}`}>
            <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${cc[coiLvl].text}`}/>
            <p className={`text-[12.5px] leading-[1.5] ${cc[coiLvl].text}`}>{coiTxt}</p>
          </div>
          <p className="text-center text-[10.5px] text-muted">Calculado con 10 generaciones.</p>
        </div>
      </div>
      {/* Floating buttons — outside transform context so fixed works.
          - left: en mobile (`left-4` = 16px) ignoramos la var --sidebar-width
            que el dashboard-shell setea siempre a 256px aunque la sidebar
            mobile sea un drawer oculto. En desktop (lg+) sí usamos la var
            para que los botones queden a la derecha de la sidebar.
          - bottom: respeta safe-area-inset-bottom (iPhones con home bar). */}
      <div
        className="fixed z-50 flex items-center gap-2 left-4 lg:left-[max(16px,calc(var(--sidebar-width,0px)+30px))]"
        style={{
          bottom: isNative
            ? 'calc(106px + env(safe-area-inset-bottom, 0px))'
            : 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
        onClick={close}
      >
        <div className="relative">
          <button
            onClick={e=>{e.stopPropagation();setZoomMenu(!zoomMenu);setGenMenu(false)}}
            title="Zoom"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-canvas text-body shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-surface-soft hover:text-ink"
          >
            <Search className="h-4 w-4"/>
          </button>
          {zoomMenu && (
            <div className="absolute bottom-14 left-0 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.08)]" onClick={e=>e.stopPropagation()}>
              {[150,130,110,100,90,80,70,60,50].map(z=>(
                <button
                  key={z}
                  onClick={()=>{setZoom(z);setZoomMenu(false)}}
                  className={`block w-full px-4 py-1.5 text-center text-[12px] font-medium transition-colors ${zoom===z?'bg-ink text-on-primary':'text-body hover:bg-surface-soft hover:text-ink'}`}
                >
                  {z}%
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={e=>{e.stopPropagation();setGenMenu(!genMenu);setZoomMenu(false)}}
            title="Generaciones"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-canvas text-[12px] font-semibold text-body shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-surface-soft hover:text-ink"
          >
            ×{maxGen}
          </button>
          {genMenu && (
            <div className="absolute bottom-14 left-0 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(0,0,0,0.08)]" onClick={e=>e.stopPropagation()}>
              {[10,9,8,7,6,5,4,3].map(g=>(
                <button
                  key={g}
                  onClick={()=>{setMaxGen(g);setGenMenu(false)}}
                  className={`block w-full px-4 py-1.5 text-center text-[12px] font-medium transition-colors ${maxGen===g?'bg-ink text-on-primary':'text-body hover:bg-surface-soft hover:text-ink'}`}
                >
                  ×{g}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={()=>setVert(!vert)}
          title={vert?'Horizontal':'Vertical'}
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${
            vert
              ? 'border-ink bg-ink text-on-primary'
              : 'border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4"/>
        </button>
        <button
          onClick={toggleIB}
          title="Salud genética"
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors ${
            showIB
              ? 'border-ink bg-ink text-on-primary'
              : 'border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
          }`}
        >
          <GitBranch className="h-4 w-4"/>
        </button>
      </div>
    </>
  )
}

function Card({n,isRoot,si,rc}:{n:PN;isRoot?:boolean;si:boolean;rc:Map<string,number>}){
  const{onClickDog}=useContext(PedigreeCtx)
  const sc=n.sex==='male'?'#017DFA':'#e84393'
  const reps=rc.get(n.id)||0
  const repC=reps>=2?(RC[Math.min(reps,RC.length-1)]||'#ef4444'):''
  const cls=`group flex items-stretch overflow-hidden rounded-xl border bg-canvas transition-colors hover:bg-surface-soft cursor-pointer relative ${isRoot?'border-ink shadow-[0_0_0_1px_rgba(17,17,17,0.04)]':'border-hairline'}`
  const inner=<>
    <div className="relative flex-shrink-0 bg-surface-card" style={{width:PH}}>
      {n.photo_url
        ? <img src={n.photo_url} alt="" className="h-full w-full object-cover"/>
        : <div className="flex h-full w-full items-center justify-center"><img src="/icon.svg?v=2" alt="" className="h-5 w-5 opacity-20"/></div>
      }
      <div className="absolute right-0 top-0 bottom-0 w-[3px]" style={{backgroundColor:sc}}/>
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden px-2.5 py-1.5">
      <p
        className="whitespace-nowrap text-[12px] font-semibold leading-tight text-ink"
        style={{maskImage:'linear-gradient(to right,black 80%,transparent)',WebkitMaskImage:'linear-gradient(to right,black 80%,transparent)'}}
      >
        {n.name}
      </p>
      {n.breed_name && <p className="mt-0.5 truncate text-[10.5px] text-muted">{n.breed_name}</p>}
    </div>
    {si && reps>=2 && (
      <span
        className="absolute bottom-1 right-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold text-white"
        style={{backgroundColor:repC}}
      >
        {reps}×
      </span>
    )}
  </>
  return onClickDog
    ? <div onClick={()=>onClickDog(n.id)} className={cls} style={{width:CW,height:CH,flexShrink:0}}>{inner}</div>
    : <Link href={`/dogs/${(n as any).slug || n.id}`} className={cls} style={{width:CW,height:CH,flexShrink:0}}>{inner}</Link>
}

/* HORIZONTAL: Use a measured approach - render children, then draw SVG connectors */
function HN({n,nm,g,mx,isRoot,si,rc}:{n:PN;nm:Map<string,PN>;g:number;mx:number;isRoot?:boolean;si:boolean;rc:Map<string,number>}){
  if(g>=mx)return<Card n={n} isRoot={isRoot} si={si} rc={rc}/>
  const f=n.father_id?nm.get(n.father_id):null,m=n.mother_id?nm.get(n.mother_id):null
  if(!(f||m)||g>=mx-1)return<Card n={n} isRoot={isRoot} si={si} rc={rc}/>

  const wrapRef=useRef<HTMLDivElement>(null)
  const fRef=useRef<HTMLDivElement>(null)
  const mRef=useRef<HTMLDivElement>(null)
  const[lines,setLines]=useState<{x1:number;y1:number;x2:number;y2:number}[]>([])
  const hGap=50

  useEffect(()=>{
    if(!wrapRef.current||!fRef.current||!mRef.current)return
    const wr=wrapRef.current.getBoundingClientRect()
    const fr=fRef.current.getBoundingClientRect()
    const mr=mRef.current.getBoundingClientRect()
    // Father midpoint
    const fMidY=fr.top-wr.top+fr.height/2
    // Mother midpoint
    const mMidY=mr.top-wr.top+mr.height/2
    // Card center Y
    const cardMidY=(fMidY+mMidY)/2

    const next=[
      // Horizontal from card to fork
      {x1:CW,y1:cardMidY,x2:CW+hGap,y2:cardMidY},
      // Vertical from father to mother
      {x1:CW+hGap,y1:fMidY,x2:CW+hGap,y2:mMidY},
      // Horizontal stub to father
      {x1:CW+hGap,y1:fMidY,x2:CW+hGap+20,y2:fMidY},
      // Horizontal stub to mother
      {x1:CW+hGap,y1:mMidY,x2:CW+hGap+20,y2:mMidY},
    ]
    // Sin deps el effect corría en cada render → setLines con nuevo array
    // (referencia distinta aunque valores iguales) → re-render → loop infinito
    // que saturaba el main thread y se comía los clicks. Bail-out si nada cambió.
    setLines(prev=>{
      if(prev.length===next.length && prev.every((l,i)=>l.x1===next[i].x1&&l.y1===next[i].y1&&l.x2===next[i].x2&&l.y2===next[i].y2))return prev
      return next
    })
  })

  return(
    <div ref={wrapRef} className="relative flex items-center">
      {/* This card — positioned to center vertically */}
      <div className="absolute" style={{left:0,top:'50%',transform:'translateY(-50%)'}}>
        <Card n={n} isRoot={isRoot} si={si} rc={rc}/>
      </div>
      {/* SVG connectors */}
      <svg className="absolute inset-0 pointer-events-none" style={{overflow:'visible'}}>
        {lines.map((l,i)=><line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={L} strokeWidth={1}/>)}
      </svg>
      {/* Children column */}
      <div style={{marginLeft:CW+hGap+20,display:'flex',flexDirection:'column',gap:30}}>
        <div ref={fRef}>{f?<HN n={f} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<Empty sex="male" parentDogId={n.id}/>}</div>
        <div ref={mRef}>{m?<HN n={m} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<Empty sex="female" parentDogId={n.id}/>}</div>
      </div>
    </div>
  )
}

/* VERTICAL */
function VN({n,nm,g,mx,isRoot,si,rc}:{n:PN;nm:Map<string,PN>;g:number;mx:number;isRoot?:boolean;si:boolean;rc:Map<string,number>}){
  if(g>=mx)return<div className="flex justify-center"><Card n={n} isRoot={isRoot} si={si} rc={rc}/></div>
  const f=n.father_id?nm.get(n.father_id):null,m=n.mother_id?nm.get(n.mother_id):null
  if(!(f||m)||g>=mx-1)return<div className="flex justify-center"><Card n={n} isRoot={isRoot} si={si} rc={rc}/></div>

  const wrapRef=useRef<HTMLDivElement>(null)
  const fRef=useRef<HTMLDivElement>(null)
  const mRef=useRef<HTMLDivElement>(null)
  const[lines,setLines]=useState<{x1:number;y1:number;x2:number;y2:number}[]>([])

  useEffect(()=>{
    if(!wrapRef.current||!fRef.current||!mRef.current)return
    const wr=wrapRef.current.getBoundingClientRect()
    const fr=fRef.current.getBoundingClientRect()
    const mr=mRef.current.getBoundingClientRect()
    const cardCX=wr.width/2
    const forkY=CH+20
    const fCX=fr.left-wr.left+fr.width/2
    const mCX=mr.left-wr.left+mr.width/2
    const childrenTop=fr.top-wr.top

    const next=[
      {x1:cardCX,y1:CH,x2:cardCX,y2:forkY},
      {x1:fCX,y1:forkY,x2:mCX,y2:forkY},
      {x1:fCX,y1:forkY,x2:fCX,y2:childrenTop},
      {x1:mCX,y1:forkY,x2:mCX,y2:childrenTop},
    ]
    // Mismo bug que HN: sin deps + setLines con nuevo array = loop infinito.
    setLines(prev=>{
      if(prev.length===next.length && prev.every((l,i)=>l.x1===next[i].x1&&l.y1===next[i].y1&&l.x2===next[i].x2&&l.y2===next[i].y2))return prev
      return next
    })
  })

  return(
    <div ref={wrapRef} className="relative flex flex-col items-center">
      <Card n={n} isRoot={isRoot} si={si} rc={rc}/>
      <svg className="absolute inset-0 pointer-events-none" style={{overflow:'visible'}}>
        {lines.map((l,i)=><line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={L} strokeWidth={1}/>)}
      </svg>
      <div className="flex gap-10" style={{marginTop:40}}>
        <div ref={fRef}>{f?<VN n={f} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<div className="flex justify-center"><Empty sex="male" parentDogId={n.id}/></div>}</div>
        <div ref={mRef}>{m?<VN n={m} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<div className="flex justify-center"><Empty sex="female" parentDogId={n.id}/></div>}</div>
      </div>
    </div>
  )
}

function Empty({sex,parentDogId}:{sex:string;parentDogId?:string}){
  const{onClickEmpty}=useContext(PedigreeCtx)
  const role=sex==='male'?'father' as const:'mother' as const
  const clickable=!!onClickEmpty&&!!parentDogId
  // Tint sutil según sexo, no chillón
  const tint=sex==='female'?'#f9a8d4':'#93c5fd'
  return (
    <div
      onClick={clickable?()=>onClickEmpty(parentDogId!,role):undefined}
      className={`flex items-center justify-center rounded-xl border-2 border-dashed bg-surface-soft text-muted transition-colors ${clickable?'cursor-pointer hover:bg-surface-card hover:text-ink':''}`}
      style={{width:CW,height:CH,borderColor:tint+'66'}}
    >
      {clickable
        ? <Plus className="h-4 w-4"/>
        : <span className="text-[11px] font-medium">{sex==='male'?'♂':'♀'} desconocido</span>
      }
    </div>
  )
}
