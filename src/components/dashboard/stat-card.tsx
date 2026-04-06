import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  accentColor: string
}

export default function StatCard({ icon: Icon, label, value, accentColor }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4" style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}>
      <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '20' }}>
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/40 font-medium">{label}</p>
      </div>
    </div>
  )
}
