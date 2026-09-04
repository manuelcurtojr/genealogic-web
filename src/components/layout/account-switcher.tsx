'use client'

/**
 * Selector de cuentas (estilo YouTube/Instagram). Permite tener varias cuentas
 * de Genealogic iniciadas a la vez y cambiar entre ellas al instante, sin
 * volver a introducir la contraseña.
 *
 * Cómo funciona:
 *  - Al montar, guarda (y mantiene fresca vía onAuthStateChange) la sesión de
 *    la cuenta activa en localStorage (ver lib/auth/accounts).
 *  - "Cambiar" hace supabase.auth.setSession con los tokens guardados de esa
 *    cuenta y recarga → el servidor lee las cookies nuevas.
 *  - "Añadir cuenta" va a /login sin borrar la sesión actual (ya guardada), así
 *    tras iniciar sesión con otra cuenta ambas quedan disponibles.
 *
 * variant 'desktop' = disparador avatar en la barra superior (dropdown).
 * variant 'mobile'  = bloque a pie del sidebar (panel hacia arriba); Ajustes y
 * Cerrar sesión se omiten porque el sidebar ya los ofrece.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Img } from '@/components/ui/img'
import { Check, Plus, LogOut, Settings, ChevronsUpDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSavedAccounts, upsertAccount, removeAccount, clearAccounts, type SavedAccount } from '@/lib/auth/accounts'
import { useT } from '@/components/i18n/locale-provider'

function Avatar({ url, name, size = 36 }: { url: string | null; name: string; size?: number }) {
  return (
    <span
      className="rounded-full overflow-hidden border border-hairline bg-surface-card flex items-center justify-center text-ink font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? <Img src={url} w={120} alt="" className="w-full h-full object-cover" /> : (name || '?')[0]?.toUpperCase()}
    </span>
  )
}

export default function AccountSwitcher({
  current, variant = 'desktop',
}: {
  current: { userId: string; name: string; email: string; avatarUrl: string | null }
  variant?: 'desktop' | 'mobile'
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<SavedAccount[]>([])
  const [activeId, setActiveId] = useState(current.userId)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Guardar/mantener fresca la sesión de la cuenta activa.
  useEffect(() => {
    const supabase = createClient()
    let active = true
    async function saveCurrent() {
      const [{ data: { session } }, { data: { user: authUser } }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ])
      if (!active || !session || !authUser) return
      setActiveId(authUser.id)
      upsertAccount({
        userId: authUser.id,
        email: current.email || authUser.email || '',
        name: current.name || current.email || authUser.email || '',
        avatarUrl: current.avatarUrl,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        savedAt: Date.now(),
      })
      if (active) setAccounts(getSavedAccounts())
    }
    saveCurrent()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session) saveCurrent()
    })
    setAccounts(getSavedAccounts())
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [current.userId, current.email, current.name, current.avatarUrl])

  // Cerrar al pulsar fuera / Escape.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const others = accounts.filter((a) => a.userId !== activeId)

  const switchTo = useCallback(async (acc: SavedAccount) => {
    if (busy) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.auth.setSession({
      access_token: acc.access_token,
      refresh_token: acc.refresh_token,
    })
    if (error) {
      removeAccount(acc.userId)
      setAccounts(getSavedAccounts())
      setBusy(false)
      alert(t('Esa sesión ha caducado. Vuelve a iniciar sesión con esa cuenta.'))
      window.location.href = '/login'
      return
    }
    window.location.href = '/dashboard'
  }, [busy, t])

  const addAccount = useCallback(() => {
    // La sesión actual ya está guardada; iniciar sesión con otra no la borra.
    window.location.href = '/login?add=1'
  }, [])

  const logout = useCallback(async () => {
    if (busy) return
    setBusy(true)
    const supabase = createClient()
    clearAccounts()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [busy])

  // ─── Contenido del menú (compartido) ───
  const menu = (
    <div className="p-1.5">
      {/* Cuenta activa */}
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <Avatar url={current.avatarUrl} name={current.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink truncate">{current.name || t('Tu cuenta')}</p>
          <p className="text-[11.5px] text-muted truncate">{current.email}</p>
        </div>
        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      </div>

      {variant === 'desktop' && (
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-body hover:bg-surface-soft hover:text-ink"
        >
          <Settings className="w-4 h-4 text-muted" /> {t('Ajustes de la cuenta')}
        </Link>
      )}

      {(others.length > 0 || true) && <div className="my-1.5 border-t border-hairline" />}

      {/* Otras cuentas */}
      {others.map((a) => (
        <button
          key={a.userId}
          type="button"
          onClick={() => switchTo(a)}
          disabled={busy}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-surface-soft disabled:opacity-50"
        >
          <Avatar url={a.avatarUrl} name={a.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate">{a.name || t('Cuenta')}</p>
            <p className="text-[11px] text-muted truncate">{a.email}</p>
          </div>
        </button>
      ))}

      <button
        type="button"
        onClick={addAccount}
        disabled={busy}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13px] text-body hover:bg-surface-soft hover:text-ink disabled:opacity-50"
      >
        <span className="w-8 h-8 rounded-full border border-dashed border-hairline flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4 text-muted" />
        </span>
        {t('Añadir otra cuenta')}
      </button>

      {variant === 'desktop' && (
        <>
          <div className="my-1.5 border-t border-hairline" />
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13px] text-body hover:bg-surface-soft hover:text-[color:var(--error)] disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 text-muted" />}
            {t('Cerrar sesión')}
          </button>
        </>
      )}
    </div>
  )

  // ─── Disparador + panel según variante ───
  if (variant === 'mobile') {
    return (
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-surface-soft transition text-left"
        >
          <Avatar url={current.avatarUrl} name={current.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate">{current.name || t('Tu cuenta')}</p>
            <p className="text-[11px] text-muted truncate">{current.email}</p>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-muted flex-shrink-0" />
        </button>
        {open && (
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-hairline bg-canvas shadow-xl z-50">
            {menu}
          </div>
        )}
      </div>
    )
  }

  // desktop
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t('Cuenta')}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-hairline cursor-pointer block hover:opacity-90"
      >
        {current.avatarUrl ? (
          <Img src={current.avatarUrl} w={120} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-card flex items-center justify-center text-ink text-xs font-bold">
            {(current.name || '?')[0]?.toUpperCase()}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-hairline bg-canvas shadow-xl z-50">
          {menu}
        </div>
      )}
    </div>
  )
}
