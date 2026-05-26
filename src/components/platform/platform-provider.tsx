'use client'

import { createContext, useContext, type ReactNode } from 'react'

type PlatformContextValue = {
  isIos: boolean
}

const PlatformContext = createContext<PlatformContextValue>({ isIos: false })

export function PlatformProvider({
  isIos,
  children,
}: {
  isIos: boolean
  children: ReactNode
}) {
  return (
    <PlatformContext.Provider value={{ isIos }}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform(): PlatformContextValue {
  return useContext(PlatformContext)
}
