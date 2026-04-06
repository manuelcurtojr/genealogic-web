'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowLeftRight, GitBranch, ChevronLeft, ChevronRight, Dna, CheckCircle } from 'lucide-react'
import { calculateCOI, getCOILevel, getCOIInterpretation } from './coi-calculator'

interface PN { id:string;name:string;sex:string;registration:string|null;father_id:string|null;mother_id:string|null;generation:number;photo_url:string|null;breed_name:string|null;color_name:string|null }
interface Props { data:PN[];rootId:string }

function countOcc(nId:string|null,nm:Map<string,PN>,mx:number,g:number,c:Map<string,number>){if(!nId||g>mx)return;const n=nm.get(nId);if(!n)return;c.set(nId,(c.get(nId)||0)+1);countOcc(n.father_id,nm,mx,g+1,c);countOcc(n.mother_id,nm,mx,g+1,c)}
const RC=['','','#3498db','#27ae60','#f39c12','#e74c3c','#9b59b6','#e84393']
const CW=200,CH=64,PH=56 // card width, card height, photo width
const LINE='rgba(255,255,255,0.12)'

export default function PedigreeTree({data,rootId}:Props){
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
  const cc:Record<string,{bg:string;text:string}>={green:{bg:'bg-green-500/15',text:'text-green-400'},orange:{bg:'bg-orange-500/15',text:'text-orange-400'},red:{bg:'bg-red-500/15',text:'text-red-400'}}
  const toggleIB=()=>{setShowIB(s=>!s);setCoiPanel(p=>!p)}
  const close=()=>{setGenMenu(false);setZoomMenu(false)}

  return(
    <div className="relative" onClick={close}>
      <div className="overflow-auto pb-20" style={{transform:`scale(${zoom/100})`,transformOrigin:'top left'}}>
        <div className="min-w-max py-4 px-2">
          {vert?<VN n={root} nm={nm} g={0} mx={maxGen} isRoot si={showIB} rc={rc}/>:<HN n={root} nm={nm} g={0} mx={maxGen} isRoot si={showIB} rc={rc}/>}
        </div>
      </div>
      {/* COI Panel */}
      <div className={`fixed top-[56px] right-0 bottom-0 w-[300px] z-[55] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${coiPanel?'translate-x-0':'translate-x-full'}`}>
        <button onClick={()=>setCoiPanel(!coiPanel)} className="absolute -left-7 top-1/2 -translate-y-1/2 w-7 h-14 bg-gray-900 border border-r-0 border-white/10 rounded-l-lg flex items-center justify-center text-white/40 hover:text-white transition">{coiPanel?<ChevronRight className="w-3.5 h-3.5"/>:<ChevronLeft className="w-3.5 h-3.5"/>}</button>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10"><div className="flex items-center gap-2"><Dna className="w-4 h-4 text-[#D74709]"/><h3 className="text-sm font-semibold">Salud Genetica</h3></div><button onClick={()=>setCoiPanel(false)} className="text-white/40 hover:text-white"><ChevronRight className="w-4 h-4"/></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center"><p className={`text-4xl font-bold ${cc[coiLvl].text}`}>{coi}%</p><p className="text-xs text-white/40 mt-1">Coeficiente de Consanguinidad</p></div>
          <div><div className="h-3 rounded-full overflow-hidden flex"><div className="bg-green-500 flex-1"/><div className="bg-yellow-500 flex-1"/><div className="bg-orange-500 flex-1"/><div className="bg-red-500 flex-1"/></div><div className="relative h-3 -mt-0.5"><div className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-gray-900 -translate-x-1 shadow" style={{left:`${Math.min((coi/25)*100,100)}%`}}/></div><div className="flex justify-between text-[9px] text-white/25 mt-1"><span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span></div></div>
          <div className={`${cc[coiLvl].bg} rounded-lg p-3 flex items-start gap-2`}><CheckCircle className={`w-4 h-4 ${cc[coiLvl].text} mt-0.5 flex-shrink-0`}/><p className={`text-xs ${cc[coiLvl].text}`}>{coiTxt}</p></div>
          <p className="text-[10px] text-white/20 text-center">Calculado con 10 generaciones</p>
        </div>
      </div>
      {/* Buttons */}
      <div className="fixed bottom-[30px] z-30 flex items-center gap-2" style={{left:'calc(var(--sidebar-width, 256px) + 30px)'}}>
        <div className="relative"><button onClick={e=>{e.stopPropagation();setZoomMenu(!zoomMenu);setGenMenu(false)}} className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-white/60 shadow-lg hover:border-white/30 transition"><Search className="w-4 h-4"/></button>{zoomMenu&&<div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden" onClick={e=>e.stopPropagation()}>{[150,130,110,100,90,80,70,60,50].map(z=><button key={z} onClick={()=>{setZoom(z);setZoomMenu(false)}} className={`block w-full px-4 py-1.5 text-xs text-center transition ${zoom===z?'bg-[#D74709] text-white':'text-white/60 hover:bg-white/10'}`}>{z}%</button>)}</div>}</div>
        <div className="relative"><button onClick={e=>{e.stopPropagation();setGenMenu(!genMenu);setZoomMenu(false)}} className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-white/60 shadow-lg hover:border-white/30 font-bold text-xs transition">x{maxGen}</button>{genMenu&&<div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden" onClick={e=>e.stopPropagation()}>{[10,9,8,7,6,5,4,3].map(g=><button key={g} onClick={()=>{setMaxGen(g);setGenMenu(false)}} className={`block w-full px-4 py-1.5 text-xs text-center transition ${maxGen===g?'bg-[#D74709] text-white':'text-white/60 hover:bg-white/10'}`}>x{g}</button>)}</div>}</div>
        <button onClick={()=>setVert(!vert)} className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-lg transition ${vert?'bg-[#D74709] border-[#D74709] text-white':'bg-gray-900 border-white/10 text-white/60 hover:border-white/30'}`}><ArrowLeftRight className="w-4 h-4"/></button>
        <button onClick={toggleIB} className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-lg transition ${showIB?'bg-[#D74709] border-[#D74709] text-white':'bg-gray-900 border-white/10 text-white/60 hover:border-white/30'}`}><GitBranch className="w-4 h-4"/></button>
      </div>
    </div>
  )
}

