const KEY='ai-trainer-demo-v1';
const defaultState={name:'운동새싹',goal:'체력 향상',level:'입문',frequency:3,duration:20,place:'home',workoutType:'bodyweight',caution:'',plan:[],completed:[],checks:{water:false,towel:false,space:false},streak:0,loginSeen:false,socialVisited:false,copiedRoutine:false};
let state={...defaultState,...JSON.parse(localStorage.getItem(KEY)||'{}')};let selected=0;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let exerciseGuides={};
let featuredRoutine=null;
const templates={
 '체력 향상':[['전신 컨디셔닝','스쿼트 · 니푸시업 · 제자리 걷기'],['저강도 유산소','사이드 스텝 · 마운틴 클라이머'],['코어 밸런스','버드독 · 데드버그 · 플랭크']],
 '체중 감량':[['활력 카디오','제자리 걷기 · 스텝잭 · 스쿼트'],['전신 인터벌','런지 · 니업 · 숄더탭'],['지방 연소 서킷','스쿼트 · 펀치 · 마운틴 클라이머']],
 '근력 강화':[['하체 기초 근력','스쿼트 · 리버스 런지 · 힙브릿지'],['상체 기초 근력','니푸시업 · 숄더탭 · 슈퍼맨'],['전신 근력','스쿼트 · 푸시업 · 플랭크']],
 '유연성 향상':[['전신 모빌리티','캣카우 · 런지 스트레치 · 회전'],['하체 유연성','햄스트링 · 고관절 · 종아리'],['회복 스트레칭','목 · 어깨 · 척추 · 하체']]
};
async function loadWorkoutTemplates(){
 try{
  const remote=await window.aiTrainerData?.loadCatalog?.();
  if(remote&&Object.keys(remote.templates||{}).length){
   exerciseGuides=remote.guides||{};
   featuredRoutine=remote.featuredRoutine||null;
   Object.assign(templates,remote.templates);
   return;
  }
  const response=await fetch(document.querySelector('script[data-workout-json]')?.dataset.workoutJson || './data/workout-templates.json');
  if(!response.ok)throw new Error('운동 데이터 파일을 불러오지 못했습니다');
  const data=await response.json();
  exerciseGuides=data._exerciseGuides||{};
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('운동 데이터 형식이 올바르지 않습니다');
  Object.entries(data).forEach(([goal,items])=>{
   if(!Array.isArray(items))return;
   templates[goal]=items.map(item=>Array.isArray(item)?{title:item[0],summary:item[1],place:'home',workoutType:'bodyweight'}:item);
  });
 }catch(error){
  Object.entries(templates).forEach(([goal,items])=>{templates[goal]=items.map(item=>Array.isArray(item)?{title:item[0],summary:item[1],place:'home',workoutType:'bodyweight'}:item)});
  console.warn('JSON 운동 데이터를 불러오지 못해 기본 데이터를 사용합니다',error);
 }
}
const templatesReady=loadWorkoutTemplates();
const save=()=>{localStorage.setItem(KEY,JSON.stringify(state));window.aiTrainerData?.syncState?.(state)};
async function makePlan(){await templatesReady;const goal=$('#goal').value,level=$('#level').value,frequency=+$('#frequency').value,duration=+$('#duration').value,place=$('#place').value,workoutType=$('#workoutType').value,caution=$('#caution').value.trim();const set=(templates[goal]||[]).filter(item=>item.place===place&&item.workoutType===workoutType);if(!set.length){toast('선택한 조건에 맞는 운동 데이터가 없습니다');return}if(state.plan.length&&!confirm('이번 주 계획을 새로 만들까요? 현재 계획과 화면의 완료 상태가 바뀝니다.'))return;Object.assign(state,{goal,level,frequency,duration,place,workoutType,caution});state.plan=Array.from({length:frequency},(_,i)=>{const item=set[i%set.length];return{id:Date.now()+i,day:['월','화','수','목','금','토','일'][(i*Math.floor(7/frequency))%7],title:item.title,summary:item.summary,duration,level,place,workoutType}});state.completed=[];selected=0;save();render();toast('선택한 조건에 맞춰 주간 계획을 만들었어요');}
function render(){const done=state.completed.length,total=state.plan.length,pct=total?Math.round(done/total*100):0;$('#hello').textContent=`안녕하세요, ${state.name}님!`;$('#planGoal').textContent=state.goal;$('#progressText').textContent=pct+'%';$('#progressBar').style.width=pct+'%';$('#myWorkoutCount').textContent=done+'회';$('#myWorkoutTime').textContent=(done*state.duration)+'분';$('#myStreak').textContent=state.streak+'일';$('#myName').textContent=state.name;renderHomeNext();renderPlan();renderBadges();renderChecklist();renderSocial();decorateSocialProfiles();}
function renderHomeNext(){const box=$('#homeNextWorkout');const next=state.plan.find(w=>!state.completed.includes(w.id));box.replaceChildren();if(!next){box.classList.add('empty');box.textContent=state.plan.length?'이번 주 계획을 모두 마쳤어요. 충분히 쉬어 주세요.':'계획을 만들면 다음 운동이 여기에 보여요.';return}box.classList.remove('empty');box.classList.add('workout');const icon=document.createElement('div');icon.className='workout-icon';icon.textContent='🏃';const info=document.createElement('div');info.className='workout-info';const heading=document.createElement('h3');heading.textContent=next.title;const detail=document.createElement('p');detail.textContent=`${next.day}요일 · ${next.duration}분 · ${next.level}`;info.append(heading,detail);const button=document.createElement('button');button.className='pill';button.textContent='보기';button.onclick=()=>openWorkout(state.plan.indexOf(next));box.append(icon,info,button);}
function renderPlan(){const box=$('#planList');box.innerHTML=state.plan.length?state.plan.map((w,i)=>`<div class="card workout"><div class="workout-icon">${state.completed.includes(w.id)?'✅':['🏋️','🏃','🧘'][i%3]}</div><div class="workout-info"><span class="eyebrow">${w.day}요일 · ${w.duration}분 · ${w.place==='gym'?'헬스장':'홈트레이닝'} · ${w.workoutType==='bodyweight'?'맨몸':w.workoutType==='equipment'?'기구':'혼합'}</span><h3>${w.title}</h3><p>${w.summary}</p></div><button class="pill" data-plan-open="${i}">상세</button></div>`).join(''):'<div class="card empty">홈에서 주간 계획을 만들어 주세요.</div>';$$('[data-plan-open]').forEach(b=>b.onclick=()=>openWorkout(+b.dataset.planOpen));}
function openWorkout(i){
 const w=state.plan[i];selected=i;
 $('#modalDay').textContent=`${w.day}요일 · ${w.duration}분 · ${w.level} · ${w.place==='gym'?'헬스장':'홈트레이닝'} · ${w.workoutType==='bodyweight'?'맨몸운동':w.workoutType==='equipment'?'기구 운동':'혼합 운동'}`;
 $('#modalTitle').textContent=w.title;
 $('#modalDesc').textContent=w.summary;
 const names=w.summary.split(' · '),list=$('#exerciseList');
 list.replaceChildren();
 names.forEach((name,j)=>{
  const row=document.createElement('div');row.className='exercise';
  const title=document.createElement('b');title.textContent=`${j+1}. ${name}`;row.append(title);
  const instruction=document.createElement('p');instruction.textContent=`${state.level==='입문'?'천천히 정확한 자세로':'호흡을 유지하며'} ${Math.max(30,Math.round(state.duration*60/names.length/3))}초 × 3세트`;row.append(instruction);
  const guide=exerciseGuides[name];
  if(guide?.type==='image'){
   const image=document.createElement('img');image.className='exercise-illustration';image.src=guide.url;image.alt=`${name} 운동 동작 예시`;image.loading='lazy';
   image.onerror=()=>{image.replaceWith(Object.assign(document.createElement('p'),{textContent:'사진을 불러오지 못했습니다. 아래 원본 자료를 확인해 주세요.'}))};
   row.append(image);
  }else if(guide?.type==='video'){
   const video=document.createElement('video');video.className='exercise-illustration';video.controls=true;video.preload='none';video.playsInline=true;video.src=guide.url;row.append(video);
  }else{
   const pending=document.createElement('p');pending.className='guide-pending';pending.textContent='이 동작의 사진·영상은 아직 검토 중입니다. 정확한 자세를 확인한 뒤 추가하겠습니다.';row.append(pending);
  }
  if(guide?.sourceUrl){
   const credit=document.createElement('div');credit.className='guide-credit';
   const source=document.createElement('a');source.href=guide.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';source.textContent=`원본: ${guide.sourceName||'wger'} · ${guide.sourceTitle}`;credit.append(source);
   if(guide.author){const author=document.createElement('span');author.textContent=` · ${guide.author}`;credit.append(author)}
   const license=document.createElement('a');license.href=guide.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';license.textContent=` · ${guide.license}`;credit.append(license);
   if(guide.aiGenerated){const ai=document.createElement('span');ai.textContent=' · AI 생성 이미지';credit.append(ai)}
   row.append(credit);
   if(guide.formatNote){const note=document.createElement('p');note.textContent=guide.formatNote;row.append(note)}
  }
  list.append(row);
 });
 $('#safetyText').textContent=`통증이 느껴지면 즉시 중단하고 충분히 쉬세요.${state.caution?' 참고사항: '+state.caution+'. 무리하지 않는 범위에서 동작을 줄이세요.':''}`;
 $('#completeWorkout').textContent=state.completed.includes(w.id)?'완료 취소':'운동 완료하기';
 $('#modal').classList.add('open');
}
function badgeItems(){const n=state.completed.length,allChecks=Object.values(state.checks).every(Boolean);return [['🌱','첫 운동','운동 1회 완료',n>=1],['🔥','3회 달성','운동 3회 완료',n>=3],['⭐','주간 완주','현재 주간 플랜 모두 완료',state.plan.length>0&&n===state.plan.length],['⏱️','한 시간의 힘','누적 운동 60분 달성',n*state.duration>=60],['💪','꾸준한 다섯','운동 5회 완료',n>=5],['⚡','3일 연속','연속 기록 3일 달성',state.streak>=3],['🎒','준비 완료','준비 체크 3개 완료',allChecks],['🗓️','나만의 설계자','주간 플랜 생성',state.plan.length>0],['🤝','함께 운동','함께 페이지 방문',state.socialVisited]]}
function renderBadges(){const items=badgeItems(),earned=items.filter(x=>x[3]).length;$('#myBadgeSummary').textContent=`${earned}개 획득`;$('#badges').innerHTML=items.slice(0,3).map(x=>`<div class="badge ${x[3]?'earned':''}"><div class="emoji">${x[0]}</div><b>${x[1]}</b></div>`).join('');$('#badgeDetail').innerHTML=items.map(x=>`<div class="badge ${x[3]?'earned':''}"><div class="emoji">${x[0]}</div><b>${x[1]}</b><small>${x[3]?'획득 완료':x[2]}</small></div>`).join('')}
function renderChecklist(){const items=[['water','물 준비'],['towel','수건 준비'],['space','안전한 공간 확인']];$('#checklist').innerHTML=items.map(x=>`<label class="check"><input type="checkbox" data-check="${x[0]}" ${state.checks[x[0]]?'checked':''}>${x[1]}</label>`).join('');$$('[data-check]').forEach(c=>c.onchange=()=>{state.checks[c.dataset.check]=c.checked;save();toast('체크리스트를 저장했어요')})}
function renderSocial(){const hasWorkout=state.completed.length>0;$('#firstWorkoutHint').hidden=hasWorkout;$('#rankContent').hidden=!hasWorkout;const myScore=state.completed.length*120,myRank=Math.max(1,27-state.completed.length*3),qualified=myRank<=10&&myScore>=700,names=['스텝바이스텝','오늘도움직임','건강한아침','튼튼한오후','천천히꾸준히','퇴근후운동','한세트더','러닝메이트','코어챌린저','스트레칭데이','매일십분','운동하는곰','활력충전','홈트친구','스쿼트좋아'];$('#myLeagueRank').textContent=myRank+'위';$('#pointsToNext').textContent=qualified?'승급 조건 달성':Math.max(0,700-myScore)+'점 남음';$('#leagueProgress').style.width=Math.min(100,Math.round(myScore/700*100))+'%';const rankNeed=Math.max(0,myRank-10),scoreNeed=Math.max(0,700-myScore),status=$('#promotionStatus');status.textContent=qualified?'✓ 10위 이내와 700점 이상을 모두 달성했어요. 다음 정산에서 실버 리그로 승급합니다.':`${rankNeed?`10위까지 ${rankNeed}계단 · `:'10위 이내 달성 · '}${scoreNeed?`700점까지 ${scoreNeed}점 필요`:'700점 달성'}`;status.classList.toggle('ready',qualified);let rows='';for(let rank=1;rank<=32;rank++){const isMe=rank===myRank,name=isMe?'나 · '+state.name:names[(rank-1)%names.length],score=isMe?myScore:Math.max(40,1180-(rank-1)*34);rows+=`<div class="rank ${isMe?'me':''}" data-me="${isMe}"><div class="rank-num">${rank}</div><div class="person"><b>${name}</b><span>브론즈 리그 · 이번 주</span></div><b>${score}점</b></div>`;if(rank===10)rows+=`<div class="promotion-cut"><span>승급 커트라인<small>10위 이내 + 700점 이상</small></span></div>`}$('#myLeaderboard').innerHTML=rows;requestAnimationFrame(()=>{$('#myLeagueScroll').scrollTop=Math.max(0,(myRank-3)*55)});const people=[['민지핏',3240,true],['철인제이',2980,true],['오늘도한세트',2760,false],['런데이윤',2510,true],['근력토끼',2390,false],['매일스트레칭',2210,false],['코어왕',2070,false],['건강한오늘',1950,false],['차근차근',1820,false],['루틴메이커',1740,true]];$('#upperLeaderboard').innerHTML=people.map((x,i)=>`<div class="rank ${i<3?'medal':''}"><div class="rank-num">${['🥇','🥈','🥉'][i]||i+1}</div><div class="person"><b>${x[0]} ${x[2]?'<span class="verified">● 인증</span>':''}</b><span>${i<3?'챔피언 리그 · ':''}이번 주 공개 활동</span></div><b>${x[1].toLocaleString()}점</b></div>`).join('');$('#creatorCard').innerHTML=`<div class="match-top"><div class="match-photo">🏋️</div><div class="workout-info"><span class="eyebrow">리그 1위 · 인증 트레이너</span><h3>민지핏 ✓</h3><p>팔로워 128만 · 전신 근력 루틴</p></div></div><div id="routinePreview" class="routine-preview"><b>민지핏의 30분 파워 루틴</b><br>스쿼트 · 니푸시업 · 리버스 런지 · 플랭크<br><span style="opacity:.72">중급 · 30분 · 기구 없음</span></div><div class="creator-actions"><button id="previewRoutine" class="primary">루틴 보기</button><button id="copyRoutine" class="secondary">내 플랜에 담기</button></div>`;$('#toggleUpperLeague').onclick=()=>{const p=$('#upperLeague');p.classList.toggle('open');$('#toggleUpperLeague').textContent=p.classList.contains('open')?'상위 리그 접기':'상위 리그 보기'};$('#previewRoutine').onclick=()=>{const p=$('#routinePreview');p.classList.toggle('open');$('#previewRoutine').textContent=p.classList.contains('open')?'접기':'루틴 보기'};$('#copyRoutine').onclick=copyCreatorRoutine;$('#matchCard').innerHTML=`<div class="match-top"><div class="match-photo">🙂</div><div class="workout-info"><span class="eyebrow">92% 비슷해요</span><h3>차근차근</h3><p>${state.goal} · ${state.level} · 주 ${state.frequency}회</p></div></div><button class="secondary wide" id="matchBtn" style="margin-top:14px">응원 보내기 (데모)</button>`;$('#matchBtn').onclick=()=>toast('응원을 보냈어요! 실제 전송은 되지 않아요.');}
function renderFeaturedRoutine(){
 const card=$('#creatorCard');if(!card)return;
 const routine=featuredRoutine,trainer=routine?.trainer_profiles;
 if(!routine||!trainer)return;
 const exercises=Array.isArray(routine.exercises)?routine.exercises.join(' · '):routine.summary;
 card.innerHTML=`<div class="match-top"><div class="match-photo">${trainer.avatar||'🏋️'}</div><div class="workout-info"><span class="eyebrow">인기 공개 루틴 · ${trainer.verified?'인증 트레이너':'트레이너'}</span><h3>${trainer.display_name}${trainer.verified?' ✓':''}</h3><p>${trainer.follower_label||''} · ${trainer.bio||''}</p></div></div><div id="routinePreview" class="routine-preview"><b>${routine.title}</b><br>${exercises}<br><span style="opacity:.72">${routine.level} · ${routine.duration}분 · ${routine.place==='gym'?'헬스장':'홈트레이닝'}</span></div><div class="creator-actions"><button id="previewRoutine" class="primary">루틴 보기</button><button id="copyRoutine" class="secondary">내 플랜에 담기</button></div>`;
 $('#previewRoutine').onclick=()=>{const p=$('#routinePreview');p.classList.toggle('open');$('#previewRoutine').textContent=p.classList.contains('open')?'접기':'루틴 보기'};
 $('#copyRoutine').onclick=copyCreatorRoutine;
}
function copyCreatorRoutine(){const source=featuredRoutine;const routine={id:Date.now(),day:['월','화','수','목','금','토','일'][state.plan.length%7],title:source?.title||'민지핏의 30분 파워 루틴',summary:source?.summary||'스쿼트 · 니푸시업 · 리버스 런지 · 플랭크',duration:source?.duration||30,level:source?.level||'중급',place:source?.place||'home',workoutType:source?.workout_type||'bodyweight',sourceRoutineId:source?.id||null};state.plan.push(routine);state.copiedRoutine=true;save();render();toast('공개 루틴을 내 플랜에 담았어요')}
function decorateSocialProfiles(){
 renderFeaturedRoutine();
 $$('#myLeaderboard .rank, #upperLeaderboard .rank, #matchCard .match-top').forEach(row=>{
  const name=row.dataset.me==='true'?'self':row.querySelector('.person b, .workout-info h3')?.textContent.trim().replace(/\s*● 인증\s*/,'');
  if(!name)return;
  row.dataset.demoProfile=name;row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',name==='self'?'내 마이페이지 보기':`${name}의 시연용 프로필과 운동 기록 보기`);
 });
}
function openDemoProfile(name){
 if(!window.aiTrainerUser)return;
 if(name==='self'){go('mypage');return}
 const score=[...name].reduce((sum,char)=>sum+char.charCodeAt(0),0),count=3+score%8;
 $('#demoProfileName').textContent=name;
 $('#demoProfileIntro').textContent='이번 주에도 꾸준히 운동 중인 회원 · 시연용 프로필';
 $('#demoProfileStats').textContent=`이번 주 운동 ${count}회 · 운동 시간 ${count*20}분`;
 const activities=['전신 컨디셔닝','코어 밸런스','저강도 유산소'];
 $('#demoProfileWorkouts').replaceChildren(...[0,1,2].map((i)=>{
  const row=document.createElement('div');row.className='demo-activity';
  const title=document.createElement('b');title.textContent=activities[(score+i)%activities.length];
  const detail=document.createElement('span');detail.textContent=`이번 주 ${['월','수','금'][i]}요일 · 20분 완료`;
  row.append(title,detail);return row;
 }));
 $('#profileModal').classList.add('open');
}
$('#socialMemberContent').addEventListener('click',e=>{const row=e.target.closest('[data-demo-profile]');if(row)openDemoProfile(row.dataset.demoProfile)});
$('#socialMemberContent').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const row=e.target.closest('[data-demo-profile]');if(row){e.preventDefault();openDemoProfile(row.dataset.demoProfile)}});
$('#closeProfileModal').onclick=()=>$('#profileModal').classList.remove('open');
$('#profileModal').onclick=e=>{if(e.target.id==='profileModal')e.currentTarget.classList.remove('open')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#profileModal').classList.remove('open')});
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._id);t._id=setTimeout(()=>t.classList.remove('show'),2200)}
function updateSocialAccess(){const signedIn=Boolean(window.aiTrainerUser);$('#socialGuest').hidden=signedIn;$('#socialMemberContent').hidden=!signedIn;if(signedIn&&$('#social').classList.contains('active')&&!state.socialVisited){state.socialVisited=true;save();renderBadges()}}
window.updateSocialAccess=updateSocialAccess;
window.applyAiTrainerNickname=nickname=>{
 state.name=nickname;
 $('#nickname').value=nickname;
 localStorage.setItem(KEY,JSON.stringify(state));
 render();
};
window.onAiTrainerAuthChanged=async user=>{
 if(!user)return;
 const remoteState=await window.aiTrainerData?.loadUserState?.();
 if(!remoteState)return;
 state={...state,...remoteState,name:state.name};
 localStorage.setItem(KEY,JSON.stringify(state));
 selected=0;render();
};
function go(id){const activeTab=id==='settings'?'mypage':id;$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===activeTab));$('.app').scrollTop=0;render();if(id==='social')updateSocialAccess()}
function enterApp(){state.loginSeen=true;save();$('#loginScreen').classList.add('hidden');toast('AI트레이너에 오신 것을 환영해요!')}
$('#loginSkip').onclick=enterApp;if(state.loginSeen)$('#loginScreen').classList.add('hidden');
$('#toggleBadges').onclick=()=>{const d=$('#badgeDetail');d.classList.toggle('open');$('#toggleBadges').textContent=d.classList.contains('open')?'배지 목록 접기':'전체 배지 목록 보기'};
$('#planForm').onsubmit=e=>{e.preventDefault();makePlan()};$('#closeModal').onclick=()=>$('#modal').classList.remove('open');$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.remove('open')};$('#completeWorkout').onclick=()=>{const w=state.plan[selected],i=state.completed.indexOf(w.id);if(i<0){state.completed.push(w.id);state.streak=Math.max(1,state.streak+1);toast('멋져요! 운동을 완료했어요 🎉')}else{state.completed.splice(i,1);state.streak=Math.max(0,state.streak-1);window.aiTrainerData?.removeWorkoutLog?.(w.id);toast('완료 기록을 취소했어요')}save();$('#modal').classList.remove('open');render()};$$('.tab').forEach(t=>t.onclick=()=>go(t.dataset.page));$$('[data-go]').forEach(t=>t.onclick=()=>go(t.dataset.go));$$('[data-switch]').forEach(s=>s.onclick=()=>s.classList.toggle('on'));$('#nickname').value=state.name;$('#saveProfile').onclick=()=>{state.name=$('#nickname').value.trim()||'운동새싹';save();render();toast('프로필을 저장했어요')};$('#resetData').onclick=()=>{if(confirm('모든 데모 기록을 초기화할까요?')){state={...defaultState,checks:{...defaultState.checks},plan:[],completed:[]};save();location.reload()}};
$('#goal').value=state.goal;$('#level').value=state.level;$('#frequency').value=state.frequency;$('#duration').value=state.duration;$('#place').value=state.place;$('#workoutType').value=state.workoutType;$('#caution').value=state.caution;
async function repairSavedPlan(){
 await templatesReady;
 if(!state.plan.length)return;
 const set=templates[state.goal];
 if(!Array.isArray(set)||!set.length)return;
 let changed=false;
 state.plan=state.plan.map((w,i)=>{
  const migrated={...w,place:w.place||state.place,workoutType:w.workoutType||state.workoutType};
  if(!w.place||!w.workoutType)changed=true;
  if(migrated.title&&migrated.summary)return migrated;
  changed=true;
  const item=set[i%set.length];
  return {...migrated,title:item.title||item[0],summary:item.summary||item[1],duration:w.duration||state.duration,level:w.level||state.level};
 });
 if(changed)save();
}
repairSavedPlan().then(render);
$('#socialLoginButton').onclick=()=>$('#loginScreen').classList.remove('hidden');
updateSocialAccess();


