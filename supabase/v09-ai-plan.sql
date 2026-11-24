-- v0.9 Gemini plan generation quota. Apply in the ai-health-trainer SQL Editor.
-- Only the Edge Function's server key may consume quota. No personal input is stored.
create table if not exists public.ai_plan_usage (
  bucket_hash text primary key,
  usage_day date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.ai_plan_usage enable row level security;
revoke all on public.ai_plan_usage from anon, authenticated;

create or replace function public.claim_ai_plan_quota(p_bucket_hash text, p_day date, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare claimed integer;
begin
  if p_bucket_hash !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_limit > 20 then
    return false;
  end if;
  insert into public.ai_plan_usage(bucket_hash, usage_day, request_count)
    values (p_bucket_hash, p_day, 1)
  on conflict (bucket_hash) do update
    set request_count = ai_plan_usage.request_count + 1, updated_at = now()
    where ai_plan_usage.usage_day = p_day and ai_plan_usage.request_count < p_limit
  returning request_count into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_ai_plan_quota(text, date, integer) from public, anon, authenticated;
grant execute on function public.claim_ai_plan_quota(text, date, integer) to service_role;
