import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import * as http2 from 'http2'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APNS_TOPIC = 'com.genealogic.app'

// Cached config from platform_settings
let apnsConfig: { keyId: string; teamId: string; p8Key: string; host: string } | null = null
let cachedJWT: { token: string; expiry: number } | null = null

async function getAPNsConfig() {
  if (apnsConfig) return apnsConfig

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['APNS_KEY_ID', 'APNS_TEAM_ID', 'APNS_KEY_P8', 'APNS_PRODUCTION'])

  const map = Object.fromEntries((data || []).map(d => [d.key, d.value]))

  if (!map.APNS_KEY_ID || !map.APNS_TEAM_ID || !map.APNS_KEY_P8) return null

  apnsConfig = {
    keyId: map.APNS_KEY_ID,
    teamId: map.APNS_TEAM_ID,
    p8Key: Buffer.from(map.APNS_KEY_P8, 'base64').toString('utf8'),
    host: map.APNS_PRODUCTION === 'true' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com',
  }
  return apnsConfig
}

function generateAPNsJWT(config: NonNullable<typeof apnsConfig>): string {
  const now = Math.floor(Date.now() / 1000)
  if (cachedJWT && cachedJWT.expiry > now) return cachedJWT.token

  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: config.keyId })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: config.teamId, iat: now })).toString('base64url')
  const signingInput = `${header}.${payload}`

  const sign = crypto.createSign('SHA256')
  sign.update(signingInput)
  const signature = sign.sign(config.p8Key, 'base64url')

  const jwt = `${signingInput}.${signature}`
  cachedJWT = { token: jwt, expiry: now + 3000 }
  return jwt
}

function sendAPNsHTTP2(config: NonNullable<typeof apnsConfig>, deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
  return new Promise((resolve) => {
    const jwt = generateAPNsJWT(config)

    const payload = JSON.stringify({
      aps: {
        alert: { title, body },
        sound: 'default',
        badge: 1,
      },
      ...data,
    })

    try {
      const client = http2.connect(`https://${config.host}`)

      client.on('error', (err) => {
        console.error('APNs HTTP/2 connection error:', err)
        resolve(false)
      })

      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'authorization': `bearer ${jwt}`,
        'apns-topic': APNS_TOPIC,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
      })

      let status = 0
      let responseData = ''

      req.on('response', (headers) => {
        status = headers[':status'] as number || 0
      })

      req.on('data', (chunk) => {
        responseData += chunk
      })

      req.on('end', () => {
        client.close()
        if (status === 200) {
          resolve(true)
        } else {
          console.error(`APNs error (${status}):`, responseData)
          resolve(false)
        }
      })

      req.on('error', (err) => {
        console.error('APNs request error:', err)
        client.close()
        resolve(false)
      })

      req.write(payload)
      req.end()
    } catch (err) {
      console.error('APNs send error:', err)
      resolve(false)
    }
  })
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
  const config = await getAPNsConfig()
  if (!config) {
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
    const ok = await sendAPNsHTTP2(config, token, title, body, data)
    if (ok) sent++
    else failed++
  }

  return { sent, failed }
}
