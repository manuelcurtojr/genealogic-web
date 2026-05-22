'use client'

import { useEffect, useRef, useState } from 'react'

export function FadeUp({ children, delay = 0, className = '', as }: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'article'
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = as || 'div'
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisible(true)
        io.disconnect()
      }
    }, { threshold: 0.15 })
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 600ms ease-out, transform 600ms ease-out',
      }}
      className={className}
    >
      {children}
    </Tag>
  )
}
