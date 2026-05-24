-- 完了日時（completed_at）カラムを追加
-- Supabase ダッシュボード > SQL Editor で実行してください

alter table public.items
  add column if not exists completed_at timestamptz;

-- 既存の完了済みアイテム（自分・イベント・夢）に完了日を設定
update public.items
  set completed_at = updated_at
  where status = 'done'
    and category in ('self', 'event', 'dream')
    and completed_at is null;

create index if not exists items_completed_at_idx on public.items (completed_at);
