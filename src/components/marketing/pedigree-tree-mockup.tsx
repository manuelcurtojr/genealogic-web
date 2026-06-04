'use client'
/**
 * PedigreeTreeMockup — mockup del árbol genealógico (3 generaciones, conectores
 * SVG) dentro de una ventana estilo macOS. Compartido por la home (propietario)
 * y la landing /criadores. `photos` es opcional: si no se pasan, cada card usa
 * un degradado de relleno determinista.
 *
 * Extraído de landing-page.tsx (sección "01") para reusarlo en el home owner-first.
 */
import { GitBranch, Lock, ShieldCheck } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export default function PedigreeTreeMockup({
  photos = [],
  url = 'genealogic.io/dogs/lord-byron-de-aldenham',
}: {
  photos?: string[]
  url?: string
}) {
  return (
    <AppWindow url={url}>
      <PedigreeTree photos={photos} />
    </AppWindow>
  )
}

/** Ventana estilo macOS para enmarcar mockups de producto. */
function AppWindow({ url, children }: { url?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-hairline bg-canvas shadow-[0_24px_60px_-12px_rgba(17,17,17,0.18),0_8px_24px_-4px_rgba(17,17,17,0.08)]">
      <div className="flex items-center gap-3 border-b border-hairline bg-surface-soft px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        {url && (
          <div className="hidden flex-1 sm:flex sm:justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-1 text-[11px] text-muted shadow-inner">
              <Lock className="h-3 w-3" />
              <span className="font-mono">{url}</span>
            </div>
          </div>
        )}
        <div className="w-[54px]" />
      </div>
      {children}
    </div>
  )
}

function PedigreeTree({ photos }: { photos: string[] }) {
  const t = useT()
  const dogs: Array<{ name: string; sex: 'male' | 'female'; reg?: string }> = [
    { name: 'Furio del Colle', sex: 'male', reg: 'LOI 23/118402' }, // root
    { name: 'Ch. Tiberio della Valle', sex: 'male' },
    { name: 'Nuvola del Colle', sex: 'female' },
    { name: 'Apollo di Roma', sex: 'male' },
    { name: 'Stella del Tevere', sex: 'female' },
    { name: 'Romeo dei Sette Colli', sex: 'male' },
    { name: 'Bianca di Firenze', sex: 'female' },
  ]
  const breed = t('Galgo Italiano')

  const W = 220, H = 64
  const positions = [
    { x: 0, y: 198 }, { x: 320, y: 68 }, { x: 320, y: 328 },
    { x: 640, y: 8 }, { x: 640, y: 128 }, { x: 640, y: 268 }, { x: 640, y: 388 },
  ]
  const centerY = (i: number) => positions[i].y + H / 2
  const rightX = (i: number) => positions[i].x + W
  const leftX = (i: number) => positions[i].x

  return (
    <div className="overflow-x-auto p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          <GitBranch className="h-3.5 w-3.5" />
          {t('Árbol genealógico')}
        </div>
        <span className="rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-medium text-body">
          {t('3 generaciones · ilimitadas disponibles')}
        </span>
      </div>

      <div className="relative mx-auto" style={{ width: 860, height: 460, minWidth: 860 }}>
        <svg className="pointer-events-none absolute inset-0" width={860} height={460} viewBox="0 0 860 460" aria-hidden>
          <g stroke="var(--pedigree-line, rgba(17,17,17,0.18))" strokeWidth="1.5" fill="none" strokeLinecap="round">
            <path d={`M ${rightX(0)} ${centerY(0)} H 270`} />
            <path d={`M 270 ${centerY(0)} V ${centerY(1)} H ${leftX(1)}`} />
            <path d={`M 270 ${centerY(0)} V ${centerY(2)} H ${leftX(2)}`} />
            <path d={`M ${rightX(1)} ${centerY(1)} H 590`} />
            <path d={`M 590 ${centerY(1)} V ${centerY(3)} H ${leftX(3)}`} />
            <path d={`M 590 ${centerY(1)} V ${centerY(4)} H ${leftX(4)}`} />
            <path d={`M ${rightX(2)} ${centerY(2)} H 590`} />
            <path d={`M 590 ${centerY(2)} V ${centerY(5)} H ${leftX(5)}`} />
            <path d={`M 590 ${centerY(2)} V ${centerY(6)} H ${leftX(6)}`} />
          </g>
        </svg>

        {dogs.map((d, i) => (
          <div key={i} className="absolute" style={{ left: positions[i].x, top: positions[i].y }}>
            <PedCard name={d.name} breed={breed} registration={d.reg} sex={d.sex} isRoot={i === 0} photo={photos[i]} fallbackSeed={i} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[color:var(--success)]" />
          {t('Verificable · trazable · público')}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--male)' }} />
            {t('Macho')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: 'var(--female)' }} />
            {t('Hembra')}
          </span>
        </div>
      </div>
    </div>
  )
}

function PedCard({
  name, breed, registration, sex, isRoot, photo, fallbackSeed = 0,
}: {
  name: string; breed?: string; registration?: string; sex: 'male' | 'female'
  isRoot?: boolean; photo?: string | null; fallbackSeed?: number
}) {
  const stripe = sex === 'male' ? 'var(--male)' : 'var(--female)'
  const fallbackGradients = [
    'linear-gradient(135deg, #d4a574 0%, #8b6f47 100%)',
    'linear-gradient(135deg, #c9a98c 0%, #6b4f3a 100%)',
    'linear-gradient(135deg, #b08968 0%, #5d4037 100%)',
    'linear-gradient(135deg, #e8c39e 0%, #a47551 100%)',
    'linear-gradient(135deg, #1a1a1a 0%, #404040 100%)',
    'linear-gradient(135deg, #d2b48c 0%, #8b7355 100%)',
    'linear-gradient(135deg, #f4e4bc 0%, #c19a6b 100%)',
  ]
  const fallbackBg = fallbackGradients[fallbackSeed % fallbackGradients.length]

  return (
    <div
      className={`relative flex items-stretch overflow-hidden rounded-xl border bg-canvas ${
        isRoot
          ? 'border-ink shadow-[0_0_0_1px_rgba(17,17,17,0.04),0_4px_18px_rgba(17,17,17,0.10)]'
          : 'border-hairline shadow-[0_1px_2px_rgba(17,17,17,0.04)]'
      }`}
      style={{ width: 220, height: 64 }}
    >
      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 56, background: fallbackBg }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        )}
        <div className="absolute bottom-0 right-0 top-0 w-[3px]" style={{ backgroundColor: stripe }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-2.5 py-1.5">
        <p className="truncate text-[12px] font-semibold leading-tight text-ink">{name}</p>
        {registration ? (
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{registration}</p>
        ) : breed ? (
          <p className="mt-0.5 truncate text-[10.5px] text-muted">{breed}</p>
        ) : null}
      </div>
    </div>
  )
}
