-- 「自分」カテゴリを追加
-- Supabase ダッシュボード > SQL Editor で実行してください

alter table public.items drop constraint if exists items_category_check;

alter table public.items
  add constraint items_category_check
  check (category in ('work', 'daily', 'self', 'event', 'dream'));
