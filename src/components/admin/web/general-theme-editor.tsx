'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { Check, Palette, RotateCcw, Type, Square } from 'lucide-react'
import type { Theme, ThemeOverrides, ButtonRadius, DisplayFont } from '@/lib/kennel/themes'
import { applyOverrides, BUTTON_RADIUS_PX, BUTTON_RADIUS_LABELS, DISPLAY_FONT_LABELS, FONT_STACKS } from '@/lib/kennel/themes'
import { updateKennelTheme } from '@/app/(dashboard)/web/general/actions'

type Overrides = ThemeOverrides

type Props = {
  themes: Theme[]
  currentThemeId: string
  currentOverrides: Overrides | null
  kennelSlug: string
  disabled?: boolean
}

const HEX = /^#[0-9a-fA-F]{6}$/

export function GeneralThemeEditor({ themes, currentThemeId, currentOverrides, kennelSlug, disabled = false }: Props) {
  const [selectedId, setSelectedId] = useState<string>(currentThemeId)
  const [useOverrides, setUseOverrides] = useState<boolean>(!!currentOverrides)
  const [overrides, setOverrides] = useState<Overrides>(currentOverrides ?? {})
  const [pending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const baseTheme = themes.find((t) => t.id === selectedId) ?? themes[0]
  // Tema "vivo" para la preview, mezcla base + overrides si están activos
  const liveTheme = useMemo(
    () => applyOverrides(baseTheme, useOverrides ? overrides : null),
    [baseTheme, useOverrides, overrides],
  )

  // Reset overrides a los del tema cuando cambia el tema base si no hay overrides custom previos
  useEffect(() => {
    if (!useOverrides) {
      setOverrides({
        primary: baseTheme.tokens.primary,
        accent: baseTheme.tokens.accent,
        canvas: baseTheme.tokens.canvas,
        ink: baseTheme.tokens.ink,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const handleSave = () => {
    const fd = new FormData()
    fd.set('theme_id', selectedId)
    fd.set('use_overrides', useOverrides ? 'on' : 'off')
    for (const k of ['primary', 'accent', 'canvas', 'ink', 'on_primary'] as const) {
      const v = overrides[k]
      if (v) fd.set(`override_${k}`, v)
    }
    if (overrides.button_radius) fd.set('override_button_radius', overrides.button_radius)
    if (overrides.font_display) fd.set('override_font_display', overrides.font_display)
    // Stripe colors numerados override_stripe_0/1/2
    const stripe = overrides.stripe_colors ?? []
    stripe.forEach((c, i) => fd.set(`override_stripe_${i}`, c))
    startTransition(async () => {
      await updateKennelTheme(fd)
      setSavedAt(Date.now())
    })
  }

  const isDirty =
    selectedId !== currentThemeId ||
    useOverrides !== !!currentOverrides ||
    (useOverrides && JSON.stringify(overrides) !== JSON.stringify(currentOverrides ?? {}))

  return (
    <div className={`mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Columna izquierda: selector + colores */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-hairline bg-canvas p-5">
          <h2 className="text-base font-bold text-ink">Tema</h2>
          <p className="mt-1 text-xs text-muted">Define la paleta, tipografía y forma base.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                selected={t.id === selectedId}
                onSelect={() => setSelectedId(t.id)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-canvas p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted" />
                Colores personalizados
              </h2>
              <p className="mt-1 text-xs text-muted">
                Sobreescribe los colores base del tema. Puedes desactivarlo para volver al original.
              </p>
            </div>
            <Toggle on={useOverrides} onChange={setUseOverrides} />
          </div>

          <div className={`mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 ${!useOverrides && 'opacity-40 pointer-events-none'}`}>
            <ColorField
              label="Primary"
              hint="Fondo de CTAs y botones brand"
              value={overrides.primary ?? baseTheme.tokens.primary}
              onChange={(v) => setOverrides((o) => ({ ...o, primary: v }))}
            />
            <ColorField
              label="Texto botones"
              hint="Color del texto sobre el primary"
              value={overrides.on_primary ?? baseTheme.tokens.onPrimary}
              onChange={(v) => setOverrides((o) => ({ ...o, on_primary: v }))}
            />
            <ColorField
              label="Accent"
              hint="Highlights, badges, numeración secciones"
              value={overrides.accent ?? baseTheme.tokens.accent}
              onChange={(v) => setOverrides((o) => ({ ...o, accent: v }))}
            />
            <ColorField
              label="Canvas"
              hint="Fondo principal de la web"
              value={overrides.canvas ?? baseTheme.tokens.canvas}
              onChange={(v) => setOverrides((o) => ({ ...o, canvas: v }))}
            />
            <ColorField
              label="Ink"
              hint="Color del texto principal"
              value={overrides.ink ?? baseTheme.tokens.ink}
              onChange={(v) => setOverrides((o) => ({ ...o, ink: v }))}
            />
          </div>

          {useOverrides && (
            <button
              type="button"
              onClick={() => {
                setOverrides({
                  primary: baseTheme.tokens.primary,
                  accent: baseTheme.tokens.accent,
                  canvas: baseTheme.tokens.canvas,
                  ink: baseTheme.tokens.ink,
                  on_primary: baseTheme.tokens.onPrimary,
                  button_radius: baseTheme.buttonRadius,
                  font_display: baseTheme.displayFont,
                  stripe_colors: baseTheme.accentStripe ?? [],
                })
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-ink"
            >
              <RotateCcw className="h-3 w-3" />
              Resetear a defaults del tema
            </button>
          )}
        </section>

        {/* Línea decorativa (BMW M tricolor / Lambo gold / etc.) */}
        <section className="rounded-2xl border border-hairline bg-canvas p-5">
          <h2 className="text-base font-bold text-ink">Línea decorativa superior</h2>
          <p className="mt-1 text-xs text-muted">
            Banda fina de color en la cabecera (estilo BMW M tricolor / Lamborghini Giallo). Deja un
            campo vacío para usar menos colores (1, 2 o 3).
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => {
              const current = overrides.stripe_colors?.[i] ?? baseTheme.accentStripe?.[i] ?? ''
              return (
                <StripeColorField
                  key={i}
                  label={`Color ${i + 1}`}
                  value={current}
                  onChange={(v) => {
                    setOverrides((o) => {
                      const arr = [...(o.stripe_colors ?? baseTheme.accentStripe ?? [])]
                      arr[i] = v
                      // Compactamos vacíos al final
                      const cleaned = arr.filter(Boolean)
                      return { ...o, stripe_colors: cleaned }
                    })
                  }}
                  onClear={() => {
                    setOverrides((o) => {
                      const arr = [...(o.stripe_colors ?? baseTheme.accentStripe ?? [])]
                      arr[i] = ''
                      const cleaned = arr.filter(Boolean)
                      return { ...o, stripe_colors: cleaned }
                    })
                  }}
                />
              )
            })}
          </div>
          {/* Preview de la stripe */}
          <div className="mt-4 flex h-2 rounded-sm overflow-hidden bg-surface-soft">
            {(overrides.stripe_colors ?? baseTheme.accentStripe ?? []).map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
            {(!overrides.stripe_colors || overrides.stripe_colors.length === 0) &&
              !baseTheme.accentStripe?.length && (
                <p className="w-full text-center text-[10px] text-muted py-0.5">(sin línea)</p>
              )}
          </div>
        </section>

        {/* Tipografía + Forma — disponibles incluso sin "Colores personalizados" */}
        <section className="rounded-2xl border border-hairline bg-canvas p-5">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Type className="h-4 w-4 text-muted" />
            Tipografía y forma
          </h2>
          <p className="mt-1 text-xs text-muted">
            Cambia la fuente de los titulares y el radio de los botones. Los cambios se aplican a toda la web.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Fuente de titulares
              </label>
              <select
                value={overrides.font_display ?? baseTheme.displayFont}
                onChange={(e) => setOverrides((o) => ({ ...o, font_display: e.target.value as DisplayFont }))}
                className="mt-2 w-full px-3 py-2.5 text-[13px] border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink/40"
                style={{ fontFamily: FONT_STACKS[overrides.font_display ?? baseTheme.displayFont]?.stack }}
              >
                {(Object.keys(DISPLAY_FONT_LABELS) as DisplayFont[]).map((k) => (
                  <option key={k} value={k} style={{ fontFamily: FONT_STACKS[k]?.stack }}>
                    {DISPLAY_FONT_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Square className="h-3 w-3" />
                Forma de botones
              </label>
              <select
                value={overrides.button_radius ?? baseTheme.buttonRadius}
                onChange={(e) => setOverrides((o) => ({ ...o, button_radius: e.target.value as ButtonRadius }))}
                className="mt-2 w-full px-3 py-2.5 text-[13px] border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink/40"
              >
                {(Object.keys(BUTTON_RADIUS_LABELS) as ButtonRadius[]).map((k) => (
                  <option key={k} value={k}>{BUTTON_RADIUS_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Mini preview de la combinación */}
          <div className="mt-5 flex items-center gap-3 rounded-lg bg-surface-soft p-4">
            <p
              className="text-2xl font-bold text-ink flex-1"
              style={{ fontFamily: FONT_STACKS[overrides.font_display ?? baseTheme.displayFont]?.stack }}
            >
              Aa
            </p>
            <button
              type="button"
              className="px-5 py-2.5 text-xs font-semibold text-white"
              style={{
                background: overrides.primary ?? baseTheme.tokens.primary,
                color: baseTheme.tokens.onPrimary,
                borderRadius: BUTTON_RADIUS_PX[overrides.button_radius ?? baseTheme.buttonRadius],
              }}
            >
              Botón ejemplo
            </button>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!isDirty || pending}
            className="rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Guardando…' : isDirty ? 'Guardar cambios' : 'Sin cambios'}
          </button>
          {savedAt && !isDirty && (
            <span className="text-xs text-emerald-700 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Guardado · refresca la web pública para ver el cambio
            </span>
          )}
          <a
            href={`/c/${kennelSlug}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs text-muted hover:text-ink underline"
          >
            Ver web pública ↗
          </a>
        </div>
      </div>

      {/* Columna derecha: preview live */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">Preview en vivo</p>
        <ThemePreview theme={liveTheme} />
        <TokenList theme={liveTheme} />
      </div>
    </div>
  )
}

function ThemeCard({ theme, selected, onSelect }: { theme: Theme; selected: boolean; onSelect: () => void }) {
  const t = theme.tokens
  const cardDisplayStack = FONT_STACKS[theme.displayFont]?.stack
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all ${
        selected ? 'border-ink shadow-md' : 'border-hairline hover:border-ink/30'
      }`}
    >
      {/* Mini preview */}
      <div className="h-24 flex flex-col justify-between p-3" style={{ background: t.canvas, color: t.ink }}>
        {theme.accentStripe && (
          <div className="flex h-1 w-full -mx-3 -mt-3" style={{ width: 'calc(100% + 1.5rem)' }}>
            {theme.accentStripe.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        )}
        <div
          className="text-[13px] font-bold leading-tight"
          style={{
            fontFamily: cardDisplayStack,
            textTransform: theme.uppercaseDisplay ? 'uppercase' : undefined,
            letterSpacing: theme.displayTracking,
          }}
        >
          {theme.name}
        </div>
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: t.primary }} />
          <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: t.accent }} />
          <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: t.ink }} />
        </div>
      </div>
      <div className="px-3 py-2.5 bg-canvas border-t border-hairline">
        <p className="text-[12.5px] font-semibold text-ink">{theme.name}</p>
        <p className="text-[10.5px] text-muted line-clamp-1">{theme.tagline}</p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink text-on-primary">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  )
}

function StripeColorField({
  label, value, onChange, onClear,
}: { label: string; value: string; onChange: (v: string) => void; onClear: () => void }) {
  const valid = HEX.test(value)
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-1.5 focus-within:border-ink/30">
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 bg-transparent text-[12.5px] font-mono tracking-tight outline-none ${valid ? 'text-ink' : value ? 'text-red-600' : 'text-muted'}`}
          placeholder="vacío"
          maxLength={7}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-muted hover:text-red-600 px-1"
            title="Quitar este color"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const valid = HEX.test(value)
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</label>
      <p className="text-[10.5px] text-muted mt-0.5">{hint}</p>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-1.5 focus-within:border-ink/30">
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 bg-transparent text-[12.5px] font-mono tracking-tight outline-none ${valid ? 'text-ink' : 'text-red-600'}`}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-ink' : 'bg-hairline'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${on ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}

/**
 * Preview en vivo: simula una sección hero con los tokens del tema actual.
 * No usa iframe: render inline con estilos en línea controlados por el tema.
 */
function ThemePreview({ theme }: { theme: Theme }) {
  const t = theme.tokens
  const radius = BUTTON_RADIUS_PX[theme.buttonRadius]
  const displayStack = FONT_STACKS[theme.displayFont]?.stack
  return (
    <div
      className="rounded-2xl overflow-hidden ring-1 ring-hairline shadow-sm"
      style={{ background: t.canvas, color: t.ink }}
    >
      {theme.accentStripe && (
        <div className="flex h-1 w-full">
          {theme.accentStripe.map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
      )}
      <div className="p-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3"
          style={{ color: t.muted }}
        >
          ★ Tu marca aquí
        </p>
        <h3
          className="text-3xl font-bold leading-[0.95] tracking-[-0.02em] mb-3"
          style={{
            fontFamily: displayStack,
            textTransform: theme.uppercaseDisplay ? 'uppercase' : undefined,
            letterSpacing: theme.displayTracking,
          }}
        >
          Criadero del Norte
        </h3>
        <p className="text-sm mb-5" style={{ color: t.body }}>
          50 años criando perros excepcionales. La paleta de tu web se actualiza al vuelo.
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 text-xs font-semibold"
            style={{ background: t.primary, color: t.onPrimary, borderRadius: radius }}
          >
            Ver cachorros
          </button>
          <button
            className="px-4 py-2 text-xs font-semibold"
            style={{ background: 'transparent', color: t.ink, border: `1px solid ${t.hairline}`, borderRadius: radius }}
          >
            Contactar
          </button>
        </div>
        {/* Mini grid simulando cards */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square flex items-end p-2"
              style={{ background: t.surfaceCard, borderRadius: radius }}
            >
              <span className="text-[10px] font-medium" style={{ color: t.body }}>Foto {i}</span>
            </div>
          ))}
        </div>
        {/* Línea de acento */}
        <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.muted }}>
          <span className="h-px w-6" style={{ background: t.accent }} />
          accent · {t.accent}
        </div>
      </div>
    </div>
  )
}

function TokenList({ theme }: { theme: Theme }) {
  const items: { label: string; value: string }[] = [
    { label: 'primary', value: theme.tokens.primary },
    { label: 'accent', value: theme.tokens.accent },
    { label: 'canvas', value: theme.tokens.canvas },
    { label: 'ink', value: theme.tokens.ink },
    { label: 'body', value: theme.tokens.body },
    { label: 'hairline', value: theme.tokens.hairline },
  ]
  return (
    <div className="mt-3 rounded-xl border border-hairline bg-surface-soft p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Tokens activos</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[11px]">
            <span className="h-3 w-3 rounded-sm ring-1 ring-black/10 shrink-0" style={{ background: it.value }} />
            <span className="text-muted font-medium w-14">{it.label}</span>
            <span className="font-mono text-ink truncate">{it.value}</span>
          </div>
        ))}
        <div className="col-span-2 flex items-center gap-2 text-[11px] mt-1">
          <span className="text-muted font-medium w-14">font</span>
          <span className="font-mono text-ink truncate">{DISPLAY_FONT_LABELS[theme.displayFont]}</span>
        </div>
        <div className="col-span-2 flex items-center gap-2 text-[11px]">
          <span className="text-muted font-medium w-14">radius</span>
          <span className="font-mono text-ink">{BUTTON_RADIUS_LABELS[theme.buttonRadius]}</span>
        </div>
      </div>
    </div>
  )
}
