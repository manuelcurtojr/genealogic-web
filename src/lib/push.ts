import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// APNs config
const APNS_KEY_ID = process.env.APNS_KEY_ID || ''
const APNS_TEAM_ID = process.env.APNS_TEAM_ID || ''
const APNS_KEY_P8 = process.env.APNS_KEY_P8 || '' // base64 encoded .p8 content
const APNS_TOPIC = 'com.genealogic.app'
const APNS_HOST = process.env.APNS_PRODUCTION === 'true'
  ? 'api.push.apple.com'
  : 'api.sandbox.push.apple.com'

// Cache JWT for reuse (valid for 1 hour, we refresh every 50 min)
let cachedJWT: { token: string; expiry: number } | null = null

function generateAPNsJWT(): string {
  const now = Math.floor(Date.now() / 1000)

  // Return cached if still valid
  if (cachedJWT && cachedJWT.expiry > now) return cachedJWT.token

  const header = Buffer.from(JSON.stringify({
    alg: 'ES256',
    kid: APNS_KEY_ID,
  })).toString('base64url')

  const payload = Buffer.from(JSON.stringify({
    iss: APNS_TEAM_ID,
    iat: now,
  })).toString('base64url')

  const signingInput = `${header}.${payload}`

  // Decode p8 key from base64
  const p8Key = Buffer.from(APNS_KEY_P8, 'base64').toString('utf8')

  const sign = crypto.createSign('SHA256')
  sign.update(signingInput)
  const signature = sign.sign(p8Key, 'base64url')

  const jwt = `${signingInput}.${signature}`
  cachedJWT = { token: jwt, expiry: now + 3000 } // 50 min

  return jwt
}

async function sendAPNs(deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
  const jwt = generateAPNsJWT()

  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
    },
    ...data,
  }

  try {
    const res = await fetch(`https://${APNS_HOST}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': APNS_TOPIC,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`APNs error (${res.status}):`, err)
      return false
    }
    return true
  } catch (err) {
    console.error('APNs fetch error:', err)
    return false
  }
}

/**
 * Send push notification to a user's devices
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_KEY_P8) {
    console.warn('APNs not configured, skipping push notification')
    return { sent: 0, failed: 0 }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId)

  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0 }

  let sent = 0
  let failed = 0

  for (const { token } of tokens) {
    const ok = await sendAPNs(token, title, body, data)
    if (ok) sent++
    else failed++
  }

  return { sent, failed }
}
