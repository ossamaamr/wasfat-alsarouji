// ضغط/تصغير الصورة قبل الرفع — يمنع فشل رفع صور الهاتف الكبيرة ويُسرّعه
export async function compressImage(file, maxDim = 1400, quality = 0.82) {
  try {
    if (!file || !file.type?.startsWith('image/')) return file
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = dataUrl
    })
    let { width, height } = img
    if (width > maxDim || height > maxDim) {
      const s = Math.min(maxDim / width, maxDim / height)
      width = Math.round(width * s)
      height = Math.round(height * s)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
    // إن فشل الضغط لأي سبب نُعيد الملف الأصلي
    return blob && blob.size > 0 ? blob : file
  } catch {
    return file
  }
}
