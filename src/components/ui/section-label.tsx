interface SectionLabelProps {
  num: string
  label: string
  className?: string
}

/**
 * Editorial section label — number + horizontal line + uppercase mono text.
 * Used to mark page sections (matches Pawdoq marketing style).
 */
export function SectionLabel({ num, label, className }: SectionLabelProps) {
  return (
    <div
      className={`flex items-center gap-[10px] font-mono text-xs tracking-[1px] text-fg-mute ${className ?? ''}`}
    >
      <span>{num}</span>
      <span className="h-px w-6 bg-hair-strong" />
      <span className="uppercase">{label}</span>
    </div>
  )
}
