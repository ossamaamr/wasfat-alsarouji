-- ══════════════════════════════════════════════════════════════════════
--  وصفات أبناء عمرو السروجي — مخطط قاعدة البيانات
--  Supabase / PostgreSQL
--  يُنفَّذ في: Supabase Dashboard → SQL Editor → New query → Run
--  كل قرار حسّاس (الصلاحيات وحالة الوصفة) محكوم في قاعدة البيانات عبر RLS.
-- ══════════════════════════════════════════════════════════════════════

-- ── الأنواع (Enums) ──
do $$ begin
  create type public.user_role as enum ('member', 'supervisor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('pending', 'active', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recipe_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('recipe_approved', 'recipe_pending', 'suggestion', 'system');
exception when duplicate_object then null; end $$;

-- ══════════════════════════════════════════════════════════════════════
--  الجداول
-- ══════════════════════════════════════════════════════════════════════

-- المستخدمون (مرتبط بـ auth.users عبر المعرّف نفسه)
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  login_id      text unique not null,
  display_name  text,
  role          public.user_role   not null default 'member',
  status        public.user_status not null default 'pending',
  created_at    timestamptz not null default now()
);

-- التصنيفات
create table if not exists public.categories (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- الوصفات
create table if not exists public.recipes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category_id  uuid references public.categories(id) on delete set null,
  ingredients  text not null,
  steps        text not null,
  image_url    text,
  status       public.recipe_status not null default 'pending',
  author_id    uuid not null references public.users(id) on delete cascade,
  approved_by  uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists recipes_status_idx  on public.recipes(status);
create index if not exists recipes_author_idx  on public.recipes(author_id);

-- الاقتراحات
create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now()
);

-- الإشعارات (نضيف title/body لتكون الرسالة مكتفية بذاتها)
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       public.notification_type not null default 'system',
  title      text,
  body       text,
  recipe_id  uuid references public.recipes(id) on delete cascade,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, is_read);

-- رموز الأجهزة للدفع الخارجي (FCM)
create table if not exists public.push_tokens (
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- ══════════════════════════════════════════════════════════════════════
--  دوال مساعدة (SECURITY DEFINER لتفادي التكرار في سياسات RLS)
-- ══════════════════════════════════════════════════════════════════════

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.my_status()
returns public.user_status
language sql stable security definer set search_path = public as $$
  select status from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.users where id = auth.uid()), false)
$$;

create or replace function public.is_supervisor()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('supervisor', 'admin') from public.users where id = auth.uid()), false)
$$;

create or replace function public.is_active()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'active' from public.users where id = auth.uid()), false)
$$;

-- ══════════════════════════════════════════════════════════════════════
--  مشغّلات (Triggers)
-- ══════════════════════════════════════════════════════════════════════

-- 1) تحديث updated_at + أي تعديل من صاحب الوصفة (غير مشرف) يُعيدها للمراجعة
create or replace function public.recipes_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() = old.author_id and not public.is_supervisor() then
    -- تعديل العضو لوصفته يعيدها لقائمة المراجعة
    if new.status = old.status then
      new.status := 'pending';
      new.approved_by := null;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_recipes_before_update on public.recipes;
create trigger trg_recipes_before_update
  before update on public.recipes
  for each row execute function public.recipes_before_update();

-- 2) فرض حالة "قيد المراجعة" على كل وصفة جديدة
create or replace function public.recipes_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.status := 'pending';
  new.approved_by := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_recipes_before_insert on public.recipes;
create trigger trg_recipes_before_insert
  before insert on public.recipes
  for each row execute function public.recipes_before_insert();

-- 3) إشعار المشرفين عند وصول وصفة جديدة
create or replace function public.notify_new_recipe()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, recipe_id)
  select u.id, 'recipe_pending', 'وصفة بانتظار المراجعة',
         'وصفة «' || new.title || '» تنتظر اعتمادك', new.id
    from public.users u
   where u.role in ('supervisor', 'admin') and u.status = 'active';
  return new;
end $$;

drop trigger if exists trg_notify_new_recipe on public.recipes;
create trigger trg_notify_new_recipe
  after insert on public.recipes
  for each row execute function public.notify_new_recipe();

-- 4) إشعار الأدمن داخل التطبيق عند وصول اقتراح
create or replace function public.notify_new_suggestion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body)
  select u.id, 'suggestion', 'اقتراح جديد', left(new.message, 80)
    from public.users u
   where u.role = 'admin' and u.status = 'active';
  return new;
end $$;

drop trigger if exists trg_notify_new_suggestion on public.suggestions;
create trigger trg_notify_new_suggestion
  after insert on public.suggestions
  for each row execute function public.notify_new_suggestion();

-- 5) حماية أعمدة المستخدم من التلاعب (لا يغيّر العضو دوره أو معرّفه)
create or replace function public.protect_user_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new; -- الأدمن يملك كل الصلاحيات
  end if;
  if auth.uid() = old.id then
    -- تعديل المستخدم لنفسه: نحافظ على الحقول الحسّاسة
    new.role       := old.role;
    new.login_id   := old.login_id;
    new.created_at := old.created_at;
    -- يُسمح بالانتقال pending → active فقط (الإعداد أول مرة)
    if new.status <> old.status and not (old.status = 'pending' and new.status = 'active') then
      new.status := old.status;
    end if;
    return new;
  end if;
  raise exception 'غير مصرّح بتعديل هذا المستخدم';
end $$;

drop trigger if exists trg_protect_user_columns on public.users;
create trigger trg_protect_user_columns
  before update on public.users
  for each row execute function public.protect_user_columns();

