import Link from 'next/link'
import { Check, ArrowRight, Dog, Baby, BarChart3, MessageSquare, GitCompareArrows, Shield, Sparkles, Zap, Globe, Bell } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Genealogic — La plataforma definitiva para criadores de perros',
  description: 'Gestiona tu criadero, genealogías, camadas, clientes y ventas en una sola plataforma. Pedigrees ilimitados, CRM integrado y chat con clientes.',
}

const FEATURES = [
  { icon: Dog, title: 'Genealogías ilimitadas', desc: 'Construye árboles de pedigree completos sin límite de generaciones. La base de datos genealógica más completa.' },
  { icon: Baby, title: 'Gestión de camadas', desc: 'Registra cruces, gestación, nacimientos y seguimiento de cada cachorro. Todo organizado en un solo lugar.' },
  { icon: MessageSquare, title: 'Chat con clientes', desc: 'Recibe solicitudes del formulario y chatea en tiempo real. Sin salir de la plataforma.' },
  { icon: BarChart3, title: 'CRM y pipeline', desc: 'Gestiona tus negocios con pipelines personalizados. Sabe exactamente en qué etapa está cada venta.' },
  { icon: GitCompareArrows, title: 'Planificador de cruces', desc: 'Visualiza el pedigree combinado del padre y la madre antes de cruzar. Toma mejores decisiones.' },
  { icon: Sparkles, title: 'Asistente IA (Genos)', desc: 'Un asistente inteligente que conoce tu criadero, tus perros y te ayuda con cualquier duda.' },
  { icon: Bell, title: 'Push notifications', desc: 'Recibe alertas instantáneas en tu iPhone cuando llega una solicitud, una transferencia o un mensaje.' },
  { icon: Globe, title: 'Perfil público', desc: 'Tu criadero visible para el mundo. Formulario de contacto integrado que genera leads automáticamente.' },
  { icon: Shield, title: 'Veterinario', desc: 'Registros veterinarios, vacunas, desparasitaciones y recordatorios automáticos para cada perro.' },
]

const PLANS = [
  { name: 'Propietario', price: 'Gratis', period: '', desc: 'Para dueños de perros', features: ['Hasta 5 perros', 'Pedigree ilimitado', 'Calendario y veterinario', 'Buscador y favoritos', 'Genos IA'], highlighted: false },
  { name: 'Amateur', price: '7,99€', period: '/mes', desc: 'Para criadores', features: ['Hasta 25 perros', '3 camadas activas', 'Criadero público', 'Chat con clientes', 'Analíticas'], highlighted: true },
  { name: 'Profesional', price: '14,99€', period: '/mes', desc: 'Para criadores pro', features: ['Perros ilimitados', 'Camadas ilimitadas', 'CRM completo', 'Pipeline de ventas', 'Soporte prioritario'], highlighted: false },
]

