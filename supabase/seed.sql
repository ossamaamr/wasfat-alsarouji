-- ══════════════════════════════════════════════════════════════════════
--  إنشاء أول أدمن (يُشغَّل مرة واحدة بعد schema.sql)
-- ══════════════════════════════════════════════════════════════════════
--
--  الخطوة 1: من لوحة Supabase → Authentication → Users → Add user
--            • Email:  admin@sarouji.local
--            • Password: (اختر كلمة مرور قوية وتذكّرها)
--            • فعّل "Auto Confirm User"
--
--  الخطوة 2: شغّل هذا الاستعلام في SQL Editor لربط الحساب كأدمن:

insert into public.users (id, login_id, display_name, role, status)
select id, 'admin', 'المسؤول', 'admin', 'active'
from auth.users
where email = 'admin@sarouji.local'
on conflict (id) do update
  set role = 'admin', status = 'active';

--  الآن ادخل التطبيق بالمعرّف "admin" وكلمة المرور التي اخترتها،
--  ومن «لوحة الأدمن» أنشئ بقية أفراد العائلة.
--
--  ملاحظة: النطاق sarouji.local داخلي فقط للمصادقة ولا يُرسَل إليه أي بريد.
--  يجب أن يطابق قيمة VITE_AUTH_EMAIL_DOMAIN في ملف .env.