-- ══════════════════════════════════════════════════════════════════════
--  دوال العمليات (RPC)
-- ══════════════════════════════════════════════════════════════════════

-- اعتماد وصفة + إشعار جميع الأعضاء
create or replace function public.approve_recipe(p_recipe_id uuid)
returns public.recipes
language plpgsql security definer set search_path = public as $$
declare r public.recipes;
begin
  if not public.is_supervisor() then
    raise exception 'غير مصرّح: الاعتماد للمشرف أو الأدمن فقط';
  end if;

  update public.recipes
     set status = 'approved', approved_by = auth.uid(), updated_at = now()
   where id = p_recipe_id
  returning * into r;

  if r.id is null then
    raise exception 'الوصفة غير موجودة';
  end if;

  insert into public.notifications (user_id, type, title, body, recipe_id)
  select u.id, 'recipe_approved', 'وصفة جديدة معتمدة',
         'أُضيفت وصفة «' || r.title || '» من ' ||
           coalesce((select display_name from public.users where id = r.author_id), 'أحد أفراد العائلة'),
         r.id
    from public.users u
   where u.status = 'active' and u.id <> r.author_id;

  return r;
end $$;

-- الأدمن: تغيير الدور
create or replace function public.admin_set_role(p_user_id uuid, p_role public.user_role)
returns public.users
language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  update public.users set role = p_role where id = p_user_id returning * into u;
  return u;
end $$;

-- الأدمن: تغيير الحالة (تفعيل / تعطيل)
create or replace function public.admin_set_status(p_user_id uuid, p_status public.user_status)
returns public.users
language plpgsql security definer set search_path = public as $$
declare u public.users;
begin
  if not public.is_admin() then raise exception 'غير مصرّح'; end if;
  update public.users set status = p_status where id = p_user_id returning * into u;
  return u;
end $$;

-- الأدمن: إنشاء مستخدم جديد كاملًا (حساب مصادقة + ملف) داخل قاعدة البيانات
create or replace function public.admin_create_user(p_login_id text, p_role public.user_role, p_password text)
returns public.users
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  uid uuid;
  clean text;
  prof public.users;
begin
  if not public.is_admin() then
    raise exception 'غير مصرّح: هذه العملية للأدمن فقط';
  end if;
  clean := lower(regexp_replace(coalesce(p_login_id, ''), '[^a-z0-9._-]', '', 'g'));
  if length(clean) < 3 then raise exception 'المعرّف غير صالح (٣ أحرف/أرقام إنجليزية على الأقل)'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'كلمة المرور ٦ أحرف على الأقل'; end if;
  if exists (select 1 from auth.users where email = clean || '@sarouji.local') then
    raise exception 'هذا المعرّف مستخدم مسبقًا';
  end if;

  uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    clean || '@sarouji.local', crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
    '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid,
    jsonb_build_object('sub', uid::text, 'email', clean || '@sarouji.local'),
    'email', uid::text, now(), now(), now()
  );
  insert into public.users (id, login_id, display_name, role, status)
  values (uid, clean, null, p_role, 'pending')
  returning * into prof;

  return prof;
end $$;

-- ══════════════════════════════════════════════════════════════════════
--  تفعيل RLS + السياسات
-- ══════════════════════════════════════════════════════════════════════

alter table public.users         enable row level security;
alter table public.categories    enable row level security;
alter table public.recipes       enable row level security;
alter table public.suggestions   enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens   enable row level security;

-- ── users ──
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (auth.uid() is not null);

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- الإدراج يتم فقط عبر service role (Edge Function) — لا سياسة insert للعميل.

-- ── categories ──
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select using (auth.uid() is not null);

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all using (public.is_supervisor()) with check (public.is_supervisor());

-- ── recipes ──
drop policy if exists recipes_select on public.recipes;
create policy recipes_select on public.recipes
  for select using (
    status = 'approved'
    or author_id = auth.uid()
    or public.is_supervisor()
  );

drop policy if exists recipes_insert on public.recipes;
create policy recipes_insert on public.recipes
  for insert with check (author_id = auth.uid() and public.is_active());

drop policy if exists recipes_update on public.recipes;
create policy recipes_update on public.recipes
  for update using (
    public.is_supervisor()
    or (author_id = auth.uid() and status <> 'approved')
  ) with check (
    public.is_supervisor()
    or (author_id = auth.uid())
  );

drop policy if exists recipes_delete on public.recipes;
create policy recipes_delete on public.recipes
  for delete using (
    public.is_admin()
    or (author_id = auth.uid() and status <> 'approved')
  );

-- ── suggestions ──
drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions
  for insert with check (user_id = auth.uid() and public.is_active());

drop policy if exists suggestions_select on public.suggestions;
create policy suggestions_select on public.suggestions
  for select using (public.is_admin());

-- ── notifications ──
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- الإدراج يتم عبر triggers/RPC (security definer) فقط.

-- ── push_tokens ──
drop policy if exists push_tokens_all on public.push_tokens;
create policy push_tokens_all on public.push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════
--  التخزين: صور الوصفات
-- ══════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

drop policy if exists recipe_images_read on storage.objects;
create policy recipe_images_read on storage.objects
  for select using (bucket_id = 'recipe-images');

drop policy if exists recipe_images_insert on storage.objects;
create policy recipe_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists recipe_images_delete on storage.objects;
create policy recipe_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recipe-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- تمّ. راجع ملف supabase/seed.sql لإنشاء أول أدمن.
