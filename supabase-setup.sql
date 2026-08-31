-- PuppyLove 云端一次性设置
-- 在 Supabase 控制台：SQL Editor → New query → 把本文件全部贴进去 → Run
-- 做完后再按聊天里的「建用户」步骤，网页才能用口令开门

-- 1) 打卡表
create table if not exists public.checkins (
  id bigint generated always as identity primary key,
  note text default '',
  category text not null default '其他',
  status text not null default 'planned' check (status in ('planned', 'done')),
  happen_at timestamptz not null,
  checked_in_at timestamptz,
  lat double precision not null,
  lng double precision not null,
  place_name text default '',
  address text default '',
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists checkins_happen_at_idx on public.checkins (happen_at desc);

-- 2) 打开行级安全：没登录的人（包括拿到网页密钥的人）读不到这些表
alter table public.diaries enable row level security;
alter table public.anniversaries enable row level security;
alter table public.memories enable row level security;
alter table public.wishes enable row level security;
alter table public.life_notes enable row level security;
alter table public.checkins enable row level security;

-- 3) 清掉旧策略，避免匿名策略还留着
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('diaries', 'anniversaries', 'memories', 'wishes', 'life_notes', 'checkins')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 4) 只有登录后的共用账号能读写
create policy "authenticated_all_diaries" on public.diaries
  for all to authenticated using (true) with check (true);
create policy "authenticated_all_anniversaries" on public.anniversaries
  for all to authenticated using (true) with check (true);
create policy "authenticated_all_memories" on public.memories
  for all to authenticated using (true) with check (true);
create policy "authenticated_all_wishes" on public.wishes
  for all to authenticated using (true) with check (true);
create policy "authenticated_all_life_notes" on public.life_notes
  for all to authenticated using (true) with check (true);
create policy "authenticated_all_checkins" on public.checkins
  for all to authenticated using (true) with check (true);

revoke all on public.diaries from anon, public;
revoke all on public.anniversaries from anon, public;
revoke all on public.memories from anon, public;
revoke all on public.wishes from anon, public;
revoke all on public.life_notes from anon, public;
revoke all on public.checkins from anon, public;

grant all on public.diaries to authenticated;
grant all on public.anniversaries to authenticated;
grant all on public.memories to authenticated;
grant all on public.wishes to authenticated;
grant all on public.life_notes to authenticated;
grant all on public.checkins to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- 5) 照片桶：登录后才能上传/删除
insert into storage.buckets (id, name, public)
values ('Food', 'Food', true)
on conflict (id) do nothing;

drop policy if exists "auth_read_food" on storage.objects;
drop policy if exists "auth_insert_food" on storage.objects;
drop policy if exists "auth_update_food" on storage.objects;
drop policy if exists "auth_delete_food" on storage.objects;
drop policy if exists "public_read_food" on storage.objects;

-- 公开直链给 <img> 用；列表/上传仍建议只给登录用户
create policy "public_read_food" on storage.objects
  for select to public
  using (bucket_id = 'Food');

create policy "auth_insert_food" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'Food');

create policy "auth_update_food" on storage.objects
  for update to authenticated
  using (bucket_id = 'Food')
  with check (bucket_id = 'Food');

create policy "auth_delete_food" on storage.objects
  for delete to authenticated
  using (bucket_id = 'Food');
