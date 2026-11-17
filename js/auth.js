(function(){
  const client=window.supabaseClient;
  const $=s=>document.querySelector(s);
  const message=(text,isError=false)=>{const el=$('#authMessage');if(el){el.textContent=text;el.classList.toggle('auth-error',isError)}};
  const setAccount=(user)=>{
    const email=$('#accountEmail'),logout=$('#logoutButton'),loginButton=$('#loginAccountButton');
    if(email)email.textContent=user?.email||'게스트로 이용 중';
    if(logout)logout.hidden=!user;
    if(loginButton)loginButton.hidden=Boolean(user);
  };
  const enter=()=>$('#loginSkip')?.click();
  const getProfile=async(user)=>{
    if(!client||!user)return;
    const {data,error}=await client.from('profiles').select('nickname').eq('id',user.id).maybeSingle();
    if(error){console.warn('프로필 조회 실패',error.message);return}
    if(data?.nickname){const input=$('#nickname');if(input)input.value=data.nickname;const name=$('#myName');if(name)name.textContent=data.nickname;}else{const nickname=$('#nickname')?.value.trim()||'운동새싹';const {error:insertError}=await client.from('profiles').upsert({id:user.id,nickname});if(insertError)console.warn('기본 프로필 생성 실패',insertError.message);}
  };
  const saveProfile=async(user,nickname)=>{
    if(!client||!user)return;
    const {error}=await client.from('profiles').upsert({id:user.id,nickname,updated_at:new Date().toISOString()});
    if(error)message('닉네임은 이 기기에 저장했지만 서버 저장은 실패했습니다: '+error.message,true);
  };
  const login=async()=>{
    if(!client){message('Supabase 설정이 아직 완료되지 않았습니다. js/supabase-config.js를 확인해 주세요',true);return}
    const email=$('#authEmail')?.value.trim(),password=$('#authPassword')?.value;
    if(!email||!password){message('이메일과 비밀번호를 입력해 주세요',true);return}
    const button=$('#loginNext');button.disabled=true;message('로그인 중입니다…');
    const {data,error}=await client.auth.signInWithPassword({email,password});
    button.disabled=false;
    if(error){message('로그인에 실패했습니다: '+error.message,true);return}
    setAccount(data.user);await getProfile(data.user);enter();
  };
  const signup=async()=>{
    if(!client){message('Supabase 설정이 아직 완료되지 않았습니다. js/supabase-config.js를 확인해 주세요',true);return}
    const email=$('#authEmail')?.value.trim(),password=$('#authPassword')?.value;
    if(!email||!password){message('이메일과 비밀번호를 입력해 주세요',true);return}
    if(password.length<6){message('비밀번호는 6자 이상 입력해 주세요',true);return}
    const button=$('#signupButton');button.disabled=true;message('회원가입 중입니다…');
    const {data,error}=await client.auth.signUp({email,password});button.disabled=false;
    if(error){message('회원가입에 실패했습니다: '+error.message,true);return}
    if(data.session){setAccount(data.user);await getProfile(data.user);message('회원가입이 완료되었습니다');enter();}
    else message('가입 요청이 완료되었습니다. 이메일 인증 링크를 확인한 뒤 로그인해 주세요');
  };
  document.addEventListener('DOMContentLoaded',()=>{});
  if($('#loginNext'))$('#loginNext').onclick=login;
  $('#signupButton')?.addEventListener('click',signup);
  $('#authPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  $('#loginAccountButton')?.addEventListener('click',()=>$('#loginScreen').classList.remove('hidden'));
  $('#logoutButton')?.addEventListener('click',async()=>{
    if(!client)return;const {error}=await client.auth.signOut();if(error){message('로그아웃 실패: '+error.message,true);return}setAccount(null);$('#loginScreen').classList.remove('hidden');message('로그아웃했습니다');
  });
  const originalSave=$('#saveProfile')?.onclick;
  $('#saveProfile')?.addEventListener('click',async()=>{
    const {data}=client?await client.auth.getUser():{data:{user:null}};
    if(data?.user)await saveProfile(data.user,$('#nickname').value.trim()||'운동새싹');
  });
  if(client){
    client.auth.getSession().then(async({data,error})=>{
      if(error){console.warn('세션 확인 실패',error.message);return}
      if(data.session?.user){setAccount(data.session.user);await getProfile(data.session.user);$('#loginScreen')?.classList.add('hidden');}
    });
    client.auth.onAuthStateChange((_event,session)=>{setAccount(session?.user||null)});
  }else setAccount(null);
})();
