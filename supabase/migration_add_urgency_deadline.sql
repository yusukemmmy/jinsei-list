-- ゆとり（urgency）と期限（deadline）カラムを追加
-- Supabase ダッシュボード > SQL Editor で実行してください

alter table public.items
  add column if not exists urgency text check (urgency in ('asap', 'soon', 'someday', 'lifetime')),
  add column if not exists deadline date;

-- 既存データ: 期限なしは「そのうち」に設定
update public.items
  set urgency = 'soon'
  where urgency is null and deadline is null;

create index if not exists items_deadline_idx on public.items (deadline);
