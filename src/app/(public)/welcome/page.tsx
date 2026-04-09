'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, ChevronRight, Sparkles, Zap, Star } from 'lucide-react'

// Pedigree demo data
const PEDIGREE_DEMO = {
  name: 'Congo de Irema Curtó', sex: 'male', breed: 'Presa Canario',
  father: {
    name: 'Mito de Irema Curtó', sex: 'male',
    father: { name: 'Drako del Toscón', sex: 'male' },
    mother: { name: 'Dayra de Irema Curtó', sex: 'female' },
  },
  mother: {
    name: 'Nala de Irema Curtó', sex: 'female',
    father: { name: 'Tigre de Guayonge', sex: 'male' },
    mother: { name: 'Fiera de Irema Curtó', sex: 'female' },
  },
}

const FEATURES = [
  { emoji: '🧬', title: 'Genealogías ilimitadas', desc: 'Árboles de pedigree completos sin límite. La base de datos más completa.' },
  { emoji: '🐾', title: 'Gestión de camadas', desc: 'Cruces, gestación, nacimientos y seguimiento de cachorros.' },
  { emoji: '💬', title: 'Chat en tiempo real', desc: 'Comunícate con tus clientes directamente desde la plataforma.' },
  { emoji: '📊', title: 'CRM y pipeline', desc: 'Gestiona ventas con pipelines personalizados y analíticas.' },
  { emoji: '🔬', title: 'Planificador de cruces', desc: 'Visualiza el pedigree combinado antes de cruzar.' },
  { emoji: '✨', title: 'Asistente IA', desc: 'Genos conoce tu criadero y te ayuda con cualquier duda.' },
]

const PLANS = [
  { name: 'Propietario', price: 'Gratis', period: '', desc: 'Para dueños de perros', features: ['Hasta 5 perros', 'Pedigree ilimitado', 'Calendario y veterinario', 'Buscador y favoritos', 'Genos IA'], highlighted: false },
  { name: 'Amateur', price: '7,99€', period: '/mes', desc: 'Para criadores', features: ['Hasta 25 perros', '3 camadas activas', 'Criadero público', 'Chat con clientes', 'Analíticas básicas'], highlighted: true },
  { name: 'Profesional', price: '14,99€', period: '/mes', desc: 'Para criadores pro', features: ['Perros ilimitados', 'Camadas ilimitadas', 'CRM completo', 'Pipeline de ventas', 'Soporte prioritario'], highlighted: false },
]

const TESTIMONIALS = [
  { name: 'Irema Curtó', role: 'Criador de Presa Canario', text: 'Por fin una plataforma que entiende lo que necesita un criador. Gestiono más de 150 perros sin perder el control.' },
  { name: 'Elena Díaz', role: 'Propietaria', text: 'Me encanta poder ver el pedigree completo de mi perro y tener todos sus datos veterinarios en un solo sitio.' },
  { name: 'Carlos Méndez', role: 'Criador de Pastor Alemán', text: 'El CRM me ha ayudado a no perder ni un solo cliente. Antes se me escapaban solicitudes por WhatsApp.' },
]

function PedigreeNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const color = node.sex === 'male' ? 'border-blue-500/30 bg-blue-500/5' : 'border-pink-500/30 bg-pink-500/5'
  const textColor = node.sex === 'male' ? 'text-blue-400' : 'text-pink-400'
  const dotColor = node.sex === 'male' ? 'bg-blue-400' : 'bg-pink-400'

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 ${color} backdrop-blur-sm min-w-[100px] sm:min-w-[140px]`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
          <span className={`text-[10px] sm:text-xs font-medium ${textColor} truncate`}>{node.name}</span>
        </div>
      </div>
      {(node.father || node.mother) && (
        <div className="flex flex-col gap-1">
          {node.father && <PedigreeNode node={node.father} depth={depth + 1} />}
          {node.mother && <PedigreeNode node={node.mother} depth={depth + 1} />}
        </div>
      )}
    </div>
  )
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 2000
        const steps = 60
        const increment = target / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, duration / steps)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">

      {/* Nebula backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#D74709]/8 rounded-full blur-[200px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[30%] right-[-15%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-[200px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[60%] right-[30%] w-[400px] h-[400px] bg-[#D74709]/5 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '15s' }} />

        {/* Stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute w-[1px] h-[1px] bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${2 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 3}s`,
            }} />
        ))}
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Genealogic" className="h-5" />
            <span className="font-semibold text-white/90 hidden sm:inline text-sm">Genealogic</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="#pricing" className="text-sm text-white/40 hover:text-white transition px-3 py-1.5 hidden sm:inline">Precios</Link>
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition px-3 py-1.5">Entrar</Link>
            <Link href="/register" className="text-sm bg-white/10 hover:bg-white/15 backdrop-blur text-white font-medium px-4 py-2 rounded-full transition border border-white/10">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4">
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/50">+970 perros registrados y creciendo</span>
          </div>

          <h1 className="text-[2.5rem] sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Gestiona tu criadero{' '}
            <br className="hidden sm:block" />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D74709] via-orange-400 to-amber-300">
                como un profesional
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="url(#grad)" strokeWidth="2.5" strokeLinecap="round" />
                <defs><linearGradient id="grad"><stop stopColor="#D74709" /><stop offset="1" stopColor="#F59E0B" /></linearGradient></defs>
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/35 max-w-2xl mx-auto mb-10 leading-relaxed">
            Genealogías, camadas, clientes, ventas y comunicación.
            <br className="hidden sm:block" />
            Todo en una sola plataforma diseñada para criadores.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link href="/register" className="group w-full sm:w-auto bg-gradient-to-r from-[#D74709] to-[#c03d07] hover:from-[#c03d07] hover:to-[#a83506] text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-[#D74709]/20 flex items-center justify-center gap-2">
              Empezar gratis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/" className="w-full sm:w-auto bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white/60 font-medium px-8 py-4 rounded-2xl text-base transition text-center backdrop-blur-sm">
              Explorar perros →
            </Link>
          </div>
          <p className="text-[11px] text-white/20">Sin tarjeta de crédito · Plan gratuito para siempre · 14 días de prueba</p>
        </div>

        {/* Pedigree demo */}
        <div className="relative max-w-4xl mx-auto mt-16 sm:mt-20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D74709]/10 via-purple-500/5 to-blue-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-3xl p-4 sm:p-8 backdrop-blur-sm overflow-x-auto">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-2 h-2 rounded-full bg-[#D74709]" />
              <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Ejemplo de genealogía</span>
            </div>
            <div className="flex justify-center min-w-[500px]">
              <PedigreeNode node={PEDIGREE_DEMO} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { n: 970, suffix: '+', label: 'Perros' },
            { n: 107, suffix: '+', label: 'Razas' },
            { n: 14, suffix: '', label: 'Criaderos' },
            { n: 100, suffix: '%', label: 'Gratis para empezar' },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-bold text-white"><AnimatedCounter target={s.n} suffix={s.suffix} /></p>
              <p className="text-xs text-white/30 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain points */}
      <section className="relative py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D74709]/70 font-medium">El problema</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-3 mb-4">Deja de perder tiempo</h2>
            <p className="text-white/30 max-w-lg mx-auto">La mayoría de criadores gestionan su negocio con herramientas que no están hechas para ellos.</p>
          </div>

          <div className="space-y-2">
            {[
              ['Pedigrees en papel o PDF', 'Árbol genealógico digital interactivo'],
              ['Excel para gestionar camadas', 'Panel de camadas con seguimiento'],
              ['WhatsApp para hablar con clientes', 'Chat integrado con historial completo'],
              ['Perder leads por no contestar', 'Solicitudes con push notifications'],
              ['No saber cuánto facturas', 'Pipeline de ventas con analíticas'],
            ].map(([before, after], i) => (
              <div key={i} className="group flex flex-col sm:flex-row items-stretch rounded-xl overflow-hidden hover:scale-[1.01] transition-transform">
                <div className="flex-1 bg-red-500/[0.04] border border-red-500/10 sm:border-r-0 sm:rounded-r-none rounded-xl sm:rounded-l-xl px-5 py-3.5 flex items-center gap-3">
                  <span className="text-red-400/40 text-sm">✕</span>
                  <span className="text-sm text-white/40 line-through decoration-white/10">{before}</span>
                </div>
                <div className="flex-1 bg-emerald-500/[0.04] border border-emerald-500/10 sm:border-l-0 sm:rounded-l-none rounded-xl sm:rounded-r-xl px-5 py-3.5 flex items-center gap-3">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-sm text-white/60 font-medium">{after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D74709]/70 font-medium">Funcionalidades</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-3 mb-4">Todo lo que necesitas</h2>
            <p className="text-white/30 max-w-lg mx-auto">Cada herramienta diseñada específicamente para criadores de perros.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-6 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D74709]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <span className="text-2xl mb-4 block">{f.emoji}</span>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D74709]/70 font-medium">Testimonios</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-3 mb-4">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#D74709]/15 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#D74709]">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{t.name}</p>
                    <p className="text-[11px] text-white/25">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-[#D74709]/70 font-medium">Precios</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-3 mb-4">Simple y transparente</h2>
            <p className="text-white/30">Empieza gratis. Mejora cuando lo necesites.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-[#D74709]/15 to-[#D74709]/5 border-2 border-[#D74709]/40 relative shadow-lg shadow-[#D74709]/10'
                  : 'bg-white/[0.02] border border-white/[0.06]'
              }`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D74709] to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    Popular
                  </div>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-xs text-white/30 mt-1">{plan.desc}</p>
                <div className="mt-4 mb-5">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-white/30 text-sm">{plan.period}</span>
                </div>
                <Link href="/register" className={`block text-center py-3 rounded-xl text-sm font-semibold transition ${
                  plan.highlighted
                    ? 'bg-[#D74709] hover:bg-[#c03d07] text-white shadow-lg shadow-[#D74709]/20'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60 border border-white/[0.06]'
                }`}>
                  {plan.price === 'Gratis' ? 'Empezar gratis' : 'Probar 14 días gratis'}
                </Link>
                <div className="mt-5 space-y-2.5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400/70 flex-shrink-0" />
                      <span className="text-sm text-white/40">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative py-24 sm:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-t from-[#D74709]/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#D74709]/10 border border-[#D74709]/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D74709]" />
            <span className="text-xs text-[#D74709]/80">Registro en 30 segundos</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">
            Tu criadero merece{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D74709] via-orange-400 to-amber-300">
              herramientas profesionales
            </span>
          </h2>
          <p className="text-white/30 text-lg mb-10 max-w-xl mx-auto">
            Únete a los criadores que ya gestionan su negocio con Genealogic.
          </p>
          <Link href="/register" className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#D74709] to-[#c03d07] text-white font-semibold px-10 py-4.5 rounded-2xl text-lg transition-all shadow-xl shadow-[#D74709]/25 hover:shadow-[#D74709]/40 hover:scale-105">
            Crear cuenta gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.04] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Genealogic" className="h-4 opacity-40" />
            <span className="text-xs text-white/20">© 2026 Manuel Curtó SL</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-white/15">
            <Link href="/privacy" className="hover:text-white/40 transition">Privacidad</Link>
            <Link href="/terms" className="hover:text-white/40 transition">Términos</Link>
            <Link href="/cookies" className="hover:text-white/40 transition">Cookies</Link>
            <Link href="/legal" className="hover:text-white/40 transition">Aviso Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
