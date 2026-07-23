// التخزين المحلي للعمل دون اتصال (قراءة الوصفات المعتمدة + صورها)
import { openDB } from 'idb'

const DB_NAME = 'sarouji-recipes'
const DB_VERSION = 2

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('recipes')) db.createObjectStore('recipes', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    if (!db.objectStoreNames.contains('images')) db.createObjectStore('images') // key = url, value = Blob
  },
})

// تنزيل صور الوصفات وتخزينها محليًا (أفضل جهد، لا يعطّل شيئًا)
async function cacheImages(recipes) {
  try {
    const db = await dbPromise
    for (const r of recipes) {
      if (!r.image_url) continue
      const exists = await db.get('images', r.image_url)
      if (exists) continue
      try {
        const resp = await fetch(r.image_url)
        if (resp.ok) await db.put('images', await resp.blob(), r.image_url)
      } catch { /* تجاهل صورة واحدة */ }
    }
  } catch { /* تجاهل */ }
}

// استبدال روابط الصور بروابط محلية عند توفّرها (للعرض دون اتصال)
async function withLocalImages(recipes) {
  const db = await dbPromise
  const list = Array.isArray(recipes) ? recipes : [recipes]
  for (const r of list) {
    if (!r?.image_url) continue
    try {
      const blob = await db.get('images', r.image_url)
      if (blob) r.image_url = URL.createObjectURL(blob)
    } catch { /* تجاهل */ }
  }
  return recipes
}

export async function cacheRecipes(recipes) {
  const db = await dbPromise
  const tx = db.transaction('recipes', 'readwrite')
  await tx.store.clear()
  for (const r of recipes) await tx.store.put(r)
  await tx.done
  await db.put('meta', new Date().toISOString(), 'recipes_synced_at')
  // نزّل الصور في الخلفية دون انتظار
  cacheImages(recipes)
}

export async function getCachedRecipes() {
  const db = await dbPromise
  const recipes = await db.getAll('recipes')
  return withLocalImages(recipes)
}

export async function getCachedRecipe(id) {
  const db = await dbPromise
  const recipe = await db.get('recipes', id)
  if (recipe) await withLocalImages(recipe)
  return recipe
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
