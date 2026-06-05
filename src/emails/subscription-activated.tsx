/**
 * Email de confirmación cuando una suscripción Pro/Premium se activa
 * por primera vez.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'
import { getTranslator } from '@/lib/i18n'

export type SubscriptionActivatedProps = {
  recipientName: string | null
  /** Acepta los nuevos nombres canónicos + los legacy pro/premium */
  plan: 'kennel' | 'kennel_pro' | 'pro' | 'premium'
  /** Si está en trial, ISO date de cuándo termina. null = ya activo / sin trial. */
  trialEndsAt?: string | null
  locale?: string
}

function formatTrialDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return null
  }
}

export default function SubscriptionActivatedEmail({
  recipientName, plan, trialEndsAt = null, locale,
}: SubscriptionActivatedProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  // Enterprise retirado: cualquier plan de pago (incl. legacy kennel_pro) = "Kennel Pro".
  void plan
  const planLabel = 'Kennel Pro'
  const trialEnd = formatTrialDate(trialEndsAt)
  const isTrial = !!trialEnd

  const preview = isTrial
    ? `${t('Tu prueba de 14 días de Genealogic')} ${planLabel} ${t('está activa. Termina el')} ${trialEnd}.`
    : `Genealogic ${planLabel} ${t('activado. Bienvenido al siguiente nivel.')}`

  return (
    <EmailLayout preview={preview} locale={locale}>
      <Eyebrow color={COLORS.success}>{isTrial ? t('✓ Prueba activa') : t('✓ Plan activado')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {isTrial
          ? <>{t('tu prueba de Genealogic')} {planLabel} {t('ya está activa.')}</>
          : <>Genealogic {planLabel} {t('ya está activo.')}</>}
      </H1>
      <P>
        {isTrial ? (
          <>
            {t('Tienes')} <strong style={{ color: COLORS.ink }}>{t('14 días para probar todas las herramientas')}</strong> {t('de Genealogic')} {planLabel} {t('sin coste. El primer cargo se hará el')} <strong style={{ color: COLORS.ink }}>{trialEnd}</strong>;{' '}
            {t('puedes cancelar antes desde tu cuenta sin pagar nada.')}
          </>
        ) : (
          <>
            {t('Gracias por confiar en nosotros. Tu suscripción')} <strong style={{ color: COLORS.ink }}>{planLabel}</strong> {t('está activa y todas las herramientas profesionales ya las tienes desbloqueadas.')}
          </>
        )}
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '140px' }}>{t('Plan')}</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>
              Genealogic {planLabel}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Estado')}</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>
              {isTrial ? t('En prueba · sin coste hasta el primer cargo') : t('Activo · facturación mensual')}
            </td>
          </tr>
          {isTrial && (
            <tr>
              <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Primer cargo')}</td>
              <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{t('El')} {trialEnd}</td>
            </tr>
          )}
        </table>
      </InfoCard>

      <P>{t('Esto es lo que te recomendamos hacer ahora:')}</P>
      <ol style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>{t('Activa tu web pública')}</strong> {t('con dominio personalizado.')}
        </li>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>{t('Configura el Emailbot')}</strong> {t('para que responda a leads 24/7.')}
        </li>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>{t('Importa tu lista de espera')}</strong> {t('y empieza tu pipeline de reservas.')}
        </li>
      </ol>

      <Btn href={`${SITE_URL}/dashboard`}>{t('Ir a mi panel')}</Btn>

      <Divider />

      <Small>
        {t('Recibirás una factura por email cada mes. Puedes ver, descargar y gestionar tu suscripción desde')}{' '}
        <a href={`${SITE_URL}/cuenta/facturacion`} style={{ color: COLORS.ink }}>
          /cuenta/facturacion
        </a>
        . {t('Si necesitas ayuda, responde a este email.')}
      </Small>
    </EmailLayout>
  )
}
