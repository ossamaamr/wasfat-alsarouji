// دفع إشعار خارجي عبر FCM HTTP v1 عند إنشاء إشعار داخل التطبيق
// يُستدعى من: Supabase → Database Webhooks (INSERT على جدول notifications)
//
// أسرار مطلوبة (Function Secrets):
//   FCM_PROJECT_ID           معرّف مشروع Firebase
//   FCM_CLIENT_EMAIL         بريد حساب الخدمة
//   FCM_PRIVATE_KEY          مفتاح حساب الخدمة الخاص (PEM، مع \n)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PROJECT_ID = Deno.env.get('FCM_PROJECT_ID')!
const CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL')!
const PRIVATE_KEY = (Deno.env.get('FCM_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const payload = await req.json()
    const record = payload.record ?? payload
    const userId: string | undefined = record?.user_id
    const title: string = record?.title ?? 'وصفات العائلة'
    const body: string = record?.body ?? ''
    const recipeId: string | undefined = record?.recipe_id ?? undefined
    if (!userId) return jsonResponse({ error: 'user_id مفقود' }, 400)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
    const { data: tokens } = await admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
    if (!tokens || tokens.length === 0) return jsonResponse({ ok: true, sent: 0 })

    const accessToken = await getAccessToken()

    let sent = 0
    for (const { token } of tokens) {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: recipeId ? { recipe_id: String(recipeId) } : {},
              android: { priority: 'high' },
            },
          }),
        }
      )
      if (res.ok) sent++
      else if (res.status === 404 || res.status === 400) {
        // رمز جهاز غير صالح — نحذفه
        await admin.from('push_tokens').delete().eq('token', token)
      }
    }
    return jsonResponse({ ok: true, sent })
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500)
  }
})

// ── الحصول على رمز وصول OAuth2 من حساب الخدمة (RS256 JWT) ──
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)))
  const unsigned = `${enc(header)}.${enc(claim)}`

  const key = await importPrivateKey(PRIVATE_KEY)
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  )
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('تعذّر الحصول على رمز الوصول من Google')
  return data.access_token
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
