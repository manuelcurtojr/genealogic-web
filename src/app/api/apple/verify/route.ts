import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySignedTransaction } from '@/lib/apple-iap'
import { activateSubscription, getApplePlan } from '@/lib/subscription-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 })
    }

    let productId: string
    let transactionId: string
    let originalTransactionId: string
    let expiresDate: number | undefined

    if (body.signedTransaction) {
      // JWS signed transaction (preferred)
      const transaction = await verifySignedTransaction(body.signedTransaction)
      productId = transaction.productId
      transactionId = transaction.transactionId
      originalTransactionId = transaction.originalTransactionId
      expiresDate = transaction.expiresDate
    } else if (body.productId && body.transactionId) {
      // Direct transaction data (fallback from StoreKit)
      productId = body.productId
      transactionId = body.transactionId
      originalTransactionId = body.originalTransactionId || body.transactionId
      expiresDate = body.expiresDate
    } else {
      return Response.json({ error: 'Missing transaction data' }, { status: 400 })
    }

    // Map Apple product ID to plan
    const planInfo = getApplePlan(productId)
    if (!planInfo) {
      return Response.json({ error: `Unknown product: ${productId}` }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!profile) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Activate subscription
    await activateSubscription(supabase, {
      userId,
      plan: planInfo.plan,
      billingPeriod: planInfo.billingPeriod,
      storePlatform: 'apple',
      currentPeriodEnd: expiresDate
        ? new Date(expiresDate).toISOString()
        : null,
      cancelAtPeriodEnd: false,
      appleOriginalTransactionId: originalTransactionId,
      appleTransactionId: transactionId,
    })

    return Response.json({
      success: true,
      plan: planInfo.plan,
      billingPeriod: planInfo.billingPeriod,
      role: planInfo.plan,
    })
  } catch (err: any) {
    console.error('Apple verify error:', err)
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
