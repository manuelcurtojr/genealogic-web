'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, PawPrint } from 'lucide-react'
import { BRAND } from '@/lib/constants'

const PLANS = [
  {
    name: 'Criador',
    price: { monthly: 0, annual: 0 },
    description: 'Para empezar a gestionar tu criadero',
    features: [
      'Hasta 10 perros',
      'Arbol de pedigri (3 generaciones)',
      'Calendario basico',
      'Cartilla veterinaria',
      '1 criadero',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    name: 'Criador Pro',
    price: { monthly: 10, annual: 8 },
    description: 'Gestion profesional completa',
    features: [
      'Perros ilimitados',
      'Arbol de pedigri (5 generaciones)',
      'Calculador COI',
      'Planificador de cruces',
      'CRM completo (contactos + negocios)',
      'Calendario con vinculacion',
      'Palmares y certificados',
      'Exportar pedigri en PDF',
      'Directorio de criaderos',
      'Perfiles publicos',
      'Soporte prioritario',
    ],
    cta: 'Comenzar prueba gratis',
    highlighted: true,
  },
  {
    name: 'Verificaciones',
    price: { monthly: null, annual: null },
    description: 'Acciones verificables con Genes',
    features: [
      'Verificar propiedad de perros',
      'Certificados de pedigri verificados',
      'Transferencias de propiedad',
      'Usa Genes como moneda virtual',
    ],
    cta: 'Comprar Genes',
    highlighted: false,
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <PawPrint className="w-6 h-6" style={{ color: BRAND.primary }} />
          <span className="font-bold text-lg">Genealogic</span>
        </Link>
        <Link href="/login" className="text-sm text-white/60 hover:text-white transition">
          Iniciar sesion
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Planes y precios</h1>
          <p className="text-white/50 max-w-lg mx-auto">Elige el plan que mejor se adapte a tu criadero</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'text-white' : 'text-white/40'}`}>Mensual</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-12 h-6 rounded-full transition relative ${annual ? 'bg-[#D74709]' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition ${annual ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-white' : 'text-white/40'}`}>
              Anual <span className="text-[#D74709] text-xs font-semibold">-20%</span>
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-4 sm:p-6 ${
                plan.highlighted
                  ? 'bg-[#D74709]/10 border-2 border-[#D74709] relative'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D74709] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Mas popular
                </div>
              )}

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-sm text-white/40 mt-1">{plan.description}</p>

              <div className="mt-4 mb-6">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{annual ? plan.price.annual : plan.price.monthly}</span>
                    <span className="text-white/40">EUR/mes</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-[#D74709]">Variable</div>
                )}
              </div>

              <Link
                href="/register"
                className={`block text-center py-3 rounded-lg text-sm font-semibold transition ${
                  plan.highlighted
                    ? 'bg-[#D74709] hover:bg-[#c03d07] text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#D74709] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/60">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