function Card({n,isRoot,si,rc}:{n:PN;isRoot?:boolean;si:boolean;rc:Map<string,number>}){
  const sc=n.sex==='male'?'#017DFA':'#e84393',reps=rc.get(n.id)||0,repC=reps>=2?(RC[Math.min(reps,RC.length-1)]||'#e74c3c'):''
  return(
    <Link href={`/dogs/${n.id}`} className={`flex items-stretch bg-white/[0.04] border ${isRoot?'border-[#D74709]':'border-white/10'} rounded-xl overflow-hidden hover:bg-white/[0.07] transition relative`} style={{width:CW,height:CH,flexShrink:0}}>
      <div className="flex-shrink-0 bg-white/5 relative" style={{width:PH}}>
        {n.photo_url?<img src={n.photo_url} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-5 h-5 opacity-20"/></div>}
        <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{backgroundColor:sc}}/>
      </div>
      <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center overflow-hidden">
        <p className="text-[12px] font-bold text-white leading-tight whitespace-nowrap" style={{maskImage:'linear-gradient(to right,black 80%,transparent)',WebkitMaskImage:'linear-gradient(to right,black 80%,transparent)'}}>{n.name}</p>
        {n.breed_name&&<p className="text-[10px] text-white/35 truncate mt-0.5">{n.breed_name}</p>}
      </div>
      {si&&reps>=2&&<span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:repC}}>{reps}x</span>}
    </Link>
  )
}

