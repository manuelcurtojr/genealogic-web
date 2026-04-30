import Link from 'next/link'
import { cn } from '@/lib/cn'

interface WordmarkProps {
  /** Tailwind size class. Defaults to 'text-xl'. Pass 'text-2xl', 'text-5xl', etc. */
  size?: string
  /** If true, renders as a Link to '/'. Defaults to true. */
  asLink?: boolean
  href?: string
  className?: string
  onClick?: () => void
}

/**
 * Genealogic wordmark — Fraunces bold, tight tracking, brand consistent.
 * Use everywhere the brand name appears (sidebar, headers, auth, hero...).
 *
 * Sizes guide:
 *   - sidebar / mobile header  → text-xl
 *   - auth pages               → text-2xl
 *   - landing hero             → text-5xl sm:text-6xl md:text-7xl
 */
export function Wordmark({
  size = 'text-xl',
  asLink = true,
  href = '/',
  className,
  onClick,
}: WordmarkProps) {
  const classes = cn(
    'font-display font-bold tracking-[-0.025em] leading-none text-fg select-none',
    size,
    className,
  )

  const inner = <span className={classes}>Genealogic</span>

  if (!asLink) return inner
  return (
    <Link href={href} onClick={onClick} className="inline-flex items-center">
      {inner}
    </Link>
  )
}
