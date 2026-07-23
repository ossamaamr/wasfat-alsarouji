// طبقة الوصول للبيانات — كل الاستعلامات في مكان واحد
import { supabase } from './supabase'
import { cacheRecipes, getCachedRecipes, getCachedRecipe, cacheCategories, getCachedCategories } from './offline'

const RECIPE_SELECT = `
  id, title, category_id, ingredients, steps, image_url, status,
  author_id, approved_by, created_at, updated_at,
  category:categories(id, name),
  author:users!recipes_author_id_fkey(id, display_name)
`

// ── التصنيفات ──
export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) {
    const cached = await getCachedCategories()
    if (cached.length) return cached
    throw error
  }
  await cacheCategories(data)
  return data
}

export async function createCategory(name) {
  const { data, error } = await supabase.from('categories').insert({ name: name.trim() }).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ── الوصفات المعتمدة (الرئيسية) ──
export async function fetchApprovedRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) {
    // fallback دون اتصال
    const cached = await getCachedRecipes()
    if (cached.length) return { data: cached, offline: true }
    throw error
  }
  await cacheRecipes(data)
  return { data, offline: false }
}

export async function fetchRecipeById(id) {
  const { data, error } = await supabase.from('recipes').select(RECIPE_SELECT).eq('id', id).single()
  if (error) {
    const cached = await getCachedRecipe(id)
    if (cached) return cached
    throw error
  }
  return data
}

export async function fetchMyRecipes(userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchPendingRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createRecipe(payload) {
  const { data, error } = await supabase.from('recipes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateRecipe(id, payload) {
  const { data, error } = await supabase.from('recipes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

// إجراءات المراجعة: اعتماد / إلغاء
export async function approveRecipe(id) {
  const { data, error } = await supabase.rpc('approve_recipe', { p_recipe_id: id })
  if (error) throw error
  return data
}

export async function rejectRecipe(id) {
  const { data, error } = await supabase
    .from('recipes')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

// ── رفع الصور ──
export async function uploadRecipeImage(file, userId) {
  // بعد الضغط تصبح الصورة Blob بلا اسم — نعتمد jpg
  const rawExt = file.name ? file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const ext = rawExt && rawExt.length <= 5 ? rawExt : 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('recipe-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
  return data.publicUrl
}

// ── الإشعارات ──
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, recipe:recipes(id, title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

// ── الاقتراحات ──
export async function createSuggestion(message) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('suggestions')
    .insert({ message: message.trim(), user_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchSuggestions() {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*, user:users(id, display_name, login_id)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── إدارة المستخدمين (أدمن) ──
export async function fetchUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// إنشاء مستخدم عبر دالة قاعدة بيانات (SECURITY DEFINER) — لا تحتاج Edge Function
export async function adminCreateUser({ loginId, role, tempPassword }) {
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_login_id: loginId,
    p_role: role,
    p_password: tempPassword,
  })
  if (error) throw error
  return data
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabase.rpc('admin_set_role', { p_user_id: userId, p_role: role })
  if (error) throw error
  return data
}

export async function updateUserStatus(userId, status) {
  const { data, error } = await supabase.rpc('admin_set_status', { p_user_id: userId, p_status: status })
  if (error) throw error
  return data
}
