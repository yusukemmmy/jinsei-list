-- 人生リスト: データベーススキーマ
-- Supabase ダッシュボード > SQL Editor で実行してください

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('work', 'daily', 'self', 'event', 'dream')),
  tags text[] not null default '{}',
  note text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  urgency text check (urgency in ('asap', 'soon', 'someday', 'lifetime')),
  deadline date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_user_id_idx on public.items (user_id);
create index items_category_idx on public.items (category);
create index items_deadline_idx on public.items (deadline);
create index items_completed_at_idx on public.items (completed_at);

alter table public.items enable row level security;

create policy "Users can view own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can insert own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own items"
  on public.items for update
  using (auth.uid() = user_id);

create policy "Users can delete own items"
  on public.items for delete
  using (auth.uid() = user_id);

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_updated_at
  before update on public.items
  for each row execute function public.update_updated_at();
