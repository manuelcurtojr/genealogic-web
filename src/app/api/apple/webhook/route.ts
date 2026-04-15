import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyNotificationPayload, verifySignedTransaction } from '@/lib/apple-iap'
import { activateSubscription, cancelSubscription, getApplePlan } from '@/lib/subscription-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signedPayload } = body

    if (!signedPayload) {
      return Response.json({ error: 'Missing signedPayload' }, { status: 400 })
    }

    // Verify and decode the notification
    const notification = await verifyNotificationPayload(signedPayload)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Decode the signed transaction info from the notification data
    let transaction = null
    if (notification.data?.signedTransactionInfo) {
      transaction = await verifySignedTransaction(notification.data.signedTransactionInfo)
    }

    if (!transaction) {
      console.log('Apple webhook: no transaction in notification', notification.notificationType)
      return Response.json({ received: true })
    }

    // Find user by Apple original transaction ID
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('apple_original_transaction_id', transaction.originalTransactionId)
      .single()

    if (!sub) {
      console.log('Apple webhook: no subscription found for', transaction.originalTransactionId)
      return Response.json({ received: true })
    }

    const userId = sub.user_id

    switch (notification.notificationType) {
      case 'DID_RENEW':
      case 'SUBSCRIBED': {
        // Renewal succeeded or new subscription
        const planInfo = getApplePlan(transaction.productId)
        if (planInfo) {
          await activateSubscription(supabase, {
            userId,
            plan: planInfo.plan,
            billingPeriod: planInfo.billingPeriod,
            storePlatform: 'apple',
            currentPeriodEnd: transaction.expiresDate
              ? new Date(transaction.expiresDate).toISOString()
              : null,
            appleOriginalTransactionId: transaction.originalTransactionId,
            appleTransactionId: transaction.transactionId,
          })
        }
        break
      }

      case 'EXPIRED':
      case 'REVOKE':
      case 'GRACE_PERIOD_EXPIRED': {
        // Subscription ended — downgrade to free
        await cancelSubscription(supabase, userId, transaction.originalTransactionId)
        break
      }

      case 'DID_CHANGE_RENEWAL_STATUS': {
        // User toggled auto-renew
        const willAutoRenew = notification.subtype !== 'AUTO_RENEW_DISABLED'
        await supabase.from('subscriptions').update({
          cancel_at_period_end: !willAutoRenew,
        }).eq('user_id', userId)
        break
      }

      case 'DID_FAIL_TO_RENEW': {
        // Billing issue — mark as grace period
        await supabase.from('subscriptions').update({
          status: 'grace_period',
        }).eq('user_id', userId)
        break
      }

      default:
        console.log('Apple webhook: unhandled type', notification.notificationType)
    }

    return Response.json({ received: true })
  } catch (err: any) {
    console.error('Apple webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
