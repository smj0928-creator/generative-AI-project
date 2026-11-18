-- v0.8 검토본: 친구 초대 코드, 요청, 수락, 연속 운동 날짜
create extension if not exists pgcrypto;

create table if not exists public.friend_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '운동새싹' check (char_length(nickname) between 1 and 12),
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6),'hex'),1,8)),
  created_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);
create unique index if not exists friend_pair_unique on public.friend_requests
  (least(requester_id,recipient_id),greatest(requester_id,recipient_id));

alter table public.friend_profiles enable row level security;
alter table public.friend_requests enable row level security;

drop policy if exists "Friend profile visibility" on public.friend_profiles;
create policy "Friend profile visibility" on public.friend_profiles for select to authenticated
using (user_id=auth.uid() or exists (
  select 1 from public.friend_requests r
  where (r.requester_id=auth.uid() and r.recipient_id=user_id)
     or (r.recipient_id=auth.uid() and r.requester_id=user_id)
));
drop policy if exists "Own friend profile insert" on public.friend_profiles;
create policy "Own friend profile insert" on public.friend_profiles for insert to authenticated
with check (user_id=auth.uid());
drop policy if exists "Own friend profile update" on public.friend_profiles;
create policy "Own friend profile update" on public.friend_profiles for update to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "Participants see friend requests" on public.friend_requests;
create policy "Participants see friend requests" on public.friend_requests for select to authenticated
using (requester_id=auth.uid() or recipient_id=auth.uid());

revoke all on public.friend_profiles,public.friend_requests from anon,authenticated;
grant select on public.friend_profiles,public.friend_requests to authenticated;
grant insert(user_id,nickname) on public.friend_profiles to authenticated;
grant update(nickname) on public.friend_profiles to authenticated;

create or replace function public.send_friend_request(p_code text) returns text
language plpgsql security definer set search_path=public as $$
declare target_id uuid; previous public.friend_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  select user_id into target_id from public.friend_profiles where invite_code=upper(trim(p_code));
  if target_id is null then raise exception 'code_not_found'; end if;
  if target_id=auth.uid() then raise exception 'own_code'; end if;
  select * into previous from public.friend_requests
   where least(requester_id,recipient_id)=least(auth.uid(),target_id)
     and greatest(requester_id,recipient_id)=greatest(auth.uid(),target_id);
  if found then
    if previous.status='accepted' then raise exception 'already_friends'; end if;
    if previous.status='pending' then raise exception 'already_pending'; end if;
    update public.friend_requests set requester_id=auth.uid(),recipient_id=target_id,
      status='pending',updated_at=now() where id=previous.id;
  else
    insert into public.friend_requests(requester_id,recipient_id) values(auth.uid(),target_id);
  end if;
  return 'sent';
end $$;

create or replace function public.answer_friend_request(p_request_id uuid,p_accept boolean) returns text
language plpgsql security definer set search_path=public as $$
begin
  update public.friend_requests set status=case when p_accept then 'accepted' else 'declined' end,
    updated_at=now() where id=p_request_id and recipient_id=auth.uid() and status='pending';
  if not found then raise exception 'request_not_found'; end if;
  return 'ok';
end $$;

create or replace function public.remove_friend(p_request_id uuid) returns text
language plpgsql security definer set search_path=public as $$
begin
  delete from public.friend_requests where id=p_request_id and status='accepted'
    and (requester_id=auth.uid() or recipient_id=auth.uid());
  if not found then raise exception 'friend_not_found'; end if;
  return 'ok';
end $$;

create or replace function public.friend_activity_dates() returns jsonb
language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id',p.user_id,'nickname',p.nickname,'dates',(
      select coalesce(jsonb_agg(distinct (l.completed_at at time zone 'Asia/Seoul')::date),'[]'::jsonb)
      from public.workout_logs l where l.user_id=p.user_id
    )
  )),'[]'::jsonb)
  from public.friend_profiles p
  where auth.uid() is not null and (p.user_id=auth.uid() or exists (
    select 1 from public.friend_requests r where r.status='accepted'
      and ((r.requester_id=auth.uid() and r.recipient_id=p.user_id)
        or (r.recipient_id=auth.uid() and r.requester_id=p.user_id))
  ));
$$;

revoke all on function public.send_friend_request(text),public.answer_friend_request(uuid,boolean),
  public.remove_friend(uuid),public.friend_activity_dates() from public;
grant execute on function public.send_friend_request(text),public.answer_friend_request(uuid,boolean),
  public.remove_friend(uuid),public.friend_activity_dates() to authenticated;
