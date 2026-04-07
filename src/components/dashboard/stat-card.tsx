import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  accentColor: string
}

export default function StatCard({ icon: Icon, label, value, accentColor }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3" style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '15' }}>
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
      </div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-white/40">{label}</p>
      </div>
    </div>
  )
}
