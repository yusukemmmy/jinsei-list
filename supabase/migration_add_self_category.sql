-- 「自分」カテゴリを追加
-- Supabase ダッシュボード > SQL Editor で実行してください

-- 既存の category チェック制約を削除（名前が異なる場合も対応）
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'items'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%category%'
  loop
    execute format('alter table public.items drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.items
  add constraint items_category_check
  check (category in ('work', 'daily', 'self', 'event', 'dream'));
