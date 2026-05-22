'use client'

import { createContext, useContext } from 'react'

export type EditorPanelsState = {
  leftCollapsed: boolean
  rightCollapsed: boolean
  toggleLeft: () => void
  toggleRight: () => void
}

const noop = () => {}

const EditorPanelsContext = createContext<EditorPanelsState>({
  leftCollapsed: false,
  rightCollapsed: false,
  toggleLeft: noop,
  toggleRight: noop,
})

export const EditorPanelsProvider = EditorPanelsContext.Provider

export function useEditorPanels(): EditorPanelsState {
  return useContext(EditorPanelsContext)
}
