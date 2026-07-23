-- ══════════════════════════════════════════════════════════════════════
--  ميزات إضافية: المفضّلة + التعليقات
--  يُنفَّذ مرة واحدة في: Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════════

-- ── المفضّلة ──
create table if not exists public.favorites (
  user_id    uuid not null references public.users(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
alter table public.favorites enable row level security;

drop policy if exists favorites_all on public.favorites;
create policy favorites_all on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── التعليقات ──
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_recipe_idx on public.comments(recipe_id, created_at);
alter table public.comments enable row level security;

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select using (auth.uid() is not null);

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert with check (user_id = auth.uid() and public.is_active());

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete using (user_id = auth.uid() or public.is_admin());