const PAIN_POINTS = [
  { before: 'Pedigrees en papel o PDF', after: 'Árbol genealógico digital interactivo' },
  { before: 'Excel para gestionar camadas', after: 'Panel de camadas con seguimiento' },
  { before: 'WhatsApp para hablar con clientes', after: 'Chat integrado con historial' },
  { before: 'Perder leads por no contestar', after: 'Solicitudes con notificaciones push' },
  { before: 'No saber cuánto facturas', after: 'Pipeline de ventas con analíticas' },
]

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="Genealogic" className="h-5" />
            <span className="font-semibold text-white/90 hidden sm:inline">Genealogic</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition px-3 py-1.5">Iniciar sesión</Link>
            <Link href="/register" className="text-sm bg-[#D74709] hover:bg-[#c03d07] text-white font-medium px-4 py-2 rounded-lg transition">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D74709]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-[#D74709]" />
            <span className="text-xs text-white/60">Plataforma de crianza canina todo-en-uno</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            La forma moderna de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D74709] to-orange-400">
              gestionar tu criadero
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
            Genealogías, camadas, clientes, ventas y comunicación. Todo lo que necesitas como criador profesional, en una sola plataforma.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-8 py-3.5 rounded-xl text-base transition flex items-center justify-center gap-2">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium px-8 py-3.5 rounded-xl text-base transition text-center">
              Explorar perros
            </Link>
          </div>

          <p className="text-xs text-white/25 mt-4">Sin tarjeta de crédito · Plan gratuito para siempre · 14 días de prueba Pro</p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-white/5 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center">
          <div><p className="text-2xl sm:text-3xl font-bold text-white">970+</p><p className="text-xs text-white/30">Perros registrados</p></div>
          <div><p className="text-2xl sm:text-3xl font-bold text-white">100+</p><p className="text-xs text-white/30">Razas disponibles</p></div>
          <div><p className="text-2xl sm:text-3xl font-bold text-white">5 gen</p><p className="text-xs text-white/30">Profundidad de pedigree</p></div>
          <div><p className="text-2xl sm:text-3xl font-bold text-white">∞</p><p className="text-xs text-white/30">Genealogías ilimitadas</p></div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Deja de perder tiempo con herramientas obsoletas</h2>
            <p className="text-white/40 max-w-xl mx-auto">La mayoría de criadores gestionan su negocio con papel, Excel y WhatsApp. Hay una forma mejor.</p>
          </div>

          <div className="space-y-3">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0">
                <div className="flex-1 bg-red-500/5 border border-red-500/10 rounded-xl sm:rounded-r-none px-5 py-3.5 flex items-center gap-3">
                  <span className="text-red-400/60 text-lg">✕</span>
                  <span className="text-sm text-white/50">{p.before}</span>
                </div>
                <div className="flex-1 bg-green-500/5 border border-green-500/10 rounded-xl sm:rounded-l-none px-5 py-3.5 flex items-center gap-3">
                  <span className="text-green-400 text-lg">✓</span>
                  <span className="text-sm text-white/70 font-medium">{p.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Todo lo que necesitas. Nada que no necesites.</h2>
            <p className="text-white/40 max-w-xl mx-auto">Cada herramienta diseñada específicamente para criadores de perros.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#D74709]/10 flex items-center justify-center mb-4 group-hover:bg-[#D74709]/20 transition">
                  <f.icon className="w-5 h-5 text-[#D74709]" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planes simples, sin sorpresas</h2>
            <p className="text-white/40">Empieza gratis. Mejora cuando lo necesites.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 ${plan.highlighted ? 'bg-[#D74709]/10 border-2 border-[#D74709] relative' : 'bg-white/[0.02] border border-white/5'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D74709] text-white text-xs font-bold px-3 py-1 rounded-full">Popular</div>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-xs text-white/40 mt-1">{plan.desc}</p>
                <div className="mt-4 mb-5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <Link href="/register" className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition ${plan.highlighted ? 'bg-[#D74709] hover:bg-[#c03d07] text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>
                  {plan.price === 'Gratis' ? 'Empezar gratis' : 'Probar 14 días gratis'}
                </Link>
                <div className="mt-5 space-y-2.5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-white/50">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Tu criadero merece una herramienta{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D74709] to-orange-400">profesional</span>
          </h2>
          <p className="text-white/40 text-lg mb-8 max-w-xl mx-auto">
            Únete a los criadores que ya gestionan su negocio con Genealogic. Empieza gratis, sin compromiso.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-8 py-4 rounded-xl text-lg transition">
            Crear cuenta gratis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Genealogic" className="h-4" />
            <span className="text-sm text-white/30">© 2026 Manuel Curtó SL</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/privacy" className="hover:text-white/50 transition">Privacidad</Link>
            <Link href="/terms" className="hover:text-white/50 transition">Términos</Link>
            <Link href="/cookies" className="hover:text-white/50 transition">Cookies</Link>
            <Link href="/legal" className="hover:text-white/50 transition">Aviso Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
