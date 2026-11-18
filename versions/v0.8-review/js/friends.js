(function(){
  const host=document.querySelector('#socialMemberContent'),client=window.supabaseClient;
  if(!host)return;
  const section=document.createElement('section');section.className='friends-section';
  section.innerHTML=`<div class="section-head"><h2>친구와 연속 운동</h2><span>로그인 회원</span></div>
    <div class="card"><p class="tiny">초대 코드를 공유해 친구를 추가하세요. 친구가 수락하면 서로의 운동 연속 일수를 볼 수 있어요.</p>
    <div class="friend-code"><span>내 초대 코드</span><b id="myFriendCode">불러오는 중…</b><button id="copyFriendCode" class="secondary" type="button">복사</button></div>
    <label class="tiny" for="friendCodeInput">친구의 초대 코드</label><div class="friend-add"><input id="friendCodeInput" maxlength="8" inputmode="text" autocomplete="off" placeholder="8자리 코드"><button id="sendFriendRequest" class="primary" type="button">친구 요청</button></div>
    <p id="friendMessage" class="tiny" role="status"></p></div>
    <div class="card"><b>친구 요청</b><div id="friendRequests" class="friend-list"></div></div>
    <div class="card"><b>내 친구</b><div id="friendList" class="friend-list"></div></div>`;
  host.insertBefore(section,host.firstChild);
  const $=s=>section.querySelector(s);
  let currentUser=null,epoch=0;
  const localDay=value=>new Date(value).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  function streakOf(dates){const set=new Set(dates||[]);let day=new Date(),count=0;if(!set.has(localDay(day)))day.setDate(day.getDate()-1);while(set.has(localDay(day))){count++;day.setDate(day.getDate()-1)}return count}
  function notice(text,error=false){const el=$('#friendMessage');el.textContent=text;el.classList.toggle('friend-error',error)}
  function row(name,detail,actions=[]){const el=document.createElement('div');el.className='friend-row';const person=document.createElement('div');person.className='friend-person';const avatar=document.createElement('span');avatar.className='friend-avatar';avatar.textContent='🙂';const labels=document.createElement('div');const title=document.createElement('b');title.textContent=name;const sub=document.createElement('small');sub.textContent=detail;labels.append(title,sub);person.append(avatar,labels);el.append(person);for(const action of actions){const button=document.createElement('button');button.type='button';button.className=action.primary?'primary':'secondary';button.textContent=action.label;button.onclick=action.click;el.append(button)}return el}
  async function ensureProfile(user){
    const {data,error}=await client.from('friend_profiles').select('user_id,nickname,invite_code').eq('user_id',user.id).maybeSingle();
    if(error)throw error;if(data)return data;
    const nickname=(user.user_metadata?.nickname||'운동새싹').slice(0,12);
    const created=await client.from('friend_profiles').insert({user_id:user.id,nickname}).select('user_id,nickname,invite_code').single();
    if(created.error)throw created.error;return created.data;
  }
  async function load(user){
    currentUser=user||null;const run=++epoch;
    if(!user){$('#myFriendCode').textContent='로그인 필요';$('#friendRequests').replaceChildren();$('#friendList').replaceChildren();return}
    if(!client){notice('친구 연결을 사용할 수 없어요.',true);return}
    try{
      notice('친구 정보를 불러오는 중…');
      const own=await ensureProfile(user);
      const {data:requests,error:reqError}=await client.from('friend_requests').select('id,requester_id,recipient_id,status,created_at').order('created_at',{ascending:false});
      if(reqError)throw reqError;
      const ids=[...new Set([user.id,...(requests||[]).flatMap(r=>[r.requester_id,r.recipient_id])])];
      const {data:profiles,error:profileError}=await client.from('friend_profiles').select('user_id,nickname').in('user_id',ids);
      if(profileError)throw profileError;
      const {data:activity,error:activityError}=await client.rpc('friend_activity_dates');
      if(activityError)throw activityError;
      if(run!==epoch)return;
      const names=new Map((profiles||[]).map(p=>[p.user_id,p.nickname]));
      const dates=new Map((activity||[]).map(p=>[p.user_id,p.dates||[]]));
      $('#myFriendCode').textContent=own.invite_code;
      const incoming=(requests||[]).filter(r=>r.status==='pending'&&r.recipient_id===user.id);
      const outgoing=(requests||[]).filter(r=>r.status==='pending'&&r.requester_id===user.id);
      const accepted=(requests||[]).filter(r=>r.status==='accepted');
      const pendingBox=$('#friendRequests');pendingBox.replaceChildren();
      for(const r of incoming)pendingBox.append(row(names.get(r.requester_id)||'회원','친구 요청을 보냈어요',[{label:'수락',primary:true,click:()=>answer(r.id,true)},{label:'거절',click:()=>answer(r.id,false)}]));
      for(const r of outgoing)pendingBox.append(row(names.get(r.recipient_id)||'회원','수락 대기 중'));
      if(!incoming.length&&!outgoing.length)pendingBox.textContent='대기 중인 요청이 없어요.';
      const friendBox=$('#friendList');friendBox.replaceChildren();
      for(const r of accepted){const other=r.requester_id===user.id?r.recipient_id:r.requester_id;friendBox.append(row(names.get(other)||'회원',`🔥 ${streakOf(dates.get(other))}일 연속 운동`,[{label:'삭제',click:()=>remove(r.id)}]))}
      if(!accepted.length)friendBox.textContent='아직 친구가 없어요. 초대 코드로 친구를 추가해 보세요.';
      notice('');
    }catch(error){if(run!==epoch)return;console.warn('친구 정보 조회 실패',error);const pending=error?.code==='PGRST205'||/friend_profiles|friend_requests|schema cache/i.test(error?.message||'');notice(pending?'친구 데이터 연결을 준비 중이에요. 현재는 초대 기능을 사용할 수 없어요.':'친구 기능을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',true);$('#sendFriendRequest').disabled=pending}
  }
  async function send(){if(!currentUser){notice('로그인 후 이용할 수 있어요.',true);return}const code=$('#friendCodeInput').value.trim().toUpperCase();if(!/^[A-F0-9]{8}$/.test(code)){notice('8자리 초대 코드를 확인해 주세요.',true);return}const button=$('#sendFriendRequest');button.disabled=true;try{const {error}=await client.rpc('send_friend_request',{p_code:code});if(error)throw error;$('#friendCodeInput').value='';await load(currentUser);notice('친구 요청을 보냈어요. 상대가 수락하면 연속 운동 기록이 보입니다.')}catch(error){const msg=error.message||'';notice(msg.includes('own_code')?'내 코드는 입력할 수 없어요.':msg.includes('code_not_found')?'초대 코드를 찾지 못했어요.':msg.includes('already_friends')?'이미 친구예요.':msg.includes('already_pending')?'이미 요청을 보냈거나 받은 상태예요.':'친구 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',true)}finally{button.disabled=false}}
  async function answer(id,accept){const {error}=await client.rpc('answer_friend_request',{p_request_id:id,p_accept:accept});if(error){notice('요청을 처리하지 못했어요.',true);return}await load(currentUser)}
  async function remove(id){if(!confirm('이 친구를 목록에서 삭제할까요?'))return;const {error}=await client.rpc('remove_friend',{p_request_id:id});if(error){notice('친구를 삭제하지 못했어요.',true);return}await load(currentUser)}
  async function updateNickname(nickname){if(!client||!currentUser)return;const {error}=await client.from('friend_profiles').update({nickname:nickname.slice(0,12)}).eq('user_id',currentUser.id);if(error)console.warn('친구 프로필 이름 저장 실패',error.message)}
  $('#sendFriendRequest').onclick=send;
  $('#friendCodeInput').onkeydown=e=>{if(e.key==='Enter')send()};
  $('#copyFriendCode').onclick=async()=>{const code=$('#myFriendCode').textContent;if(!/^[A-F0-9]{8}$/.test(code))return;try{await navigator.clipboard.writeText(code);notice('초대 코드를 복사했어요.')}catch{notice('복사가 되지 않았어요. 코드를 직접 선택해 주세요.',true)}};
  window.aiTrainerFriends={load,updateNickname};
  client?.auth.getUser().then(({data})=>load(data?.user||null)).catch(error=>console.warn('친구 로그인 확인 실패',error));
})();
