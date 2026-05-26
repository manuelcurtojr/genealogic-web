/**
 * Cálculo del estado de onboarding de un criador.
 *
 * Devuelve un array ordenado de pasos con su estado (done/pending), CTA,
 * y nivel de importancia. La UI los pinta como checklist y se muestra
 * mientras haya pasos pendientes y el usuario no haya dismisseado la card.
 *
 * Filosofía:
 *  - Pasos críticos (importance='required') = 5-6 max. Demasiados abruman.
 *  - Cada paso se completa SOLO con una acción real del user (no auto-fakeada).
 *  - Pasos relacionados con features Pro se ocultan si el user no tiene Pro.
 *  - Una vez todos los 'required' están done, la card se considera completa.
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { OnboardingStep, OnboardingStatus, StepImportance } from './types'

export type { OnboardingStep, OnboardingStatus, StepImportance }

// IDs de pasos puramente B2B (web pública, formulario, emailbot, knowledge
// base). En el WebView iOS no se muestran porque exponen flujos pricing/CRM
// que disparan Guideline 3.1.1 de App Store.
const IOS_HIDDEN_STEP_IDS = new Set([
  'public_web',
  'contact_form',
  'knowledge_base',
  'activate_bot',
])

export async function getOnboardingStatus(args: {
  kennelId: string
  userId: string
  isPro: boolean
  isIos?: boolean
}): Promise<OnboardingStatus> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // 1) Cargar todo en paralelo — solo counts y flags, no rows completos
  const [
    kennelRes,
    dogsCountRes,
    dogsPhotoCountRes,
    webPagesRes,
    knowledgeCountRes,
    formConfigRes,
    emailbotConfigRes,
  ] = await Promise.all([
    admin.from('kennels')
      .select('id, logo_url, description, custom_domain, contact_form_config')
      .eq('id', args.kennelId).maybeSingle(),
    admin.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', args.kennelId),
    admin.from('dogs').select('id', { count: 'exact', head: true })
      .eq('kennel_id', args.kennelId).not('thumbnail_url', 'is', null),
    admin.from('kennel_pages').select('id', { count: 'exact', head: true })
      .eq('kennel_id', args.kennelId).eq('enabled', true),
    admin.from('knowledge_entries').select('id', { count: 'exact', head: true })
      .eq('kennel_id', args.kennelId).eq('is_active', true),
    admin.from('kennels').select('contact_form_config')
      .eq('id', args.kennelId).maybeSingle(),
    admin.from('emailbot_config').select('is_enabled')
      .eq('kennel_id', args.kennelId).maybeSingle(),
  ])

  const kennel = kennelRes.data
  const dogsCount = dogsCountRes.count || 0
  const dogsWithPhotoCount = dogsPhotoCountRes.count || 0
  const webPagesCount = webPagesRes.count || 0
  const knowledgeCount = knowledgeCountRes.count || 0
  const hasFormConfig =
    formConfigRes.data?.contact_form_config &&
    Object.keys(formConfigRes.data.contact_form_config).length > 0
  const botEnabled = !!emailbotConfigRes.data?.is_enabled

  // 2) Definir pasos. Orden importa — primero los más críticos.
  const steps: OnboardingStep[] = [
    {
      id: 'kennel_brand',
      label: 'Personaliza tu criadero',
      description: 'Sube tu logo y escribe una descripción breve. Es lo primero que ve un visitante.',
      done: !!(kennel?.logo_url && kennel?.description),
      href: '/kennel',
      ctaLabel: 'Editar marca',
      icon: 'Sparkles',
      importance: 'required',
    },
    {
      id: 'first_dog',
      label: 'Añade tu primer perro',
      description: 'Crea la ficha de uno de tus reproductores con foto, raza y datos básicos.',
      done: dogsCount > 0,
      href: '/dogs',
      ctaLabel: 'Crear perro',
      icon: 'Dog',
      importance: 'required',
    },
    {
      id: 'dog_with_photo',
      label: 'Sube al menos una foto',
      description: 'Las fichas con foto convierten 5x mejor — los visitantes confían más.',
      done: dogsWithPhotoCount > 0,
      href: '/dogs',
      ctaLabel: 'Añadir foto',
      icon: 'Image',
      importance: 'required',
    },
    {
      id: 'public_web',
      label: 'Activa tu web pública',
      description: 'Una página simple con tu logo, raza, perros disponibles y formulario de contacto.',
      done: webPagesCount > 0,
      href: '/web',
      ctaLabel: 'Configurar web',
      icon: 'Globe',
      importance: 'required',
    },
    {
      id: 'contact_form',
      label: 'Configura el formulario de contacto',
      description: 'Define qué preguntas reciben los interesados. Llegan directos a tu pipeline de reservas.',
      done: !!hasFormConfig,
      href: '/kennel',
      ctaLabel: 'Personalizar form',
      icon: 'Inbox',
      importance: 'recommended',
    },
  ]

  // Pasos Pro: solo se muestran si el plan los incluye
  if (args.isPro) {
    steps.push({
      id: 'knowledge_base',
      label: 'Carga la biblioteca del bot',
      description: 'El emailbot responde a leads usando lo que tú le digas. Mínimo 5 entradas (precio, política, garantía).',
      done: knowledgeCount >= 3,
      href: '/conocimiento',
      ctaLabel: 'Añadir conocimiento',
      icon: 'BookOpen',
      importance: 'recommended',
    })
    steps.push({
      id: 'activate_bot',
      label: 'Activa el Emailbot',
      description: 'Responde automáticamente a leads en segundos. Solo se activa cuando tu biblioteca tiene info útil.',
      done: botEnabled,
      href: '/emailbot',
      ctaLabel: 'Activar bot',
      icon: 'Mail',
      importance: 'optional',
    })
  }

  // 3) Filtro iOS: ocultar pasos que llevan a rutas B2B (web/form/bot/kb).
  const visibleSteps = args.isIos
    ? steps.filter((s) => !IOS_HIDDEN_STEP_IDS.has(s.id))
    : steps

  // 4) Métricas agregadas
  const considered = visibleSteps.filter((s) => s.importance !== 'optional')
  const consideredDone = considered.filter((s) => s.done).length
  const progressPct = considered.length === 0
    ? 100
    : Math.round((consideredDone / considered.length) * 100)
  const requiredComplete = visibleSteps
    .filter((s) => s.importance === 'required')
    .every((s) => s.done)
  const allComplete = visibleSteps.every((s) => s.done)

  return {
    steps: visibleSteps,
    completedCount: consideredDone,
    totalCount: considered.length,
    progressPct,
    requiredComplete,
    allComplete,
  }
}
