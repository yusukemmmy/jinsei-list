-- 種類（kind）カラムを追加し、カテゴリをタクト・家・自分に再構成
-- Supabase ダッシュボード > SQL Editor で実行してください

alter table public.items add column if not exists kind text;

-- 既存データの移行
update public.items set kind = 'must' where category in ('work', 'daily') and kind is null;
update public.items set kind = 'try' where category in ('self', 'event') and kind is null;
update public.items set kind = 'dream' where category = 'dream' and kind is null;
update public.items set category = 'self' where category in ('event', 'dream');

update public.items set kind = 'must' where kind is null;

alter table public.items alter column kind set default 'must';
alter table public.items alter column kind set not null;

alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in ('work', 'daily', 'self'));

alter table public.items drop constraint if exists items_kind_check;
alter table public.items add constraint items_kind_check
  check (kind in ('must', 'try', 'dream'));

-- 完了済みアイテムの完了日（アーカイブ対象: やってみよう・夢）
update public.items
  set completed_at = updated_at
  where status = 'done'
    and kind in ('try', 'dream')
    and completed_at is null;

create index if not exists items_kind_idx on public.items (kind);
