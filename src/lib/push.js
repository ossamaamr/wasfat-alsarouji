// تسجيل الجهاز لاستقبال الإشعارات الخارجية (يعمل على أندرويد فقط عبر Capacitor)
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

let registered = false

export async function registerPush(userId) {
  // على الويب لا يوجد دفع خارجي — نتجاهل بهدوء
  if (!Capacitor.isNativePlatform() || registered || !userId) return
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()
    registered = true

    PushNotifications.addListener('registration', async (token) => {
      await supabase
        .from('push_tokens')
        .upsert({ user_id: userId, token: token.value }, { onConflict: 'user_id,token' })
    })

    PushNotifications.addListener('registrationError', (err) => {
      console.warn('تعذّر تسجيل الإشعارات:', err)
    })
  } catch (err) {
    console.warn('الإشعارات الخارجية غير متاحة:', err)
  }
}
