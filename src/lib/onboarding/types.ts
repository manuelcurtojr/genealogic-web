/**
 * Tipos compartidos del onboarding (importables desde client).
 * La lógica server vive en `./checklist.ts`.
 */

export type StepImportance = 'required' | 'recommended' | 'optional'

export type OnboardingStep = {
  id: string
  label: string
  description: string
  done: boolean
  href: string
  ctaLabel: string
  icon: string
  importance: StepImportance
}

export type OnboardingStatus = {
  steps: OnboardingStep[]
  completedCount: number
  totalCount: number
  progressPct: number
  requiredComplete: boolean
  allComplete: boolean
}
