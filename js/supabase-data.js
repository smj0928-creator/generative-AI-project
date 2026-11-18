(function(){
  const client=window.supabaseClient;

  const normalizeTemplates=(rows=[])=>rows.reduce((result,row)=>{
    (result[row.goal]??=[]).push({
      id:row.id,
      title:row.title,
      summary:row.summary,
      place:row.place,
      workoutType:row.workout_type
    });
    return result;
  },{});

  const normalizeGuides=(rows=[])=>rows.reduce((result,row)=>{
    result[row.exercise_name]={
      type:row.media_type,
      url:row.media_url,
      sourceTitle:row.source_title,
      sourceUrl:row.source_url,
      sourceName:row.source_name,
      author:row.author,
      license:row.license_name,
      licenseUrl:row.license_url,
      aiGenerated:Boolean(row.ai_generated),
      formatNote:row.format_note,
      reason:row.pending_reason
    };
    return result;
  },{});

  async function loadCatalog(){
    if(!client)return null;
    const [templatesResult,guidesResult,routineResult]=await Promise.all([
      client.from('workout_templates').select('id,goal,title,summary,place,workout_type,sort_order').eq('is_active',true).order('goal').order('sort_order'),
      client.from('exercise_guides').select('*').order('exercise_name'),
      client.from('public_routines').select('id,title,summary,exercises,duration,level,place,workout_type,trainer_profiles(display_name,avatar,verified,follower_label,bio)').eq('is_public',true).eq('is_featured',true).limit(1).maybeSingle()
    ]);
    const errors=[templatesResult.error,guidesResult.error,routineResult.error].filter(Boolean);
    if(errors.length){
      console.warn('Supabase 운동 데이터 조회 실패. 저장된 JSON을 사용합니다.',errors.map(error=>error.message));
      return null;
    }
    return {
      templates:normalizeTemplates(templatesResult.data),
      guides:normalizeGuides(guidesResult.data),
      featuredRoutine:routineResult.data||null
    };
  }

  async function syncState(state){
    if(!client||!window.aiTrainerUser)return;
    const userId=window.aiTrainerUser.id;
    const payload={
      user_id:userId,
      goal:state.goal,
      level:state.level,
      frequency:state.frequency,
      duration:state.duration,
      place:state.place,
      workout_type:state.workoutType,
      caution:state.caution||'',
      plan_items:state.plan||[],
      completed_item_ids:state.completed||[],
      app_state:{checks:state.checks||{},streak:state.streak||0,socialVisited:Boolean(state.socialVisited),copiedRoutine:Boolean(state.copiedRoutine),activityHistory:state.activityHistory||[]},
      updated_at:new Date().toISOString()
    };
    const {error}=await client.from('user_plans').upsert(payload,{onConflict:'user_id'});
    if(error){console.warn('Supabase 플랜 동기화 실패',error.message);return}
  }

  async function recordWorkoutLog(item,completedAt){
    if(!client||!window.aiTrainerUser)return;
    const {error}=await client.from('workout_logs').upsert({
      user_id:window.aiTrainerUser.id,workout_item_id:String(item.id),title:item.title,
      duration:item.duration,completed_at:completedAt
    },{onConflict:'user_id,workout_item_id'});
    if(error)console.warn('Supabase 운동 기록 저장 실패',error.message);
  }

  async function loadUserState(){
    if(!client||!window.aiTrainerUser)return null;
    const {data,error}=await client.from('user_plans').select('*').eq('user_id',window.aiTrainerUser.id).maybeSingle();
    if(error){console.warn('Supabase 플랜 조회 실패',error.message);return null}
    if(!data)return null;
    const {data:logs, error:logError}=await client.from('workout_logs')
      .select('workout_item_id,title,duration,completed_at').eq('user_id',window.aiTrainerUser.id);
    if(logError)console.warn('Supabase 운동 날짜 조회 실패',logError.message);
    const savedHistory=Array.isArray(data.app_state?.activityHistory)?data.app_state.activityHistory:[];
    const history=new Map((logs||[]).map(log=>[String(log.workout_item_id),{
      itemId:String(log.workout_item_id),title:log.title,duration:log.duration,completedAt:log.completed_at
    }]));
    savedHistory.forEach(item=>history.set(String(item.itemId),item));
    return {
      goal:data.goal,
      level:data.level,
      frequency:data.frequency,
      duration:data.duration,
      place:data.place,
      workoutType:data.workout_type,
      caution:data.caution||'',
      plan:data.plan_items||[],
      completed:data.completed_item_ids||[],
      activityHistory:[...history.values()],
      checks:data.app_state?.checks||{},
      streak:data.app_state?.streak||0,
      socialVisited:Boolean(data.app_state?.socialVisited),
      copiedRoutine:Boolean(data.app_state?.copiedRoutine)
    };
  }

  async function removeWorkoutLog(itemId){
    if(!client||!window.aiTrainerUser)return;
    const {error}=await client.from('workout_logs').delete().eq('user_id',window.aiTrainerUser.id).eq('workout_item_id',String(itemId));
    if(error)console.warn('Supabase 운동 기록 취소 실패',error.message);
  }

  async function clearWorkoutLogs(){
    if(!client||!window.aiTrainerUser)return true;
    const {error}=await client.from('workout_logs').delete().eq('user_id',window.aiTrainerUser.id);
    if(error){console.warn('Supabase 운동 기록 초기화 실패',error.message);return false}
    return true;
  }
  window.aiTrainerData={loadCatalog,syncState,loadUserState,recordWorkoutLog,removeWorkoutLog,clearWorkoutLogs};
})();
