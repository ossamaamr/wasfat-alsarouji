# 🍲 وصفات أبناء عمرو السروجي

أرشيف عائلي خاص للوصفات — تطبيق مغلق لا يُنشر للعامة، الدخول فيه عبر معرّف يُنشئه
المسؤول (الأدمن) لكل فرد. كل وصفة تمرّ على مشرف قبل أن تظهر للعائلة، والواجهة عربية
بالكامل من اليمين إلى اليسار.

> بُني حسب «وثيقة مواصفات ومتطلبات المشروع».

---

## ✨ الميزات

- **دخول بالمعرّف**: يُنشئ الأدمن معرّفًا لكل فرد، ويعيّن المستخدم كلمة مرور واسمه في أول دخول.
- **إضافة وصفة**: عنوان، تصنيف، مكوّنات، خطوات، وصورة اختيارية.
- **دورة مراجعة**: اعتماد / تعديل واعتماد / إلغاء — بأدوار (عضو، مشرف، أدمن).
- **إشعارات**: داخلية في التطبيق + دفع خارجي عبر FCM على أندرويد.
- **صندوق اقتراحات**: يصل مباشرة إلى بريد الأدمن + يظهر في لوحته.
- **تصفّح دون اتصال**: قراءة الوصفات المعتمدة المحفوظة محليًا (IndexedDB).
- **أمان على مستوى الصف (RLS)**: كل قرار حسّاس محكوم في قاعدة البيانات لا في الواجهة فقط.
- **راحة القراءة**: تكبير الخط ووضع ليلي اختياريان.

## 🧱 التقنيات

| الطبقة | التقنية |
|---|---|
| الواجهة | React (Vite) |
| التغليف لأندرويد | Capacitor |
| الخدمة الخلفية | Supabase (Postgres + Auth + Storage + Edge Functions) |
| الإشعارات الخارجية | Firebase Cloud Messaging (FCM) |
| بريد الاقتراحات | Resend |
| التخزين المحلي | IndexedDB |
| البناء والتوزيع | GitHub Actions |

## 📂 بنية المشروع

```
├─ index.html
├─ src/
│  ├─ main.jsx / App.jsx        # الجذر والتوجيه والحماية
│  ├─ index.css                 # نظام التصميم (RTL، ثيم دافئ)
│  ├─ context/AuthContext.jsx   # المصادقة والأدوار
│  ├─ components/               # Layout، مكوّنات واجهة مشتركة
│  ├─ hooks/                    # useOnline
│  ├─ lib/                      # supabase, api, offline, push, format
│  └─ pages/                    # الشاشات (دخول، رئيسية، وصفة، مراجعة، أدمن…)
├─ supabase/
│  ├─ schema.sql                # الجداول + RLS + الدوال + المشغّلات
│  ├─ seed.sql                  # إنشاء أول أدمن
│  └─ functions/                # Edge Functions (إنشاء مستخدم، بريد، دفع)
├─ capacitor.config.json
└─ .github/workflows/build.yml  # بناء APK تلقائيًا
```

---

## 🚀 الإعداد خطوة بخطوة

