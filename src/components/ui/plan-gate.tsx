'use client'

import { Crown, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getRoleLabel } from '@/lib/permissions'

interface PlanGateProps {
  requiredPlan: 'amateur' | 'pro'
  featureName: string
  featureDescription: string
}

/**
 * Full-page gate shown when user doesn't have the required plan.
 * Use in page components after checking role server-side.
 */
export default function PlanGate({ requiredPlan, featureName, featureDescription }: PlanGateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-full bg-[#D74709]/10 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-[#D74709]/60" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{featureName}</h2>
      <p className="text-sm text-white/40 mb-6">{featureDescription}</p>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 w-full">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-[#D74709]" />
          <div className="text-left">
            <p className="text-sm font-medium text-white">Plan {getRoleLabel(requiredPlan)} o superior</p>
            <p className="text-xs text-white/40">Necesario para acceder a esta función</p>
          </div>
        </div>
      </div>
      <Link
        href="/pricing"
        className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition"
      >
        Ver planes <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
