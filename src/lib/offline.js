// التخزين المحلي للعمل دون اتصال (قراءة فقط للوصفات المعتمدة)
import { openDB } from 'idb'

const DB_NAME = 'sarouji-recipes'
const DB_VERSION = 1

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('recipes')) {
      db.createObjectStore('recipes', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('categories')) {
      db.createObjectStore('categories', { keyPath: 'id' })
    }
    if (!db.objectStoreNames.contains('meta')) {
      db.createObjectStore('meta')
    }
  },
})

// تخزين الوصفات المعتمدة محليًا بعد كل جلب ناجح
export async function cacheRecipes(recipes) {
  const db = await dbPromise
  const tx = db.transaction('recipes', 'readwrite')
  // نستبدل الكاش كاملًا بالمعتمد الحالي
  await tx.store.clear()
  for (const r of recipes) await tx.store.put(r)
  await tx.done
  await db.put('meta', new Date().toISOString(), 'recipes_synced_at')
}

export async function getCachedRecipes() {
  const db = await dbPromise
  return db.getAll('recipes')
}

export async function getCachedRecipe(id) {
  const db = await dbPromise
  return db.get('recipes', id)
}

export async function cacheCategories(categories) {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')
  await tx.store.clear()
  for (const c of categories) await tx.store.put(c)
  await tx.done
}

export async function getCachedCategories() {
  const db = await dbPromise
  return db.getAll('categories')
}

export async function getLastSync() {
  const db = await dbPromise
  return db.get('meta', 'recipes_synced_at')
}
