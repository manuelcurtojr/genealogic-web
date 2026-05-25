/**
 * Mini script para mandar un email de prueba desde local.
 *
 * Uso:
 *   RESEND_API_KEY=re_xxx node scripts/send-test-email.mjs <template> <to>
 *
 * Templates válidos:
 *   welcome_breeder, welcome_owner, reservation_new, message_new,
 *   claim_approved, claim_rejected, support_replied,
 *   subscription_activated, subscription_cancelled, payment_failed
 */
import React from 'react'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import WelcomeBreederEmail from '../src/emails/welcome-breeder.tsx'
import WelcomeOwnerEmail from '../src/emails/welcome-owner.tsx'
import ReservationNewEmail from '../src/emails/reservation-new.tsx'
import MessageNewEmail from '../src/emails/message-new.tsx'
import ClaimApprovedEmail from '../src/emails/claim-approved.tsx'
import ClaimRejectedEmail from '../src/emails/claim-rejected.tsx'
import SupportRepliedEmail from '../src/emails/support-replied.tsx'
import SubscriptionActivatedEmail from '../src/emails/subscription-activated.tsx'
import SubscriptionCancelledEmail from '../src/emails/subscription-cancelled.tsx'
import PaymentFailedEmail from '../src/emails/payment-failed.tsx'

const [, , template, to] = process.argv
if (!template || !to) {
  console.error('Uso: node scripts/send-test-email.mjs <template> <to>')
  process.exit(1)
}

const TEMPLATES = {
  welcome_breeder: {
    component: WelcomeBreederEmail,
    props: { displayName: 'Manuel Curtó' },
    subject: '👋 Bienvenido a Genealogic',
  },
  welcome_owner: {
    component: WelcomeOwnerEmail,
    props: { displayName: 'Manuel Curtó' },
    subject: '👋 Bienvenido a Genealogic',
  },
  reservation_new: {
    component: ReservationNewEmail,
    props: {
      breederName: 'Manuel',
      kennelName: 'Irema Curtó',
      clientName: 'Laura García',
      clientEmail: 'laura@ejemplo.com',
      clientMessage: 'Hola! Estoy interesada en un cachorro hembra de pelo largo para verano. Soy de Madrid y tengo experiencia con la raza. Gracias!',
      reservationId: '00000000-0000-0000-0000-000000000001',
      preferredSex: 'female',
      preferredBreed: 'Cocker Spaniel Inglés',
    },
    subject: 'Nueva reserva de Laura García para Irema Curtó',
  },
  message_new: {
    component: MessageNewEmail,
    props: {
      recipientName: 'Manuel',
      senderName: 'Laura García',
      preview: 'Hola, quería confirmar la cita del jueves para visitar a los cachorros. ¿A qué hora os va bien?',
      reservationId: '00000000-0000-0000-0000-000000000001',
      recipientIsBreeder: true,
    },
    subject: 'Laura García te ha escrito en Genealogic',
  },
  claim_approved: {
    component: ClaimApprovedEmail,
    props: {
      recipientName: 'Manuel',
      targetType: 'dog',
      targetName: 'Rocky de los Pirineos',
      targetUrl: 'https://genealogic.io/dogs/rocky-de-los-pirineos',
      resolutionNote: 'Documentación verificada. Bienvenido oficialmente.',
    },
    subject: '✓ Tu reclamación de Rocky de los Pirineos ha sido aprobada',
  },
  claim_rejected: {
    component: ClaimRejectedEmail,
    props: {
      recipientName: 'Manuel',
      targetType: 'kennel',
      targetName: 'Criadero Ejemplo',
      resolutionNote: 'El certificado del afijo aportado no coincide con el nombre del titular del criadero en nuestros registros. Si dispones de documentación adicional, por favor adjúntala como respuesta.',
      requestId: '00000000-0000-0000-0000-000000000001',
    },
    subject: 'Sobre tu reclamación de Criadero Ejemplo',
  },
  support_replied: {
    component: SupportRepliedEmail,
    props: {
      recipientName: 'Manuel',
      requestSubject: 'No me llegan emails del bot',
      adminMessagePreview: 'Hola Manuel, hemos revisado tu configuración del Emailbot. El problema era una regla de spam mal configurada en tu Gmail. Lo hemos corregido y ya deberías recibir los avisos.',
      requestId: '00000000-0000-0000-0000-000000000001',
    },
    subject: 'Re: No me llegan emails del bot',
  },
  subscription_activated: {
    component: SubscriptionActivatedEmail,
    props: { recipientName: 'Manuel', plan: 'pro' },
    subject: '✓ Genealogic Pro activado',
  },
  subscription_cancelled: {
    component: SubscriptionCancelledEmail,
    props: { recipientName: 'Manuel' },
    subject: 'Tu suscripción de Genealogic ha terminado',
  },
  payment_failed: {
    component: PaymentFailedEmail,
    props: {
      recipientName: 'Manuel',
      hostedInvoiceUrl: 'https://invoice.stripe.com/i/example',
      amountDueCents: 3900,
      currency: 'eur',
    },
    subject: 'No hemos podido cobrar tu suscripción',
  },
}

const cfg = TEMPLATES[template]
if (!cfg) {
  console.error(`Template desconocido: ${template}`)
  console.error('Disponibles:', Object.keys(TEMPLATES).join(', '))
  process.exit(1)
}

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) {
  console.error('Falta RESEND_API_KEY')
  process.exit(1)
}

const resend = new Resend(apiKey)
// Los .tsx exportan default vía `export default function`. Con tsx loader
// pueden venir como objeto { default: fn } según el path de resolución.
const Comp = typeof cfg.component === 'function' ? cfg.component : cfg.component.default
const html = await render(React.createElement(Comp, cfg.props))

const { data, error } = await resend.emails.send({
  from: 'Genealogic <hola@genealogic.io>',
  to,
  subject: cfg.subject,
  html,
  replyTo: 'hola@genealogic.io',
})

if (error) {
  console.error('✗ ERROR:', JSON.stringify(error, null, 2))
  process.exit(1)
}
console.log(`✓ ${template} → ${to}`)
console.log(`  id: ${data.id}`)
