import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  accentColor: string
}

export default function StatCard({ icon: Icon, label, value, accentColor }: StatCardProps) {
  return (
    <div className="bg-chip border border-hair rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3" style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '15' }}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: accentColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm sm:text-lg font-bold truncate">{value}</p>
        <p className="text-[9px] sm:text-[10px] text-fg-mute truncate">{label}</p>
      </div>
    </div>
  )
}
