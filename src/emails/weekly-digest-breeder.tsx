/**
 * Resumen semanal para criadores. Cron lo dispara los lunes a las 9:00.
 * Solo se manda si hay actividad relevante (sino skip silencioso).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'
import { getTranslator } from '@/lib/i18n'

export type WeeklyDigestBreederProps = {
  recipientName: string | null
  kennelName: string
  weekLabel: string  // "Semana del 19 al 25 de mayo"
  stats: {
    newReservations: number
    pendingMessages: number
    upcomingLitters: number
    profileViews: number
  }
  topMessages?: Array<{ from: string; preview: string; reservationId: string }>
  locale?: string
}

export default function WeeklyDigestBreederEmail({
  recipientName, kennelName, weekLabel, stats, topMessages = [], locale,
}: WeeklyDigestBreederProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  const total = stats.newReservations + stats.pendingMessages + stats.upcomingLitters

  return (
    <EmailLayout preview={`${t('Tu semana en')} ${kennelName}: ${stats.newReservations} ${t('reservas,')} ${stats.pendingMessages} ${t('mensajes')}`} locale={locale}>
      <Eyebrow>{t('Resumen semanal')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {t('esto pasó esta semana en')} {kennelName}.
      </H1>
      <P style={{ color: COLORS.muted, fontSize: 13 }}>{weekLabel}</P>

      {/* Stats grid */}
      <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%', margin: '20px 0' }}>
        <tr>
          <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '6px', paddingBottom: '12px' }}>
            <StatBlock value={stats.newReservations} label={t('Reservas nuevas')} />
          </td>
          <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '6px', paddingBottom: '12px' }}>
            <StatBlock value={stats.pendingMessages} label={t('Mensajes pendientes')} />
          </td>
        </tr>
        <tr>
          <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '6px' }}>
            <StatBlock value={stats.upcomingLitters} label={t('Camadas activas')} />
          </td>
          <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '6px' }}>
            <StatBlock value={stats.profileViews} label={t('Visitas a tu web')} />
          </td>
        </tr>
      </table>

      {topMessages.length > 0 && (
        <>
          <P style={{ fontWeight: 600, color: COLORS.ink, fontSize: 14, marginTop: '20px', marginBottom: '8px' }}>
            {t('Te esperan estos mensajes:')}
          </P>
          {topMessages.slice(0, 3).map((m, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${COLORS.hairline}`,
                borderLeft: `3px solid ${COLORS.accent}`,
                borderRadius: '6px',
                padding: '10px 14px',
                fontFamily: FONT_STACK,
                fontSize: '13px',
                color: COLORS.body,
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, color: COLORS.ink, fontSize: 13 }}>{m.from}</p>
              <p style={{ margin: '4px 0 0 0', color: COLORS.muted, fontSize: 12.5, lineHeight: 1.45 }}>
                {m.preview.slice(0, 120)}
                {m.preview.length > 120 ? '…' : ''}
              </p>
            </div>
          ))}
        </>
      )}

      <Btn href={`${SITE_URL}/dashboard`}>{t('Ir a mi panel')}</Btn>

      {total === 0 && (
        <P style={{ color: COLORS.muted, fontSize: 13, marginTop: '20px' }}>
          {t('Semana tranquila. Aprovecha para subir fotos nuevas o actualizar la web — los kennels con perfil actualizado reciben 3× más visitas.')}
        </P>
      )}

      <Divider />

      <Small>
        {t('Recibes este resumen cada lunes. Si prefieres no recibirlo, desactívalo desde')}{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.ink }}>{t('tus preferencias')}</a>.
      </Small>
    </EmailLayout>
  )
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <table cellPadding={0} cellSpacing={0} style={{
      borderCollapse: 'collapse',
      width: '100%',
      backgroundColor: COLORS.surfaceCard,
      borderRadius: '10px',
    }}>
      <tr>
        <td style={{ padding: '14px 16px' }}>
          <p style={{
            fontFamily: FONT_STACK,
            fontSize: '28px',
            fontWeight: 600,
            color: COLORS.ink,
            letterSpacing: '-0.04em',
            margin: '0 0 4px 0',
            lineHeight: 1,
          }}>{value}</p>
          <p style={{
            fontFamily: FONT_STACK,
            fontSize: '11px',
            fontWeight: 600,
            color: COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 0,
          }}>{label}</p>
        </td>
      </tr>
    </table>
  )
}
