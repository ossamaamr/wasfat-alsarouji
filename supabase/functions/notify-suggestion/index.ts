// إرسال بريد للأدمن عند وصول اقتراح جديد — عبر Resend
// يُستدعى من: Supabase → Database Webhooks (INSERT على جدول suggestions)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')!
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'اقتراحات <onboarding@resend.dev>'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const record = payload.record ?? payload // يدعم صيغة الـ webhook أو استدعاءً مباشرًا
    const message: string = record?.message ?? ''
    const userId: string | undefined = record?.user_id

    let author = 'أحد أفراد العائلة'
    if (userId) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
      const { data } = await admin
        .from('users')
        .select('display_name, login_id')
        .eq('id', userId)
        .single()
      author = data?.display_name || data?.login_id || author
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: '💡 اقتراح جديد في تطبيق وصفات العائلة',
        html: `
          <div dir="rtl" style="font-family: Tahoma, sans-serif; line-height: 1.8;">
            <h2>اقتراح جديد</h2>
            <p><b>من:</b> ${author}</p>
            <p style="background:#f4ece0;padding:14px;border-radius:10px;">${escapeHtml(message)}</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return jsonResponse({ error: `فشل إرسال البريد: ${text}` }, 502)
    }
    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500)
  }
})

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
