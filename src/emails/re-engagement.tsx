/**
 * Email de re-engagement para users que llevan 14 días sin entrar.
 * Si tras 30 días sigue sin volver, se manda una versión "última
 * llamada" con copy distinto (mismo template, prop `variant`).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS } from './_components'
import { getTranslator } from '@/lib/i18n'

export type ReEngagementProps = {
  recipientName: string | null
  daysAway: number  // 14 o 30 típicamente
  intent: 'breeder' | 'owner'
  locale?: string
}

export default function ReEngagementEmail({
  recipientName, daysAway, intent, locale,
}: ReEngagementProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  const isFinal = daysAway >= 30

  const headlineTail = isFinal
    ? t('¿seguimos contando contigo?')
    : t('te echamos de menos en Genealogic.')

  return (
    <EmailLayout preview={`${t('Hace')} ${daysAway} ${t('días que no pasas por Genealogic')}`}>
      <Eyebrow color={COLORS.muted}>{t('Te echamos de menos')}</Eyebrow>
      <H1>{name ? name + ', ' : ''}{headlineTail}</H1>

      <P>
        {t('Llevas')}{' '}
        <strong style={{ color: COLORS.ink }}>{daysAway} {t('días')}</strong>{' '}
        {t('sin entrar en Genealogic. Si lo dejaste por algo concreto que falló, nos encantaría saberlo — responde a este email con dos líneas y leemos todas.')}
      </P>

      {intent === 'breeder' ? (
        <>
          <P style={{ fontWeight: 600, color: COLORS.ink, marginTop: 18 }}>
            {t('Mientras tanto, mira lo que te has perdido:')}
          </P>
          <ul style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              {t('Pipeline de reservas con kanban visual')}
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              {t('Emailbot que responde a leads 24/7')}
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              {t('Importer IA: tu genealogía en 12 segundos')}
            </li>
          </ul>
        </>
      ) : (
        <>
          <P style={{ fontWeight: 600, color: COLORS.ink, marginTop: 18 }}>
            {t('Tu perro tiene su ficha esperándote:')}
          </P>
          <ul style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              {t('Genealogía completa con árbol genealógico')}
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              {t('Recordatorios automáticos de vacunas')}
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              {t('Papeles digitalizados siempre a mano')}
            </li>
          </ul>
        </>
      )}

      <Btn href={`${SITE_URL}/dashboard`}>
        {isFinal ? t('Volver a Genealogic') : t('Entrar a Genealogic')}
      </Btn>

      {isFinal && (
        <P style={{ color: COLORS.muted, fontSize: 13, marginTop: 16 }}>
          {t('Si decides que Genealogic no es para ti, puedes borrar tu cuenta cuando quieras desde tu panel. Sin trámites raros.')}
        </P>
      )}

      <Divider />

      <Small>
        {t('Para dejar de recibir este tipo de avisos, desactiva los emails de marketing en')}{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.muted, textDecoration: 'underline' }}>
          {t('tus preferencias')}
        </a>.
      </Small>
    </EmailLayout>
  )
}
