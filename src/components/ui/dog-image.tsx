'use client'

import Image from 'next/image'
import { Dog as DogIcon } from 'lucide-react'
import { useState } from 'react'

interface DogImageProps {
  src: string | null | undefined
  alt: string
  /** Width in CSS pixels (used to pick the optimized variant). */
  width: number
  /** Height in CSS pixels. */
  height: number
  /** Tailwind classes for the wrapper. */
  className?: string
  /** Tailwind classes for the image element. */
  imgClassName?: string
  /** Optional sizes attribute for responsive layout. */
  sizes?: string
  /** Above-the-fold images (hero, first card) → true. */
  priority?: boolean
  /** Fill the parent container. width/height are ignored if true. */
  fill?: boolean
  /** Object-fit on the image. Defaults to 'cover'. */
  fit?: 'cover' | 'contain'
}

/**
 * Drop-in dog photo with:
 *   - Next.js Image Optimization (WebP/AVIF, responsive sizes, CDN cache)
 *   - Graceful fallback (paw icon) when src is missing or returns an error
 *   - Built-in skeleton background while loading
 *
 * Use everywhere instead of <img>.
 */
export function DogImage({
  src,
  alt,
  width,
  height,
  className,
  imgClassName,
  sizes,
  priority,
  fill,
  fit = 'cover',
}: DogImageProps) {
  const [errored, setErrored] = useState(false)
  const showFallback = !src || errored

  const wrapper = `relative overflow-hidden bg-surface-card ${className ?? ''}`
  const objectFit = fit === 'contain' ? 'object-contain' : 'object-cover'

  if (showFallback) {
    return (
      <div
        className={`${wrapper} flex items-center justify-center`}
        style={fill ? undefined : { width, height }}
      >
        <DogIcon className="h-1/2 w-1/2 max-h-12 max-w-12 text-muted opacity-40" />
      </div>
    )
  }

  return (
    <div className={wrapper} style={fill ? undefined : { width, height }}>
      <Image
        src={src as string}
        alt={alt}
        {...(fill
          ? { fill: true }
          : { width, height })}
        sizes={sizes ?? (fill ? '100vw' : `${width}px`)}
        priority={priority}
        onError={() => setErrored(true)}
        className={`${objectFit} ${imgClassName ?? ''}`}
      />
    </div>
  )
}
