'use client'

interface ToggleProps {
  value: boolean
  onChange: (v: boolean) => void
  color?: string
  className?: string
}

export default function Toggle({ value, onChange, color = 'bg-[#D74709]', className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`w-[44px] h-[24px] rounded-full transition-colors relative flex-shrink-0 ${value ? color : 'bg-white/20'} ${className}`}
      style={{ minWidth: 44 }}
    >
      <div
        className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${value ? 'left-[23px]' : 'left-[3px]'}`}
      />
    </button>
  )
}
