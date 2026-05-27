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
  GitBranch, KanbanSquare, Mail, ChevronDown, Search,
  Heart, MoreHorizontal, Calendar, MapPin, Star,
  ArrowUp, FileText, Send, Check,
  CreditCard, Dna, TrendingUp,
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
            <p className="text-[9.5px] text-ink">¡Hola Lucía! Sí, tenemos la camada de Mayo que estará lista para entrega a principios de junio. Son hijos de Xían × Yula, con pedigree completo y revisión veterinaria. Puedes ver disponibilidad aquí: iremacurto.com/perros</p>
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

// ─── Despatcher ─────────────────────────────────────────────────────────
const MOCKUPS: Record<string, () => React.ReactElement> = {
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
