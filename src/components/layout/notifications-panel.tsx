'use client'

import { useEffect } from 'react'
import { X, Bell, Calendar, Stethoscope, Trophy, UserPlus, HandCoins } from 'lucide-react'

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
}

// Placeholder notifications — will be replaced with real data from Supabase later
const PLACEHOLDER_NOTIFICATIONS = [
  { id: '1', type: 'vet', title: 'Recordatorio veterinario', message: 'La vacuna de rabia vence pronto', time: 'Hace 2 horas', read: false },
  { id: '2', type: 'calendar', title: 'Evento proximo', message: 'Visita al veterinario manana a las 10:00', time: 'Hace 5 horas', read: false },
  { id: '3', type: 'contact', title: 'Nuevo contacto', message: 'Juan Garcia ha mostrado interes', time: 'Ayer', read: true },
  { id: '4', type: 'deal', title: 'Negocio actualizado', message: 'Venta cachorro movido a "Cerrado"', time: 'Hace 2 dias', read: true },
]

function getNotifIcon(type: string) {
  switch (type) {
    case 'vet': return Stethoscope
    case 'calendar': return Calendar
    case 'award': return Trophy
    case 'contact': return UserPlus
    case 'deal': return HandCoins
    default: return Bell
  }
}

function getNotifColor(type: string) {
  switch (type) {
    case 'vet': return 'bg-blue-500/15 text-blue-400'
    case 'calendar': return 'bg-purple-500/15 text-purple-400'
    case 'contact': return 'bg-green-500/15 text-green-400'
    case 'deal': return 'bg-orange-500/15 text-orange-400'
    default: return 'bg-white/10 text-white/40'
  }
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const unread = PLACEHOLDER_NOTIFICATIONS.filter(n => !n.read).length

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notificaciones</h2>
            {unread > 0 && (
              <span className="bg-[#D74709] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button className="px-4 py-2.5 text-sm font-medium border-b-2 border-[#D74709] text-[#D74709] -mb-px">
            Todas
          </button>
          <button className="px-4 py-2.5 text-sm font-medium text-white/40 hover:text-white/60 transition -mb-px border-b-2 border-transparent">
            No leidas ({unread})
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {PLACEHOLDER_NOTIFICATIONS.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {PLACEHOLDER_NOTIFICATIONS.map(notif => {
                const Icon = getNotifIcon(notif.type)
                const iconClass = getNotifColor(notif.type)
                return (
                  <div
                    key={notif.id}
                    className={`px-6 py-4 hover:bg-white/[0.03] transition cursor-pointer ${!notif.read ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${notif.read ? 'text-white/60' : 'text-white'}`}>{notif.title}</p>
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-[#D74709] flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{notif.message}</p>
                        <p className="text-[11px] text-white/25 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 flex-shrink-0">
          <button className="text-xs text-[#D74709] hover:text-[#c03d07] transition font-medium">
            Marcar todas como leidas
          </button>
        </div>
      </div>
    </>
  )
}