### 1) المتطلبات
- Node.js 20+ و npm
- حساب [Supabase](https://supabase.com) (مجاني)
- (للأندرويد) Android Studio أو JDK 17 + Android SDK
- (للإشعارات) مشروع [Firebase](https://firebase.google.com)
- (لبريد الاقتراحات) حساب [Resend](https://resend.com)

### 2) تثبيت الحزم
```bash
npm install
```

### 3) إنشاء مشروع Supabase
أنشئ مشروعًا جديدًا، ثم من **Project Settings → API** انسخ:
- `Project URL`
- `anon public key`

### 4) تجهيز قاعدة البيانات
افتح **SQL Editor** في Supabase و:
1. الصق محتوى [`supabase/schema.sql`](supabase/schema.sql) واضغط **Run**.
2. أنشئ أول أدمن باتباع التعليمات في [`supabase/seed.sql`](supabase/seed.sql):
   - **Authentication → Users → Add user**: البريد `admin@sarouji.local` مع كلمة مرور
     قوية، وفعّل *Auto Confirm User*.
   - شغّل استعلام `seed.sql` لربط الحساب كأدمن.

### 5) ملف البيئة `.env`
```bash
cp .env.example .env
```
واملأ القيم:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_AUTH_EMAIL_DOMAIN=sarouji.local
```

### 6) التشغيل محليًا
```bash
npm run dev
```
ادخل بالمعرّف `admin` وكلمة المرور التي اخترتها، ثم أنشئ بقية أفراد العائلة من
**لوحة الأدمن**.

---

## ☁️ نشر Edge Functions

ثبّت [Supabase CLI](https://supabase.com/docs/guides/cli) ثم:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>

supabase functions deploy admin-create-user
supabase functions deploy notify-suggestion
supabase functions deploy push-on-approve
```

### الأسرار (Function Secrets)
```bash
# مشتركة
supabase secrets set AUTH_EMAIL_DOMAIN=sarouji.local

# بريد الاقتراحات (Resend)
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set ADMIN_NOTIFICATION_EMAIL=your-real-email@gmail.com
supabase secrets set RESEND_FROM_EMAIL="وصفات العائلة <onboarding@resend.dev>"

# الدفع الخارجي (Firebase — من ملف حساب الخدمة)
supabase secrets set FCM_PROJECT_ID=your-firebase-project-id
supabase secrets set FCM_CLIENT_EMAIL=firebase-adminsdk-xxx@....iam.gserviceaccount.com
supabase secrets set FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
> `SUPABASE_URL` و `SUPABASE_ANON_KEY` و `SUPABASE_SERVICE_ROLE_KEY` تُضاف تلقائيًا في بيئة الدوال.

### ربط المشغّلات بالبريد والدفع (Database Webhooks)
من **Database → Webhooks** أنشئ:
1. **عند INSERT على `suggestions`** → استدعاء دالة `notify-suggestion`.
2. **عند INSERT على `notifications`** → استدعاء دالة `push-on-approve`.

---

## 📱 الإشعارات الخارجية (FCM) وبناء أندرويد

1. في Firebase أنشئ تطبيق أندرويد باسم الحزمة `com.sarouji.wasfat`.
2. نزّل `google-services.json` وضعه في `android/app/`.
3. من **Project Settings → Service accounts** ولّد مفتاحًا خاصًا (JSON) واستخدم
   قيمه في أسرار `FCM_*` أعلاه.

### بناء محليًا
```bash
npm run build
npx cap sync android
npx cap open android      # ثم Build > Build APK من Android Studio
```

### بناء تلقائي (GitHub Actions)
أضف أسرار المستودع: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_AUTH_EMAIL_DOMAIN`, و (اختياريًا) `GOOGLE_SERVICES_JSON`. كل دفع إلى `main`
يبني ملف APK ويرفعه ضمن *Artifacts*.

---

## 👥 الأدوار والصلاحيات

| الصلاحية | عضو | مشرف | أدمن |
|---|:---:|:---:|:---:|
| إضافة وصفة وتصفّح المعتمد | ✓ | ✓ | ✓ |
| إرسال اقتراح | ✓ | ✓ | ✓ |
| اعتماد / تعديل / إلغاء الوصفات | ✗ | ✓ | ✓ |
| إنشاء المعرّفات وإدارة المستخدمين | ✗ | ✗ | ✓ |
| تعيين الأدوار والاطلاع على الاقتراحات | ✗ | ✗ | ✓ |

## 🔒 ملاحظات أمان
- كلمات المرور مُعمّاة داخل Supabase Auth.
- الوصول محكوم بسياسات RLS على مستوى الصف — لا يمكن التلاعب من طرف الواجهة.
- المستخدم المعطّل يُخرَج فورًا عند محاولة الاستخدام.
- إنشاء المستخدمين يتم فقط عبر Edge Function تعمل بصلاحية service role في الخادم.

## 📄 الترخيص
مشروع عائلي خاص — جميع الحقوق محفوظة لعائلة أبناء عمرو السروجي.
