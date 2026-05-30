'use client'

import { useEffect } from 'react'
import { recordView, type RecentType } from '@/lib/recent-views'

/**
 * Componente invisible que registra la ficha actual en "vistos recientemente"
 * (localStorage) al montarse. Se incluye en las fichas de perro, criadero y
 * raza. Independiente de PageTracker (analytics) a propósito.
 */
export default function RecordView({
  type,
  itemRef,
  name,
  image,
  subtitle,
}: {
  type: RecentType
  itemRef: string
  name: string
  image?: string | null
  subtitle?: string | null
}) {
  useEffect(() => {
    recordView({ type, ref: itemRef, name, image: image ?? null, subtitle: subtitle ?? null })
  }, [type, itemRef, name, image, subtitle])

  return null
}
