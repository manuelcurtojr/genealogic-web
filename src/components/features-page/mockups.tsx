/**
 * Mockups: mini-versiones del UI real de Genealogic.
 *
 * Cada mockup es un componente que renderiza una réplica simplificada
 * pero fiel del producto, usando los mismos tokens de diseño (canvas,
 * hairline, ink, etc.). No son screenshots — son HTML/CSS reales.
 *
 * Ventajas vs screenshots:
 *   · No se desactualizan si cambia el UI real (visualmente parecido,
 *     no idéntico — eso es OK).
 *   · Se ven nítidos en cualquier pantalla / DPI.
 *   · Dark mode / theming heredado del sitio.
 *   · Sin coste de imagen pesada.
 *
 * Cada mockup vive en su propia función exportada. El componente
 * `<Mockup slug=... />` despacha al correcto.
 */
import {
  Search, Calendar, Check, CreditCard, Dna,
  Database, Globe2, Upload, Stethoscope,
  Plus, Camera, Edit3, Clock, Dog as DogIcon,
  ArrowRightLeft, Trophy, Activity, TrendingUp,
} from 'lucide-react'

interface MockupProps {
  slug: string
}

/**
 * Wrapper común — frame con borde, shadow y header de "ventana" estilo
 * macOS. Hace que cualquier mockup interno parezca un screenshot real
 * del producto.
 */
