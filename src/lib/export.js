// نسخ احتياطي وتصدير الوصفات
import { toLines, formatDate } from './format'

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// نسخة احتياطية بصيغة JSON (بيانات كاملة)
export function exportJSON(recipes) {
  const payload = {
    app: 'وصفات أسرة السَّروجيُّ',
    exported_at: new Date().toISOString(),
    count: recipes.length,
    recipes: recipes.map((r) => ({
      title: r.title,
      category: r.category?.name || null,
      author: r.author?.display_name || null,
      status: r.status,
      ingredients: r.ingredients,
      steps: r.steps,
      image_url: r.image_url || null,
      created_at: r.created_at,
    })),
  }
  download('نسخة-احتياطية-وصفات.json', JSON.stringify(payload, null, 2), 'application/json')
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// كتاب عائلي أنيق (HTML قابل للطباعة / الحفظ PDF من المتصفح)
export function exportCookbookHTML(recipes) {
  const approved = recipes.filter((r) => r.status === 'approved')
  const pages = approved
    .map((r) => {
      const ing = toLines(r.ingredients).map((l) => `<li>${esc(l)}</li>`).join('')
      const steps = toLines(r.steps).map((l) => `<li>${esc(l)}</li>`).join('')
      const img = r.image_url ? `<img src="${esc(r.image_url)}" alt="">` : ''
      return `<article>
        <h2>${esc(r.title)}</h2>
        <div class="meta">${esc(r.category?.name || '')}${r.author?.display_name ? ' · 👩‍🍳 ' + esc(r.author.display_name) : ''}</div>
        ${img}
        <h3>المكوّنات</h3><ul>${ing}</ul>
        <h3>طريقة التحضير</h3><ol>${steps}</ol>
      </article>`
    })
    .join('')

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>كتاب وصفات أسرة السَّروجيُّ</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Cairo', Tahoma, sans-serif; color: #2c211c; margin: 0; background: #fff; line-height: 1.8; }
    .cover { text-align: center; padding: 30vh 20px; page-break-after: always; background: #7c342a; color: #fff; }
    .cover h1 { font-size: 2.6rem; margin: 0 0 10px; }
    .cover p { color: #f0d18a; font-size: 1.1rem; }
    article { padding: 28px 32px; page-break-inside: avoid; border-bottom: 1px solid #eee; }
    article:not(:last-child) { page-break-after: always; }
    h2 { color: #8a3b2e; font-size: 1.7rem; margin: 0 0 4px; }
    .meta { color: #6b5d54; margin-bottom: 14px; }
    img { width: 100%; max-height: 320px; object-fit: cover; border-radius: 12px; margin-bottom: 16px; }
    h3 { color: #4d7c4a; margin: 18px 0 6px; }
    ul, ol { margin: 0; padding-inline-start: 22px; }
    li { margin: 4px 0; }
    @media print { .noprint { display: none; } }
  </style></head><body>
  <div class="cover"><h1>🍲 كتاب وصفات أسرة السَّروجيُّ</h1><p>${approved.length} وصفة · ${formatDate(new Date().toISOString())}</p></div>
  <p class="noprint" style="padding:14px 20px;background:#f8efd6;color:#8f5813;margin:0;">للحفظ كملف PDF: افتح هذا الملف في المتصفح ثم اطبع ← «حفظ كـ PDF».</p>
  ${pages}
  <p style="text-align:center;color:#6b5d54;padding:24px;">من تطوير وإدارة: أسامة بن عمرو السَّروجي</p>
  </body></html>`
  download('كتاب-وصفات-أسرة-السروجي.html', html, 'text/html')
}