/* --- HORIZONTAL TREE with proper connectors --- */
function HN({n,nm,g,mx,isRoot,si,rc}:{n:PN;nm:Map<string,PN>;g:number;mx:number;isRoot?:boolean;si:boolean;rc:Map<string,number>}){
  if(g>=mx) return <Card n={n} isRoot={isRoot} si={si} rc={rc}/>
  const f=n.father_id?nm.get(n.father_id):null,m=n.mother_id?nm.get(n.mother_id):null
  if(!(f||m)||g>=mx-1) return <Card n={n} isRoot={isRoot} si={si} rc={rc}/>

  // Render: [card] --h_line-- |vertical| --h_line-- [father]
  //                                     --h_line-- [mother]
  const hGap=50,branchW=20,vGap=30 // min 30px between boxes

  return(
    <div className="flex items-center" style={{gap:0}}>
      {/* This node */}
      <Card n={n} isRoot={isRoot} si={si} rc={rc}/>
      {/* Horizontal line from card to fork */}
      <div style={{width:hGap,height:1,background:LINE,flexShrink:0}}/>
      {/* Fork: vertical line + two branches */}
      <div className="flex flex-col" style={{gap:vGap}}>
        {/* Father branch */}
        <div className="flex items-center">
          <div style={{position:'relative'}}>
            {/* Vertical line: from center down to gap center */}
            <div style={{position:'absolute',left:0,top:'50%',width:1,height:`calc(50% + ${vGap/2}px)`,background:LINE}}/>
            {/* Horizontal branch to child */}
            <div style={{width:branchW,height:1,background:LINE}}/>
          </div>
          {f?<HN n={f} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<Empty sex="male"/>}
        </div>
        {/* Mother branch */}
        <div className="flex items-center">
          <div style={{position:'relative'}}>
            {/* Vertical line: from gap center up to center */}
            <div style={{position:'absolute',left:0,bottom:'50%',width:1,height:`calc(50% + ${vGap/2}px)`,background:LINE}}/>
            <div style={{width:branchW,height:1,background:LINE}}/>
          </div>
          {m?<HN n={m} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<Empty sex="female"/>}
        </div>
      </div>
    </div>
  )
}

/* --- VERTICAL TREE with proper connectors --- */
function VN({n,nm,g,mx,isRoot,si,rc}:{n:PN;nm:Map<string,PN>;g:number;mx:number;isRoot?:boolean;si:boolean;rc:Map<string,number>}){
  if(g>=mx) return <div className="flex justify-center"><Card n={n} isRoot={isRoot} si={si} rc={rc}/></div>
  const f=n.father_id?nm.get(n.father_id):null,m=n.mother_id?nm.get(n.mother_id):null
  if(!(f||m)||g>=mx-1) return <div className="flex justify-center"><Card n={n} isRoot={isRoot} si={si} rc={rc}/></div>

  const vLine=40,hGap=40

  return(
    <div className="flex flex-col items-center">
      <Card n={n} isRoot={isRoot} si={si} rc={rc}/>
      {/* Vertical line down */}
      <div style={{width:1,height:vLine,background:LINE}}/>
      {/* Horizontal bar connecting children */}
      <div className="flex" style={{gap:hGap}}>
        <div className="flex flex-col items-center">
          {/* Top connector */}
          <div className="flex">
            <div style={{width:'50%',borderTop:`1px solid ${LINE}`,height:0}}/>
            <div style={{width:'50%'}}/>
          </div>
          <div style={{width:1,height:15,background:LINE}}/>
          {f?<VN n={f} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<Empty sex="male"/>}
        </div>
        <div className="flex flex-col items-center">
          <div className="flex">
            <div style={{width:'50%'}}/>
            <div style={{width:'50%',borderTop:`1px solid ${LINE}`,height:0}}/>
          </div>
          <div style={{width:1,height:15,background:LINE}}/>
          {m?<VN n={m} nm={nm} g={g+1} mx={mx} si={si} rc={rc}/>:<Empty sex="female"/>}
        </div>
      </div>
    </div>
  )
}

function Empty({sex}:{sex:string}){
  const bc=sex==='female'?'border-pink-400/30':'border-blue-400/30'
  return <div className={`w-9 h-9 rounded-full border-2 border-dashed ${bc} flex items-center justify-center text-white/20 text-xs`}>?</div>
}