function MockupFrame({
  children,
  topBar,
}: {
  children: React.ReactNode
  topBar?: string
}) {
  return (
    <div className="relative rounded-2xl border border-hairline bg-canvas shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] overflow-hidden">
      {/* Top bar tipo browser/macOS */}
      <div className="flex items-center gap-2 border-b border-hairline bg-surface-soft px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        {topBar && (
          <div className="flex-1 mx-3 px-2 py-0.5 rounded text-[10px] text-muted bg-canvas border border-hairline truncate">
            {topBar}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── 1. Pipeline kanban ─────────────────────────────────────────────────
function PipelineKanban() {
  const cols = [
    { label: 'Interesados', color: '#94a3b8', count: 7, cards: [
      { name: 'María G.', dog: 'Hembra Presa', stage: 'Email' },
      { name: 'Antonio R.', dog: 'Macho cachorro', stage: 'Web' },
    ]},
    { label: 'Pre-seña', color: '#fb923c', count: 3, cards: [
      { name: 'Lucía F.', dog: 'Camada Mayo', stage: 'WhatsApp' },
    ]},
    { label: 'Seña pagada', color: '#3b82f6', count: 4, cards: [
      { name: 'Carlos M.', dog: 'Camada Abril #3', stage: '300€' },
      { name: 'Sara H.', dog: 'Camada Abril #1', stage: '300€' },
    ]},
    { label: 'Contrato', color: '#8b5cf6', count: 2, cards: [
      { name: 'Pedro B.', dog: 'Macho Mayo', stage: 'Firmado' },
    ]},
    { label: 'Pagado', color: '#10b981', count: 1, cards: [] },
  ]
  return (
    <MockupFrame topBar="genealogic.io/reservas">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-semibold text-ink">Reservas</p>
          <span className="text-[10px] text-muted">17 activas · Irema Curtó</span>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {cols.map(c => (
            <div key={c.label} className="flex-1 min-w-0 rounded-lg border border-hairline bg-canvas">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-hairline">
                <span className="text-[9px] font-bold uppercase tracking-wider text-ink">{c.label}</span>
                <span className="text-[9px] text-muted tabular-nums">{c.count}</span>
              </div>
              <div className="p-1.5 space-y-1.5 min-h-[120px]">
                {c.cards.map((card, i) => (
                  <div key={i} className="rounded border border-hairline bg-surface-soft p-1.5">
                    <p className="text-[9.5px] font-semibold text-ink truncate">{card.name}</p>
                    <p className="text-[8.5px] text-body truncate">{card.dog}</p>
                    <span className="inline-block mt-1 text-[8px] text-muted">{card.stage}</span>
                  </div>
                ))}
                {c.cards.length === 0 && (
                  <div className="text-[8.5px] text-muted/60 text-center py-2">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 2. Contract editor ─────────────────────────────────────────────────
function ContractEditor() {
  return (
    <MockupFrame topBar="genealogic.io/contratos/compraventa">
      <div className="grid grid-cols-2 divide-x divide-hairline">
        {/* Editor */}
        <div className="p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">Editor</p>
          <pre className="text-[9.5px] text-ink leading-snug font-mono whitespace-pre-wrap">
{`# Contrato compraventa

**Comprador:** {{clientName}}
**DNI:** {{clientId}}

**Cachorro:**
- Nombre: {{dogName}}
- Raza: {{breed}}
- Microchip: {{microchip}}

**Precio:** {{totalPrice}}
**Señal:** {{depositAmount}}

...`}
          </pre>
        </div>
        {/* Preview */}
        <div className="p-3 bg-surface-soft/50">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">Vista previa</p>
          <div className="space-y-1 text-[9.5px] text-ink leading-snug">
            <p className="font-bold text-[11px]">Contrato compraventa</p>
            <p><span className="font-semibold">Comprador:</span> María G. López</p>
            <p><span className="font-semibold">DNI:</span> 12345678X</p>
            <p className="font-semibold mt-1">Cachorro:</p>
            <ul className="text-[9px] pl-2">
              <li>· Nombre: Xenia de Irema Curtó</li>
              <li>· Raza: Presa Canario</li>
              <li>· Microchip: 941…3287</li>
            </ul>
            <p><span className="font-semibold">Precio:</span> 1.200 €</p>
            <p><span className="font-semibold">Señal:</span> 300 €</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-hairline px-3 py-2 bg-surface-soft">
        <span className="text-[9px] text-muted">Variables: 14 disponibles</span>
        <div className="flex gap-1.5">
          <span className="text-[9px] px-2 py-0.5 rounded border border-hairline text-body">Guardar</span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-ink text-on-primary font-semibold">Usar en reserva</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 3. Payments timeline ───────────────────────────────────────────────
function PaymentsTimeline() {
  const payments = [
    { label: 'Señal', amount: '300 €', date: '15 Mar', status: 'paid' },
    { label: 'Pago parcial', amount: '450 €', date: '15 Abr', status: 'paid' },
    { label: 'Entrega', amount: '450 €', date: '5 May', status: 'pending' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/reservas/abc123/pagos">
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-[12px] font-semibold text-ink">Calendario de pagos</p>
            <p className="text-[10px] text-muted">María G. · Xenia Camada Abril #3</p>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">2 de 3 cobrados</span>
        </div>
        <div className="space-y-2">
          {payments.map((p, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas px-3 py-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {p.status === 'paid' ? <Check className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-ink">{p.label}</p>
                <p className="text-[9.5px] text-muted">Vence {p.date}</p>
              </div>
              <span className="text-[12px] font-semibold tabular-nums text-ink">{p.amount}</span>
              {p.status === 'pending' && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-ink text-on-primary font-semibold">Cobrar</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between">
          <span className="text-[10px] text-muted">Total acordado</span>
          <span className="text-[14px] font-bold tabular-nums text-ink">1.200 €</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 4. Kennel web ──────────────────────────────────────────────────────
function KennelWeb() {
  return (
    <MockupFrame topBar="iremacurto.com">
      <div className="relative bg-gradient-to-br from-orange-50 via-canvas to-blue-50 px-4 pt-3 pb-4">
        {/* Header del kennel */}
        <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-ink text-white text-[8px] font-bold flex items-center justify-center">IC</div>
            <span className="text-[10px] font-bold text-ink">Irema Curtó</span>
          </div>
          <nav className="flex gap-2 text-[8.5px] text-body">
            <span>Sobre</span>
            <span>Perros</span>
            <span>Galería</span>
            <span>Blog</span>
            <span className="text-ink font-semibold">Contacto</span>
          </nav>
        </div>
        {/* Hero del kennel */}
        <div className="mb-3">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-[#FE6620]">Criadero · desde 1975</p>
          <p className="text-[14px] font-bold text-ink leading-tight mt-0.5">Presa Canario · 50 años</p>
          <p className="text-[9px] text-body mt-1 leading-snug">Te contamos una historia de creación, preservación y defensa de una raza que marcaría un antes y un después en los perros funcionales.</p>
          <div className="flex gap-1.5 mt-2">
            <span className="text-[8.5px] px-2 py-0.5 rounded bg-ink text-on-primary font-semibold">Pedir info</span>
            <span className="text-[8.5px] px-2 py-0.5 rounded border border-hairline text-body">Ver perros</span>
          </div>
        </div>
        {/* Mini chips trayectoria */}
        <div className="grid grid-cols-3 gap-1.5 text-[8px]">
          <div className="rounded border border-hairline bg-canvas px-1.5 py-1">
            <p className="text-muted">Años</p>
            <p className="font-bold text-ink">50+</p>
          </div>
          <div className="rounded border border-hairline bg-canvas px-1.5 py-1">
            <p className="text-muted">Perros</p>
            <p className="font-bold text-ink">443</p>
          </div>
          <div className="rounded border border-hairline bg-canvas px-1.5 py-1">
            <p className="text-muted">Hitos</p>
            <p className="font-bold text-ink">13</p>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 5. Blog list ───────────────────────────────────────────────────────
function BlogList() {
  const posts = [
    { title: 'El verdadero origen del nombre Canarias', date: '8 Abr', mins: 6 },
    { title: 'Por qué las hembras importan más en la cría', date: '2 Abr', mins: 4 },
    { title: 'Cómo distinguir un Presa Canario auténtico', date: '24 Mar', mins: 7 },
  ]
  return (
    <MockupFrame topBar="iremacurto.com/blog">
      <div className="p-4">
        <p className="text-[8px] font-semibold uppercase tracking-wider text-[#FE6620] mb-1">Blog</p>
        <p className="text-[13px] font-bold text-ink mb-3">Últimas notas</p>
        <div className="space-y-1.5">
          {posts.map((p, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-hairline bg-canvas p-2">
              <div className="h-10 w-14 rounded bg-gradient-to-br from-orange-100 to-blue-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-ink truncate">{p.title}</p>
                <p className="text-[8.5px] text-muted">{p.date} · {p.mins} min lectura</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 6. Pedigree tree ───────────────────────────────────────────────────
function PedigreeTreeMockup() {
  return (
    <MockupFrame topBar="genealogic.io/dogs/xian-de-irema-curto">
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[12px] font-semibold text-ink">Genealogía</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">COI 4.2%</span>
            <span className="text-[9px] text-muted">5 gen</span>
          </div>
        </div>
        {/* Mini árbol — 3 columnas de cajas */}
        <div className="grid grid-cols-3 gap-2">
          {/* Gen 0 */}
          <div className="flex items-center">
            <div className="rounded border-2 border-blue-300 bg-canvas px-2 py-1.5 w-full">
              <p className="text-[8.5px] font-bold text-ink truncate">Xían</p>
              <p className="text-[7.5px] text-muted">Macho · 2019</p>
            </div>
          </div>
          {/* Gen 1: padre + madre */}
          <div className="space-y-1.5">
            <div className="rounded border border-blue-300 bg-canvas px-2 py-1">
              <p className="text-[8px] font-bold text-blue-700 truncate">Toby II</p>
              <p className="text-[7px] text-muted">♂</p>
            </div>
            <div className="rounded border border-pink-300 bg-canvas px-2 py-1">
              <p className="text-[8px] font-bold text-pink-700 truncate">Anita</p>
              <p className="text-[7px] text-muted">♀</p>
            </div>
          </div>
          {/* Gen 2: 4 abuelos */}
          <div className="space-y-1">
            <div className="rounded border border-blue-200 bg-canvas px-1.5 py-0.5">
              <p className="text-[7.5px] text-blue-600 truncate">Boby</p>
            </div>
            <div className="rounded border border-pink-200 bg-canvas px-1.5 py-0.5">
              <p className="text-[7.5px] text-pink-600 truncate">Piba</p>
            </div>
            <div className="rounded border border-blue-200 bg-canvas px-1.5 py-0.5">
              <p className="text-[7.5px] text-blue-600 truncate">Toby I</p>
            </div>
            <div className="rounded border border-pink-200 bg-canvas px-1.5 py-0.5">
              <p className="text-[7.5px] text-pink-600 truncate">Gey</p>
            </div>
          </div>
        </div>
        {/* COI bar */}
        <div className="mt-4">
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="flex-1 bg-emerald-400" />
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-rose-400" />
          </div>
          <div className="flex justify-between text-[7px] text-muted mt-1">
            <span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 7. Dogs grid ───────────────────────────────────────────────────────
function DogsGrid() {
  const dogs = [
    { name: 'Xían', sex: '♂', breed: 'Presa', tag: 'Reproductor' },
    { name: 'Anita', sex: '♀', breed: 'Presa', tag: 'En cría' },
    { name: 'Xita II', sex: '♀', breed: 'Presa', tag: 'En venta' },
    { name: 'Yaco', sex: '♂', breed: 'Presa', tag: 'Reproductor' },
    { name: 'Zeus', sex: '♂', breed: 'Presa', tag: '' },
    { name: 'Yula', sex: '♀', breed: 'Presa', tag: 'En cría' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/dogs">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center flex-1 rounded border border-hairline bg-canvas px-2 py-1">
            <Search className="h-3 w-3 text-muted" />
            <span className="text-[9px] text-muted ml-1.5">Buscar perros…</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-hairline text-body">♂ ♀</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-hairline text-body">Raza</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {dogs.map((d, i) => (
            <div key={i} className="rounded-lg border border-hairline bg-canvas overflow-hidden">
              <div className={`aspect-[4/3] ${d.sex === '♂' ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 'bg-gradient-to-br from-pink-100 to-pink-50'} flex items-center justify-center text-[20px] ${d.sex === '♂' ? 'text-blue-400' : 'text-pink-400'}`}>
                {d.sex}
              </div>
              <div className="p-1.5">
                <p className="text-[9.5px] font-semibold text-ink truncate">{d.name}</p>
                <p className="text-[8.5px] text-muted truncate">{d.breed}</p>
                {d.tag && (
                  <span className={`mt-1 inline-block text-[7.5px] px-1.5 py-0.5 rounded-full font-semibold ${
                    d.tag === 'En venta' ? 'bg-emerald-50 text-emerald-700' :
                    d.tag === 'Reproductor' ? 'bg-pink-50 text-pink-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{d.tag}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 8. Breeding simulator ──────────────────────────────────────────────
function BreedingSimulator() {
  return (
    <MockupFrame topBar="genealogic.io/cruces">
      <div className="p-4">
        <p className="text-[12px] font-semibold text-ink mb-3">Simulador de cruces</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border-2 border-blue-300 bg-blue-50/50 p-2 text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-blue-700 mb-1">♂ Padre</p>
            <p className="text-[10px] font-bold text-ink">Xían</p>
            <p className="text-[8px] text-muted">Presa · 2019</p>
          </div>
          <div className="rounded-lg border-2 border-pink-300 bg-pink-50/50 p-2 text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-pink-700 mb-1">♀ Madre</p>
            <p className="text-[10px] font-bold text-ink">Yula</p>
            <p className="text-[8px] text-muted">Presa · 2020</p>
          </div>
        </div>
        {/* Resultado */}
        <div className="rounded-lg border border-hairline bg-surface-soft p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted uppercase tracking-wider">COI proyectado</span>
            <span className="text-[14px] font-bold tabular-nums text-emerald-700">3.1%</span>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted">Color probable</span>
            <span className="text-ink font-medium">Bardino / atigrado</span>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted">Camadas estimadas</span>
            <span className="text-ink font-medium">6–9 cachorros</span>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted">Riesgo genético</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="h-3 w-3" /> Bajo
            </span>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 9. Bot conversation ────────────────────────────────────────────────
function BotConversation() {
  return (
    <MockupFrame topBar="genealogic.io/emailbot">
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">👤</div>
          <div className="flex-1 rounded-lg rounded-tl-none bg-surface-soft p-2">
            <p className="text-[9.5px] text-ink">Hola, ¿tenéis cachorros de Presa Canario para junio?</p>
            <p className="text-[8px] text-muted mt-1">10:23 AM · de Lucía F.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-6 rounded-full bg-ink flex items-center justify-center text-[8px] text-on-primary font-bold">🤖</div>
          <div className="flex-1 rounded-lg rounded-tl-none border border-hairline bg-canvas p-2">
            <p className="text-[9.5px] text-ink">¡Hola Lucía! Sí, tenemos la camada de Mayo que estará lista para entrega a principios de junio. Son hijos de Xían × Yula, con genealogía completa y revisión veterinaria. Puedes ver disponibilidad aquí: iremacurto.com/perros</p>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[8px] text-muted">10:23 AM · Emailbot</p>
              <span className="text-[7.5px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                <Check className="h-2 w-2" /> Auto
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">👤</div>
          <div className="flex-1 rounded-lg rounded-tl-none bg-surface-soft p-2">
            <p className="text-[9.5px] text-ink">¿Y puedo visitar el criadero antes de reservar?</p>
            <p className="text-[8px] text-muted mt-1">10:24 AM</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
          <span className="text-[9px] text-amber-800 font-semibold">⚠ Escalado a humano:</span>
          <span className="text-[9px] text-amber-800">Requiere agenda</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 10. Newsletter composer ────────────────────────────────────────────
function NewsletterComposer() {
  return (
    <MockupFrame topBar="genealogic.io/newsletter/new">
      <div className="grid grid-cols-[1fr_140px]">
        <div className="p-4">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-muted">Para 248 suscriptores</p>
          <p className="text-[13px] font-bold text-ink mt-1">📢 Camada de Mayo disponible</p>
          <div className="mt-3 space-y-1.5 text-[9.5px] text-body">
            <p>Hola {'{{nombre}}'},</p>
            <p>Os escribo para contaros que la <strong>camada de Mayo</strong> (Xían × Yula) ya está reservando. 6 cachorros disponibles para entrega a principios de junio.</p>
            <p className="text-muted text-[8.5px]">📷 [imagen camada]</p>
            <p>Si os interesa, contestadme a este email o reservad directamente desde la web.</p>
            <p className="mt-2 text-[9px]">Un abrazo,<br/>Manuel</p>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[9px] px-2 py-1 rounded bg-ink text-on-primary font-semibold">Enviar ahora</span>
            <span className="text-[9px] px-2 py-1 rounded border border-hairline text-body">Programar</span>
            <span className="text-[9px] px-2 py-1 rounded border border-hairline text-body">Vista previa</span>
          </div>
        </div>
        <div className="border-l border-hairline bg-surface-soft p-3 space-y-2">
          <div>
            <p className="text-[7.5px] text-muted">Última campaña</p>
            <p className="text-[10px] font-bold text-ink">68% apertura</p>
          </div>
          <div>
            <p className="text-[7.5px] text-muted">Media</p>
            <p className="text-[10px] font-bold text-ink">42% apertura</p>
          </div>
          <div>
            <p className="text-[7.5px] text-muted">Plantilla</p>
            <p className="text-[9px] font-semibold text-ink">📦 Nueva camada</p>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 11. Stats dashboard ────────────────────────────────────────────────
function StatsDashboard() {
  return (
    <MockupFrame topBar="genealogic.io/estadisticas">
      <div className="p-4">
        <p className="text-[12px] font-semibold text-ink mb-3">Tu kennel · últimos 30 días</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Visitas', value: '1.247', up: '+18%' },
            { label: 'Únicas', value: '892', up: '+12%' },
            { label: 'Solicitudes', value: '23', up: '+45%' },
            { label: 'Reservas', value: '7', up: '+2' },
          ].map((k, i) => (
            <div key={i} className="rounded border border-hairline bg-canvas p-2">
              <p className="text-[7.5px] text-muted uppercase tracking-wider">{k.label}</p>
              <p className="text-[14px] font-bold tabular-nums text-ink mt-1">{k.value}</p>
              <p className="text-[7.5px] text-emerald-600 font-semibold">{k.up}</p>
            </div>
          ))}
        </div>
        {/* Mini gráfica de barras */}
        <div className="rounded border border-hairline bg-canvas p-3">
          <p className="text-[8.5px] font-semibold text-muted uppercase tracking-wider mb-2">Visitas por día</p>
          <div className="flex items-end gap-0.5 h-16">
            {[40, 65, 50, 80, 70, 90, 75, 55, 88, 95, 70, 85, 92, 78].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-[#FE6620] to-[#fbbf24] rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        {/* Top referrers */}
        <div className="mt-2 rounded border border-hairline bg-canvas p-3">
          <p className="text-[8.5px] font-semibold text-muted uppercase tracking-wider mb-1.5">Top referrers</p>
          <div className="space-y-0.5 text-[9px]">
            <div className="flex justify-between"><span>google.com</span><span className="tabular-nums font-semibold">423</span></div>
            <div className="flex justify-between"><span>instagram.com</span><span className="tabular-nums font-semibold">187</span></div>
            <div className="flex justify-between"><span>(directo)</span><span className="tabular-nums font-semibold">156</span></div>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 12. Public directory — 250k+ perros indexados ────────────────────
function PublicDirectory() {
  const dogs = [
    { name: 'Achille Boris di Casa', breed: 'Cane Corso', loc: 'IT', sex: '♂' },
    { name: 'Bara de Gran Reserva', breed: 'Presa Canario', loc: 'ES', sex: '♀' },
    { name: 'Chango del Sol Naciente', breed: 'Dogo Argentino', loc: 'AR', sex: '♂' },
    { name: 'Diva van der Heide', breed: 'Bouvier', loc: 'NL', sex: '♀' },
    { name: 'Elia di San Mauro', breed: 'Galgo Italiano', loc: 'IT', sex: '♀' },
    { name: 'Falcón de Tenerife', breed: 'Presa Canario', loc: 'ES', sex: '♂' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/search?q=presa+canario">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#FE6620]" />
            <p className="text-[12px] font-semibold text-ink">Directorio internacional</p>
          </div>
          <span className="text-[9.5px] text-muted tabular-nums">257.788 perros · 180+ razas</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center flex-1 rounded border border-hairline bg-canvas px-2 py-1">
            <Search className="h-3 w-3 text-muted" />
            <span className="text-[9.5px] text-ink ml-1.5 font-medium">presa canario</span>
          </div>
          <span className="text-[8.5px] px-1.5 py-0.5 rounded border border-hairline text-body">Raza</span>
          <span className="text-[8.5px] px-1.5 py-0.5 rounded border border-hairline text-body">País</span>
          <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-ink text-on-primary font-semibold">Con foto</span>
        </div>
        <div className="space-y-1.5">
          {dogs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-hairline bg-canvas px-2 py-1.5">
              <div className={`h-8 w-8 rounded ${d.sex === '♂' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-400' : 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-400'} flex items-center justify-center text-[12px]`}>{d.sex}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-ink truncate">{d.name}</p>
                <p className="text-[8.5px] text-muted truncate">{d.breed} · {d.loc}</p>
              </div>
              <Globe2 className="h-3 w-3 text-muted" />
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <span className="text-[8.5px] text-muted">Mostrando 6 de 12.481 · página 1 de 2.080</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 13. Pedigree importer ────────────────────────────────────────────
function PedigreeImporter() {
  return (
    <MockupFrame topBar="genealogic.io/dogs/import">
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Upload className="h-3.5 w-3.5 text-[#FE6620]" />
          <p className="text-[12px] font-semibold text-ink">Importar genealogía</p>
        </div>
        <div className="rounded-lg border-2 border-dashed border-hairline bg-surface-soft p-3 mb-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1">URL de origen</p>
          <p className="text-[10px] text-ink font-mono truncate">https://www.dogsfiles.com/.../xian-de-irema-curto</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Dogsfiles ✓</span>
            <span className="text-[8px] text-muted">soportado · 10+ sitios</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { step: 'Scrapeando ficha del perro', done: true },
            { step: 'Extrayendo padres y abuelos (4 gen)', done: true },
            { step: 'Descargando fotos (12)', done: true },
            { step: 'Importando palmarés (3 títulos)', done: true },
            { step: 'Self-verify con LLM', done: true },
            { step: 'De-duplicación con ancestros existentes…', done: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[9.5px]">
              {s.done ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <div className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              )}
              <span className={s.done ? 'text-ink' : 'text-body font-medium'}>{s.step}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between">
          <span className="text-[9px] text-muted">Tiempo restante: ~8s</span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-ink text-on-primary font-semibold">Cancelar</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 14. Audit history — histórico de cambios por perro ──────────────
function AuditHistory() {
  const events = [
    { when: '14:23', who: 'Manuel C.', what: 'Subió una nueva foto', icon: Camera, color: '#3b82f6' },
    { when: '14:18', who: 'Manuel C.', what: 'Actualizó peso de 32.1 a 33.4 kg', icon: Edit3, color: '#6366f1' },
    { when: '09:02', who: 'Irema C.', what: 'Añadió vacuna: Polivalente anual', icon: Stethoscope, color: '#06b6d4' },
    { when: 'Ayer 18:40', who: 'Manuel C.', what: 'Transfirió la propiedad', icon: ArrowRightLeft, color: '#f59e0b' },
    { when: '12 Mar 11:00', who: 'Manuel C.', what: 'Creó el perro "Xían de Irema Curtó"', icon: DogIcon, color: '#10b981' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/dogs/xian/edit · Histórico">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#FE6620]" />
            <p className="text-[12px] font-semibold text-ink">Histórico de cambios</p>
          </div>
          <span className="text-[9px] text-muted">128 eventos</span>
        </div>
        <div className="space-y-2 pl-4 border-l-2 border-hairline">
          {events.map((e, i) => {
            const Icon = e.icon
            return (
              <div key={i} className="relative">
                <div
                  className="absolute -left-[21px] top-0.5 h-4 w-4 rounded-full flex items-center justify-center border-2 border-canvas"
                  style={{ backgroundColor: e.color }}
                >
                  <Icon className="h-2 w-2 text-white" />
                </div>
                <div className="rounded border border-hairline bg-canvas px-2 py-1.5">
                  <p className="text-[10px] text-ink">{e.what}</p>
                  <p className="text-[8.5px] text-muted mt-0.5">
                    <span className="font-semibold">{e.who}</span> · {e.when}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 15. Pedigree PDF ─────────────────────────────────────────────────
function PedigreePdfMockup() {
  return (
    <MockupFrame topBar="genealogic.io/dogs/xian/pedigree.pdf">
      <div className="p-4 bg-gradient-to-br from-amber-50/40 to-canvas">
        {/* Marca del kennel */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-ink">
          <div>
            <p className="text-[10px] font-bold text-ink tracking-wide">CRIADERO IREMA CURTÓ</p>
            <p className="text-[8px] text-muted">Genealogía · La Esperanza, Tenerife</p>
          </div>
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        {/* Datos del perro */}
        <div className="text-center mb-3">
          <p className="text-[8px] font-semibold uppercase tracking-wider text-muted">PRESA CANARIO · MACHO</p>
          <p className="text-[14px] font-bold text-ink italic">Xían de Irema Curtó</p>
          <p className="text-[8.5px] text-body">LOE 2019/12345 · Microchip 941…3287</p>
        </div>
        {/* Mini pedigree 3 gen */}
        <div className="grid grid-cols-3 gap-1.5 text-[8px]">
          <div className="rounded border border-amber-300 bg-canvas p-1.5">
            <p className="font-bold text-ink truncate">Xían</p>
            <p className="text-muted">2019</p>
          </div>
          <div className="space-y-1">
            <div className="rounded border border-blue-300 bg-canvas px-1.5 py-1">
              <p className="font-bold text-blue-700 truncate">Toby II</p>
            </div>
            <div className="rounded border border-pink-300 bg-canvas px-1.5 py-1">
              <p className="font-bold text-pink-700 truncate">Anita</p>
            </div>
          </div>
          <div className="space-y-0.5 text-[7.5px]">
            <div className="rounded border border-blue-200 bg-canvas px-1 py-0.5"><p className="text-blue-600 truncate">Boby</p></div>
            <div className="rounded border border-pink-200 bg-canvas px-1 py-0.5"><p className="text-pink-600 truncate">Piba</p></div>
            <div className="rounded border border-blue-200 bg-canvas px-1 py-0.5"><p className="text-blue-600 truncate">Toby I</p></div>
            <div className="rounded border border-pink-200 bg-canvas px-1 py-0.5"><p className="text-pink-600 truncate">Gey</p></div>
          </div>
        </div>
        {/* Pie: marca del criadero + nota de documento digital */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[7.5px] text-muted">Genealogía · 4 generaciones</p>
            <p className="text-[8px] font-bold text-ink italic">Criadero Manuel Curtó</p>
          </div>
          <p className="text-[7px] text-muted max-w-[40%] text-right leading-tight">
            Documento digital · no sustituye al pedigree oficial del club
          </p>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 16. Reproduction Gantt — celos, montas, partos ──────────────────
function ReproductionGantt() {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago']
  const females = [
    { name: 'Yula', events: [{ start: 0, span: 1, type: 'celo' }, { start: 1, span: 2, type: 'gestacion' }, { start: 3, span: 1, type: 'parto' }] },
    { name: 'Anita', events: [{ start: 2, span: 1, type: 'celo' }, { start: 3, span: 2, type: 'gestacion' }, { start: 5, span: 1, type: 'parto' }] },
    { name: 'Pipa', events: [{ start: 4, span: 1, type: 'celo' }, { start: 5, span: 2, type: 'gestacion' }, { start: 7, span: 1, type: 'parto' }] },
  ]
  const colorOf = (t: string) => t === 'celo' ? 'bg-pink-300' : t === 'gestacion' ? 'bg-amber-300' : 'bg-emerald-400'
  return (
    <MockupFrame topBar="genealogic.io/reproduccion">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#FE6620]" />
            <p className="text-[12px] font-semibold text-ink">Calendario reproductivo · 2026</p>
          </div>
          <div className="flex items-center gap-1.5 text-[8px]">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-300" />celo</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-300" />gestación</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />parto</span>
          </div>
        </div>
        {/* Header de meses */}
        <div className="grid grid-cols-[70px_repeat(8,1fr)] gap-0.5 mb-1">
          <span />
          {months.map(m => (
            <span key={m} className="text-[8px] text-muted text-center font-semibold">{m}</span>
          ))}
        </div>
        {/* Filas */}
        {females.map(f => (
          <div key={f.name} className="grid grid-cols-[70px_repeat(8,1fr)] gap-0.5 mb-1.5 items-center">
            <span className="text-[9px] font-semibold text-ink">♀ {f.name}</span>
            {months.map((_, i) => {
              const evt = f.events.find(e => i >= e.start && i < e.start + e.span)
              return (
                <div key={i} className="h-4 rounded bg-surface-soft relative overflow-hidden">
                  {evt && i === evt.start && (
                    <div className={`absolute inset-y-0 left-0 ${colorOf(evt.type)} rounded`} style={{ width: `${evt.span * 100}%` }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div className="mt-3 pt-2 border-t border-hairline flex items-center justify-between text-[8.5px] text-muted">
          <span>3 partos previstos · 24 cachorros estimados</span>
          <span>Próximo: Yula · 8 Abr</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 17. Litter detail ───────────────────────────────────────────────
function LitterDetail() {
  const puppies = [
    { name: 'Bermudo', sex: '♂', tag: 'Reservado' },
    { name: 'Báltico', sex: '♂', tag: 'Disponible' },
    { name: 'Bárbara', sex: '♀', tag: 'Reservado' },
    { name: 'Bera', sex: '♀', tag: 'Disponible' },
    { name: 'Brisa', sex: '♀', tag: 'Entregado' },
    { name: 'Bruno', sex: '♂', tag: 'Disponible' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/litters/camada-mayo-2026">
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-[#FE6620]">CAMADA · MAYO 2026</p>
            <p className="text-[13px] font-bold text-ink mt-0.5">Xían × Yula</p>
            <p className="text-[9px] text-body">6 cachorros · 8 semanas · entrega 5 Jul</p>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">3 disponibles</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {puppies.map(p => (
            <div key={p.name} className="rounded border border-hairline bg-canvas overflow-hidden">
              <div className={`aspect-square ${p.sex === '♂' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-400' : 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-400'} flex items-center justify-center text-[18px]`}>
                {p.sex}
              </div>
              <div className="p-1">
                <p className="text-[9px] font-semibold text-ink truncate">{p.name}</p>
                <span className={`text-[7.5px] px-1 rounded font-semibold ${
                  p.tag === 'Disponible' ? 'bg-emerald-50 text-emerald-700' :
                  p.tag === 'Reservado' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{p.tag}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-[9px] px-2 py-1 rounded bg-ink text-on-primary font-semibold inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Añadir cachorro
          </span>
          <span className="text-[9px] px-2 py-1 rounded border border-hairline text-body">Newsletter camada (12 suscritos)</span>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 18. Vet records — cartilla veterinaria digital ──────────────────
function VetRecords() {
  const records = [
    { type: 'vaccine', name: 'Polivalente anual', date: '12 Mar', next: '12 Mar 2027', color: 'emerald' },
    { type: 'deworming', name: 'Milpro 12.5mg', date: '5 Mar', next: '5 Jun', color: 'blue' },
    { type: 'test', name: 'Displasia cadera (OFA)', date: '14 Feb', next: null, color: 'violet' },
    { type: 'treatment', name: 'Otitis externa derecha', date: '20 Ene', next: null, color: 'amber' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/dogs/xian/salud">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-[#FE6620]" />
            <p className="text-[12px] font-semibold text-ink">Cartilla veterinaria</p>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-ink text-on-primary font-semibold inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Añadir
          </span>
        </div>
        <div className="space-y-1.5">
          {records.map((r, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-hairline bg-canvas px-2 py-2">
              <div className={`h-7 w-7 rounded bg-${r.color}-50 text-${r.color}-700 flex items-center justify-center`}>
                <Stethoscope className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-ink truncate">{r.name}</p>
                <p className="text-[8.5px] text-muted">{r.date} · {r.type}</p>
              </div>
              {r.next && (
                <span className="text-[8.5px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold whitespace-nowrap">
                  ⏰ {r.next}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-hairline text-[8.5px] text-muted">
          Próximo recordatorio: Milpro en 13 días
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 19. Genotypes ───────────────────────────────────────────────────
function Genotypes() {
  const loci = [
    { locus: 'E (Extension)', value: 'E/E', meaning: 'No mascarilla negra', risk: false },
    { locus: 'B (Brown)', value: 'B/b', meaning: 'Portador marrón', risk: false },
    { locus: 'K (Dominant black)', value: 'kbr/ky', meaning: 'Atigrado (bardino)', risk: false },
    { locus: 'D (Dilute)', value: 'D/D', meaning: 'Color pleno', risk: false },
  ]
  const tests = [
    { name: 'DM (Mielopatía degenerativa)', result: 'Clear', lab: 'Embark', ok: true },
    { name: 'Displasia codo (OFA)', result: 'Normal', lab: 'OFA', ok: true },
    { name: 'PLL (Luxación cristalino)', result: 'Carrier', lab: 'Optimal', ok: false },
  ]
  return (
    <MockupFrame topBar="genealogic.io/dogs/xian/genetica">
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Dna className="h-3.5 w-3.5 text-[#FE6620]" />
          <p className="text-[12px] font-semibold text-ink">Genotipos y pruebas</p>
        </div>
        <p className="text-[8.5px] font-semibold uppercase tracking-wider text-muted mb-1.5">Color (loci)</p>
        <div className="space-y-1 mb-3">
          {loci.map((l, i) => (
            <div key={i} className="flex items-center justify-between rounded border border-hairline bg-canvas px-2 py-1.5">
              <span className="text-[9.5px] text-ink">{l.locus}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-bold tabular-nums text-ink font-mono">{l.value}</span>
                <span className="text-[8.5px] text-muted">{l.meaning}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[8.5px] font-semibold uppercase tracking-wider text-muted mb-1.5">Pruebas raciales</p>
        <div className="space-y-1">
          {tests.map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-hairline bg-canvas px-2 py-1.5">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center ${t.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {t.ok ? <Check className="h-2.5 w-2.5" /> : '!'}
              </div>
              <span className="flex-1 text-[9.5px] text-ink truncate">{t.name}</span>
              <span className={`text-[8.5px] font-semibold ${t.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{t.result}</span>
              <span className="text-[8px] text-muted">{t.lab}</span>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── 20. Reservations table — el pipeline moderno (no kanban) ────────
function ReservationsTable() {
  const rows = [
    { client: 'María G. López', dog: 'Xenia · Camada Abril #3', state: 'Seña', value: '300€', when: 'hace 2h', stateColor: 'blue' },
    { client: 'Carlos M.', dog: 'Macho · Camada Mayo', state: 'Contrato', value: '1.200€', when: 'hace 6h', stateColor: 'violet' },
    { client: 'Sara H.', dog: 'Hembra · Camada Abril #1', state: 'Seña', value: '300€', when: 'ayer', stateColor: 'blue' },
    { client: 'Pedro B.', dog: 'Macho · Camada Mayo', state: 'Entrega', value: '1.200€', when: 'ayer', stateColor: 'emerald' },
    { client: 'Lucía F.', dog: 'Camada Mayo (info)', state: 'Evaluando', value: '—', when: '2 días', stateColor: 'amber' },
    { client: 'Antonio R.', dog: 'Cachorro futuro', state: 'Nueva', value: '—', when: '3 días', stateColor: 'slate' },
  ]
  return (
    <MockupFrame topBar="genealogic.io/reservas">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-ink">Reservas · 17 activas</p>
          <div className="flex items-center gap-1">
            <span className="text-[8.5px] px-2 py-0.5 rounded bg-ink text-on-primary font-semibold">Activas</span>
            <span className="text-[8.5px] px-2 py-0.5 rounded border border-hairline text-body">Cerradas (143)</span>
          </div>
        </div>
        {/* Tabs por estado */}
        <div className="flex items-center gap-2 mb-2 border-b border-hairline pb-1.5 overflow-hidden">
          {['Todas', 'Nueva', 'Evaluando', 'Seña', 'Contrato', 'Entrega'].map((t, i) => (
            <span key={t} className={`text-[8.5px] whitespace-nowrap ${i === 0 ? 'text-ink font-bold border-b-2 border-ink pb-1' : 'text-muted'}`}>
              {t} <span className="text-muted tabular-nums">{['17', '2', '4', '5', '4', '2'][i]}</span>
            </span>
          ))}
        </div>
        {/* Tabla densa */}
        <table className="w-full text-[9px]">
          <thead>
            <tr className="text-muted text-left font-semibold uppercase tracking-wider">
              <th className="py-1">Cliente</th>
              <th className="py-1">Perro</th>
              <th className="py-1">Estado</th>
              <th className="py-1 text-right">Valor</th>
              <th className="py-1 text-right">Últ.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-hairline hover:bg-surface-soft">
                <td className="py-1.5 font-semibold text-ink">{r.client}</td>
                <td className="py-1.5 text-body truncate max-w-[80px]">{r.dog}</td>
                <td className="py-1.5">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-${r.stateColor}-50 text-${r.stateColor}-700`}>
                    {r.state}
                  </span>
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-ink">{r.value}</td>
                <td className="py-1.5 text-right text-muted">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockupFrame>
  )
}

// ─── 21. COI detail — ciencia detrás del coeficiente Wright ──────────
function CoiDetail() {
  // % de contribución de cada ancestro duplicado al COI total
  const ancestors = [
    { name: 'Falcón de la Plata', paths: 3, contrib: 2.1 },
    { name: 'Bermudo del Sol', paths: 2, contrib: 1.4 },
    { name: 'Toby II', paths: 2, contrib: 0.5 },
    { name: 'Anita de Tenerife', paths: 1, contrib: 0.2 },
  ]
  // Distribución de la raza (histograma); barra del perro destacada
  const breedHist = [
    { range: '0–2%', pct: 18 },
    { range: '2–4%', pct: 28, current: true },
    { range: '4–6%', pct: 22 },
    { range: '6–10%', pct: 18 },
    { range: '10–15%', pct: 9 },
    { range: '15%+', pct: 5 },
  ]
  return (
    <MockupFrame topBar="genealogic.io/dogs/xian · COI">
      <div className="p-4">
        {/* Header con el número grande */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-hairline">
          <div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#FE6620]" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Coeficiente de consanguinidad</p>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[28px] font-bold tabular-nums text-emerald-700 leading-none">4.2%</span>
              <span className="text-[9px] text-muted">Wright · generaciones ilimitadas</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted">Percentil en la raza</p>
            <p className="text-[14px] font-bold text-emerald-700">35º</p>
            <p className="text-[8.5px] text-muted">mejor que el 65%</p>
          </div>
        </div>

        {/* Comparativa vs raza */}
        <p className="text-[8.5px] font-semibold uppercase tracking-wider text-muted mb-1.5">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          Vs media de la raza (Presa Canario)
        </p>
        <div className="rounded-lg border border-hairline bg-canvas p-2.5 mb-3">
          <div className="flex items-end gap-1 h-12">
            {breedHist.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                <div
                  className={`w-full rounded-t ${b.current ? 'bg-[#FE6620]' : 'bg-surface-card border border-hairline'}`}
                  style={{ height: `${b.pct * 2}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {breedHist.map((b, i) => (
              <span key={i} className={`flex-1 text-[7.5px] text-center ${b.current ? 'text-[#FE6620] font-bold' : 'text-muted'}`}>
                {b.range}
              </span>
            ))}
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-hairline flex items-center justify-between text-[8.5px]">
            <span className="text-muted">Media raza: <span className="text-ink font-semibold tabular-nums">5.8%</span></span>
            <span className="text-emerald-700 font-semibold">Tu perro está por debajo ✓</span>
          </div>
        </div>

        {/* Ancestros duplicados */}
        <p className="text-[8.5px] font-semibold uppercase tracking-wider text-muted mb-1.5">
          Ancestros que contribuyen al COI
        </p>
        <div className="space-y-1">
          {ancestors.map((a, i) => (
            <div key={i} className="rounded border border-hairline bg-canvas px-2 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-ink truncate">{a.name}</span>
                <span className="text-[9.5px] font-bold tabular-nums text-[#FE6620]">+{a.contrib.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-muted">{a.paths} caminos Wright</span>
                <div className="flex-1 h-1 rounded-full bg-surface-card overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-300 to-[#FE6620]" style={{ width: `${(a.contrib / 4.2) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Semáforo umbrales */}
        <div className="mt-3 pt-2 border-t border-hairline">
          <div className="flex h-1.5 rounded-full overflow-hidden">
            <div className="flex-1 bg-emerald-400" />
            <div className="flex-1 bg-amber-400" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-rose-400" />
          </div>
          <div className="flex justify-between text-[7px] text-muted mt-0.5">
            <span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

// ─── Despatcher ─────────────────────────────────────────────────────────
const MOCKUPS: Record<string, () => React.ReactElement> = {
  // Originales
  'pipeline-kanban': PipelineKanban,
  'contract-editor': ContractEditor,
  'payments-timeline': PaymentsTimeline,
  'kennel-web': KennelWeb,
  'blog-list': BlogList,
  'pedigree-tree': PedigreeTreeMockup,
  'dogs-grid': DogsGrid,
  'breeding-simulator': BreedingSimulator,
  'bot-conversation': BotConversation,
  'newsletter-composer': NewsletterComposer,
  'stats-dashboard': StatsDashboard,
  // Nuevos
  'public-directory': PublicDirectory,
  'pedigree-importer': PedigreeImporter,
  'audit-history': AuditHistory,
  'pedigree-pdf': PedigreePdfMockup,
  'reproduction-gantt': ReproductionGantt,
  'litter-detail': LitterDetail,
  'vet-records': VetRecords,
  'genotypes': Genotypes,
  'reservations-table': ReservationsTable,
  'coi-detail': CoiDetail,
}

export default function Mockup({ slug }: MockupProps) {
  const Cmp = MOCKUPS[slug]
  if (!Cmp) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-12 text-center text-[12px] text-muted">
        Mockup &quot;{slug}&quot; pendiente
      </div>
    )
  }
  return <Cmp />
}
