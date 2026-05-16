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
  // Cal.com primary: near-black (#111) bg, white text, no hover beyond press
  primary: 'bg-[#111111] text-white hover:bg-[#242424]',
  // White button with hairline outline
  secondary: 'bg-white text-[#111111] border border-hairline hover:bg-surface-card',
  // Text-only link/button
  ghost: 'text-body hover:text-ink hover:bg-surface-card',
  // Brand orange — Genealogic's accent (where Cal uses blue). Reserved for
  // brand-tinted moments, not the default CTA.
  brand: 'bg-ink text-on-primary hover:opacity-90',
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
