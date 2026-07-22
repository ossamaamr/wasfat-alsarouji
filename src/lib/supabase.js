import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const AUTH_EMAIL_DOMAIN =
  import.meta.env.VITE_AUTH_EMAIL_DOMAIN || 'sarouji.local'

if (!url || !anonKey) {
  // رسالة واضحة أثناء التطوير إن نُسي ملف .env
  console.warn(
    '⚠️ لم يتم ضبط VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY. انسخ .env.example إلى .env واملأ القيم.'
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// المعرّف الذي ينشئه الأدمن يُحوَّل إلى بريد داخلي للمصادقة (لا يُرسَل إليه بريد فعلي)
export function loginIdToEmail(loginId) {
  const clean = String(loginId).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  return `${clean}@${AUTH_EMAIL_DOMAIN}`
}

export const isConfigured = Boolean(url && anonKey)
