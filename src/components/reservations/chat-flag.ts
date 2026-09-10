/**
 * Feature flag — chat en directo criador↔cliente dentro de la reserva.
 *
 * ⚠️ Vive en un módulo SIN `'use client'` a propósito: lo consumen tanto la
 * página (Server Component: `reservas/[id]`, `mis-reservas/[id]`) como el
 * componente cliente `ReservationChatPanel`. Si se exportara desde un módulo
 * `'use client'`, el Server Component NO recibiría el booleano real sino una
 * referencia-proxy de cliente (siempre truthy), y el gate del lado servidor
 * no funcionaría (el tile "Mensajes" seguiría renderizándose).
 *
 * Desactivado 2026-09-10 a petición del usuario ("de momento, que no sea
 * público"). Poner en `true` para reactivar el chat en todo (una sola línea).
 */
export const RESERVATION_CHAT_ENABLED: boolean = false
