import { describe, it, expect } from 'vitest'
import {
  normalizePlan,
  isKennelPro,
  hasProAccess,
  hasPaidPlan,
  isEnterpriseUser,
  effectivePlanFor,
  getPlanLabel,
} from '../../src/lib/permissions'

describe('normalizePlan', () => {
  it('mapea kennel_pro y legacy premium → kennel_pro', () => {
    expect(normalizePlan('kennel_pro')).toBe('kennel_pro')
    expect(normalizePlan('premium')).toBe('kennel_pro')
  })

  it('mapea kennel y legacy pro/starter → kennel', () => {
    expect(normalizePlan('kennel')).toBe('kennel')
    expect(normalizePlan('pro')).toBe('kennel')
    expect(normalizePlan('starter')).toBe('kennel')
  })

  it('null/undefined/desconocido → free', () => {
    expect(normalizePlan(null)).toBe('free')
    expect(normalizePlan(undefined)).toBe('free')
    expect(normalizePlan('')).toBe('free')
    expect(normalizePlan('unknown')).toBe('free')
    expect(normalizePlan('free')).toBe('free')
  })
})

describe('isKennelPro', () => {
  it('true para kennel_pro y legacy premium', () => {
    expect(isKennelPro('kennel_pro')).toBe(true)
    expect(isKennelPro('premium')).toBe(true)
  })

  it('false para legacy pro (que mapea a kennel) y resto', () => {
    expect(isKennelPro('pro')).toBe(false)
    expect(isKennelPro('kennel')).toBe(false)
    expect(isKennelPro('starter')).toBe(false)
    expect(isKennelPro('free')).toBe(false)
    expect(isKennelPro(null)).toBe(false)
  })
})

describe('hasPaidPlan', () => {
  it('true para kennel y kennel_pro', () => {
    expect(hasPaidPlan('kennel')).toBe(true)
    expect(hasPaidPlan('kennel_pro')).toBe(true)
    expect(hasPaidPlan('pro')).toBe(true)
    expect(hasPaidPlan('starter')).toBe(true)
  })

  it('false para free', () => {
    expect(hasPaidPlan('free')).toBe(false)
    expect(hasPaidPlan(null)).toBe(false)
  })
})

describe('hasProAccess', () => {
  it('alias actual de hasPaidPlan: true para CUALQUIER plan de pago', () => {
    // hasProAccess es alias legacy de hasPaidPlan (gating histórico
    // "tras Pro" que ahora se ha bajado al tier Kennel).
    expect(hasProAccess('kennel_pro')).toBe(true)
    expect(hasProAccess('premium')).toBe(true)
    expect(hasProAccess('kennel')).toBe(true)
    expect(hasProAccess('pro')).toBe(true)
    expect(hasProAccess('starter')).toBe(true)
    expect(hasProAccess('free')).toBe(false)
    expect(hasProAccess(null)).toBe(false)
  })
})

describe('isEnterpriseUser', () => {
  it('reconoce el user_id de Irema', () => {
    expect(isEnterpriseUser('89d97ded-1043-4e59-939e-00edecd679b1')).toBe(true)
  })

  it('false para otros users', () => {
    expect(isEnterpriseUser('00000000-0000-0000-0000-000000000000')).toBe(false)
    expect(isEnterpriseUser(null)).toBe(false)
    expect(isEnterpriseUser(undefined)).toBe(false)
    expect(isEnterpriseUser('')).toBe(false)
  })
})

describe('effectivePlanFor', () => {
  it('Irema siempre kennel_pro, ignorando su plan en DB', () => {
    expect(effectivePlanFor('89d97ded-1043-4e59-939e-00edecd679b1', 'free')).toBe('kennel_pro')
    expect(effectivePlanFor('89d97ded-1043-4e59-939e-00edecd679b1', null)).toBe('kennel_pro')
  })

  it('users normales: normaliza su plan', () => {
    // legacy 'pro' = tier inferior → mapea a 'kennel' (no kennel_pro)
    expect(effectivePlanFor('00000000-0000-0000-0000-000000000000', 'pro')).toBe('kennel')
    expect(effectivePlanFor('00000000-0000-0000-0000-000000000000', 'premium')).toBe('kennel_pro')
    expect(effectivePlanFor('00000000-0000-0000-0000-000000000000', 'free')).toBe('free')
    expect(effectivePlanFor(null, 'kennel')).toBe('kennel')
  })
})

describe('getPlanLabel', () => {
  it('labels en español', () => {
    expect(getPlanLabel('kennel_pro')).toBe('Kennel Pro')
    expect(getPlanLabel('kennel')).toBe('Kennel')
    expect(getPlanLabel('free')).toBe('Free')
    // Legacy 'pro' = tier inferior → Kennel (no Kennel Pro)
    expect(getPlanLabel('pro')).toBe('Kennel')
    expect(getPlanLabel('premium')).toBe('Kennel Pro')
  })
})
