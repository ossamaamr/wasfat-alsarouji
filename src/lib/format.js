// أدوات عرض عربية

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function timeAgo(value) {
  if (!value) return ''
  const d = new Date(value)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'الآن'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `قبل ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `قبل ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 30) return `قبل ${days} يوم`
  return formatDate(value)
}

export const ROLE_LABELS = {
  admin: 'أدمن',
  supervisor: 'مشرف',
  member: 'عضو',
}

export const STATUS_LABELS = {
  pending: 'قيد المراجعة',
  approved: 'معتمدة',
  rejected: 'ملغاة',
}

export const USER_STATUS_LABELS = {
  pending: 'بانتظار الإعداد',
  active: 'مفعّل',
  disabled: 'معطّل',
}

// تحويل نص متعدد الأسطر إلى قائمة عناصر (للمكوّنات والخطوات)
export function toLines(text) {
  if (!text) return []
  return String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}
