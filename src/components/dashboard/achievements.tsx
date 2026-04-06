'use client'

import { useState } from 'react'
import { Achievement } from '@/lib/achievements'
import {
  PawPrint, Dog, Crown, Castle, Home, GitBranch, TreePine, Baby,
  Medal, Star, Camera, Compass, Flame, Zap, HeartPulse, Trophy,
  Gem, UserCheck, Handshake, HeartHandshake, X, Lock, Check,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  PawPrint, Dog, Crown, Castle, Home, GitBranch, TreePine, Baby,
  Medal, Star, Camera, Compass, Flame, Zap, HeartPulse, Trophy,
  Gem, UserCheck, Handshake, HeartHandshake,
}

interface Props {
  achievements: Achievement[]
}

export default function Achievements({ achievements }: Props) {
  const [selected, setSelected] = useState<Achievement | null>(null)
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Logros</h2>
        <span className="text-xs text-white/40">{unlockedCount}/{achievements.length} desbloqueados</span>
      </div>

      {/* Horizontal scrolling grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {achievements.map(a => {
          const Icon = ICON_MAP[a.icon] || PawPrint
          return (
            <button
              key={a.key}
              onClick={() => setSelected(a)}
              className={`flex-shrink-0 w-[90px] h-[90px] rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 group relative
                ${a.unlocked
                  ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:-translate-y-1 hover:shadow-lg'
                  : 'border-white/5 bg-white/[0.02] opacity-40 hover:opacity-60'
                }`}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: a.unlocked
                    ? `linear-gradient(135deg, ${a.color}, ${darkenColor(a.color, 0.3)})`
                    : 'rgba(255,255,255,0.05)',
                }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: a.unlocked ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              </div>
              {/* Label */}
              <span className={`text-[9px] font-bold uppercase tracking-wider leading-tight text-center max-w-[78px] truncate ${a.unlocked ? 'text-white/70' : 'text-white/25'}`}>
                {a.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Modal */}
      {selected && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-white/30 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 text-center">
              {/* Large icon */}
              <div
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{
                  background: selected.unlocked
                    ? `linear-gradient(135deg, ${selected.color}, ${darkenColor(selected.color, 0.35)})`
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: selected.unlocked ? `0 8px 30px ${selected.color}33` : 'none',
                }}
              >
                {(() => {
                  const Icon = ICON_MAP[selected.icon] || PawPrint
                  return <Icon className="w-8 h-8" style={{ color: selected.unlocked ? '#fff' : 'rgba(255,255,255,0.2)' }} />
                })()}
              </div>
              {/* Title */}
              <h3 className="text-xl font-extrabold mb-2">{selected.title}</h3>
              {/* Description */}
              <p className="text-sm text-white/50 leading-relaxed mb-5">{selected.desc}</p>
              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold ${
                  selected.unlocked
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-white/5 text-white/30'
                }`}
              >
                {selected.unlocked ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {selected.unlocked ? 'Logro desbloqueado' : 'Logro bloqueado'}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function darkenColor(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount)))
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount)))
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
