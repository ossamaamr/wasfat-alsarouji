// إنشاء مستخدم جديد بواسطة الأدمن — يعمل بصلاحية service role بأمان في الخادم
// Deno / Supabase Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const EMAIL_DOMAIN = Deno.env.get('AUTH_EMAIL_DOMAIN') ?? 'sarouji.local'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return jsonResponse({ error: 'مطلوب تسجيل الدخول' }, 401)

    // عميل بصلاحية service role للعمليات الإدارية
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // التحقق من هوية الطالب عبر رمزه
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await caller.auth.getUser()
    const callerId = userData?.user?.id

    // هل يوجد أي مستخدم؟ (للسماح بإنشاء أول أدمن)
    const { count } = await admin
      .from('users')
      .select('id', { count: 'exact', head: true })
    const isBootstrap = (count ?? 0) === 0

    if (!isBootstrap) {
      if (!callerId) return jsonResponse({ error: 'غير مصرّح' }, 401)
      const { data: callerRow } = await admin
        .from('users')
        .select('role')
        .eq('id', callerId)
        .single()
      if (callerRow?.role !== 'admin') {
        return jsonResponse({ error: 'هذه العملية للأدمن فقط' }, 403)
      }
    }

    const body = await req.json()
    const loginId = String(body.login_id ?? '').trim().toLowerCase()
    const role = ['member', 'supervisor', 'admin'].includes(body.role) ? body.role : 'member'
    const tempPassword = String(body.temp_password ?? '').trim()

    if (!/^[a-z0-9._-]{3,}$/.test(loginId)) {
      return jsonResponse({ error: 'المعرّف غير صالح (أحرف/أرقام إنجليزية، 3 على الأقل)' }, 400)
    }
    if (tempPassword.length < 6) {
      return jsonResponse({ error: 'كلمة المرور المؤقتة يجب أن تكون 6 أحرف على الأقل' }, 400)
    }

    const email = `${loginId}@${EMAIL_DOMAIN}`

    // إنشاء حساب المصادقة
    const { data: authUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (createErr) {
      const msg = createErr.message?.includes('already registered')
        ? 'هذا المعرّف مستخدم مسبقًا'
        : createErr.message
      return jsonResponse({ error: msg }, 400)
    }

    // إنشاء ملف المستخدم
    const { error: profileErr } = await admin.from('users').insert({
      id: authUser.user.id,
      login_id: loginId,
      role,
      status: 'pending',
    })
    if (profileErr) {
      // تراجع: احذف حساب المصادقة إن فشل إنشاء الملف
      await admin.auth.admin.deleteUser(authUser.user.id)
      return jsonResponse({ error: profileErr.message }, 400)
    }

    return jsonResponse({ user_id: authUser.user.id, login_id: loginId, role })
  } catch (err) {
    return jsonResponse({ error: (err as Error).message ?? 'خطأ غير متوقع' }, 500)
  }
})
