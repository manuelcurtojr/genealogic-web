import { Wordmark } from './wordmark'

/**
 * Backward-compat wrapper around <Wordmark>.
 * Existing callers pass `className="h-6"` etc. — we map height to text size.
 */
export default function Logo({ className = 'h-6' }: { className?: string }) {
  // Heuristic: h-5 → text-lg, h-6 → text-xl, h-8 → text-2xl, h-10 → text-3xl
  const sizeMap: Record<string, string> = {
    'h-4': 'text-base',
    'h-5': 'text-lg',
    'h-6': 'text-xl',
    'h-7': 'text-xl',
    'h-8': 'text-2xl',
    'h-9': 'text-2xl',
    'h-10': 'text-3xl',
    'h-12': 'text-4xl',
  }
  const heightClass = className.split(' ').find((c) => c.startsWith('h-')) || 'h-6'
  const size = sizeMap[heightClass] || 'text-xl'
  return <Wordmark size={size} asLink={false} />
}
