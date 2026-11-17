-- JSON 운동 템플릿과 가이드 등록
with catalog as (
  select $__CATALOG__$__WORKOUT_CATALOG_JSON__$__CATALOG__$::jsonb as data
), goals as (
  select key as goal,value as items from catalog cross join lateral jsonb_each(data-'_exerciseGuides')
), expanded as (
  select goal,item,row_number() over(partition by goal) as sort_order from goals cross join lateral jsonb_array_elements(items) as item
)
insert into public.workout_templates(goal,title,summary,place,workout_type,sort_order,is_active)
select goal,item->>'title',item->>'summary',item->>'place',item->>'workoutType',sort_order,true from expanded
on conflict (goal,title,place,workout_type) do update set summary=excluded.summary,sort_order=excluded.sort_order,is_active=true;

with catalog as (
  select $__CATALOG__$__WORKOUT_CATALOG_JSON__$__CATALOG__$::jsonb as data
), guides as (
  select key as exercise_name,value as guide from catalog cross join lateral jsonb_each(data->'_exerciseGuides')
)
insert into public.exercise_guides(exercise_name,media_type,media_url,source_title,source_url,source_name,author,license_name,license_url,ai_generated,format_note,pending_reason,updated_at)
select exercise_name,coalesce(guide->>'type','pending'),guide->>'url',guide->>'sourceTitle',guide->>'sourceUrl',guide->>'sourceName',guide->>'author',guide->>'license',guide->>'licenseUrl',coalesce((guide->>'aiGenerated')::boolean,false),guide->>'formatNote',guide->>'reason',now() from guides
on conflict (exercise_name) do update set media_type=excluded.media_type,media_url=excluded.media_url,source_title=excluded.source_title,source_url=excluded.source_url,source_name=excluded.source_name,author=excluded.author,license_name=excluded.license_name,license_url=excluded.license_url,ai_generated=excluded.ai_generated,format_note=excluded.format_note,pending_reason=excluded.pending_reason,updated_at=now();

insert into public.trainer_profiles(slug,display_name,avatar,verified,follower_label,bio,activity_score,is_public)
values
  ('minjifit','민지핏','🏋️',true,'팔로워 128만','전신 근력과 홈트레이닝 루틴을 소개합니다.',3240,true),
  ('iron-j','철인제이','💪',true,'팔로워 82만','기초 체력부터 꾸준히 쌓는 근력 루틴을 소개합니다.',2980,true),
  ('routine-maker','루틴메이커','⚡',true,'팔로워 41만','바쁜 날에도 이어 갈 수 있는 짧은 루틴을 만듭니다.',1740,true)
on conflict (slug) do update set display_name=excluded.display_name,avatar=excluded.avatar,verified=excluded.verified,follower_label=excluded.follower_label,bio=excluded.bio,activity_score=excluded.activity_score,is_public=true;

update public.public_routines set is_featured=false where is_featured=true;

insert into public.public_routines(trainer_id,slug,title,summary,exercises,duration,level,place,workout_type,is_featured,is_public)
select id,'minjifit-power-30','민지핏의 30분 파워 루틴','스쿼트 · 니푸시업 · 리버스 런지 · 플랭크','["스쿼트","니푸시업","리버스 런지","플랭크"]'::jsonb,30,'중급','home','bodyweight',true,true from public.trainer_profiles where slug='minjifit'
on conflict (slug) do update set trainer_id=excluded.trainer_id,title=excluded.title,summary=excluded.summary,exercises=excluded.exercises,duration=excluded.duration,level=excluded.level,place=excluded.place,workout_type=excluded.workout_type,is_featured=true,is_public=true;

insert into public.public_routines(trainer_id,slug,title,summary,exercises,duration,level,place,workout_type,is_featured,is_public)
select id,'iron-j-gym-basic','철인제이의 헬스장 기초 루틴','레그 프레스 · 체스트 프레스 · 랫 풀다운','["레그 프레스","체스트 프레스","랫 풀다운"]'::jsonb,40,'초급','gym','equipment',false,true from public.trainer_profiles where slug='iron-j'
on conflict (slug) do update set trainer_id=excluded.trainer_id,title=excluded.title,summary=excluded.summary,exercises=excluded.exercises,duration=excluded.duration,level=excluded.level,place=excluded.place,workout_type=excluded.workout_type,is_public=true;

insert into public.public_routines(trainer_id,slug,title,summary,exercises,duration,level,place,workout_type,is_featured,is_public)
select id,'routine-maker-20','루틴메이커의 20분 혼합 루틴','밴드 로우 · 스쿼트 · 제자리 걷기','["밴드 로우","스쿼트","제자리 걷기"]'::jsonb,20,'입문','home','mixed',false,true from public.trainer_profiles where slug='routine-maker'
on conflict (slug) do update set trainer_id=excluded.trainer_id,title=excluded.title,summary=excluded.summary,exercises=excluded.exercises,duration=excluded.duration,level=excluded.level,place=excluded.place,workout_type=excluded.workout_type,is_public=true;
