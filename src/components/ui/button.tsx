import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'brand'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none'

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-[15px]',
}

const variants: Record<Variant, string> = {
  // Pawdoq primary: paper (inverse of surface) — white in dark, near-black in light
  primary: 'bg-paper-50 text-ink-900 hover:opacity-90',
  // Outlined neutral
  secondary: 'border border-hair-strong text-fg hover:border-paper-50/40 hover:bg-chip',
  // Subtle text-only
  ghost: 'text-fg-dim hover:text-fg hover:bg-chip',
  // Brand orange (Genealogic's accent — used for "Registrarse", urgent CTAs)
  brand: 'bg-[#D74709] text-white hover:bg-[#c03d07]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  type = 'button',
  disabled,
  onClick,
  children,
  className,
  target,
  rel,
}: ButtonProps) {
  const classes = cn(base, sizes[size], variants[variant], className)
  if (href && !disabled) {
    return (
      <Link href={href} className={classes} target={target} rel={rel} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  )
}
