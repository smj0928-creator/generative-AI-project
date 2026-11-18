(function(){
  const client=window.supabaseClient;
  const $=s=>document.querySelector(s);
  const message=(text,isError=false)=>{const el=$('#authMessage');if(el){el.textContent=text;el.classList.toggle('auth-error',isError)}};
  const fieldError=(field,text='')=>{const input=$('#auth'+field),error=$('#auth'+field+'Error');if(!input||!error)return;input.setAttribute('aria-invalid',String(Boolean(text)));error.textContent=text;error.hidden=!text};
  const clearErrors=()=>{fieldError('Email');fieldError('Password');message('로그인하면 계획과 완료 기록을 계정에 저장할 수 있어요.')};
  const validate=(mode)=>{
    const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
    fieldError('Email');fieldError('Password');
    if(!email)fieldError('Email','이메일을 입력해 주세요.');
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fieldError('Email','이메일 형식이 올바르지 않아요. 예: name@example.com');
    if(!password)fieldError('Password','비밀번호를 입력해 주세요.');
    else if(mode==='signup'&&password.length<6)fieldError('Password','비밀번호는 6자 이상 입력해 주세요.');
    const first=$('[aria-invalid="true"]');if(first){message('빨간색으로 표시된 입력 항목을 확인해 주세요.',true);first.focus();return null}
    return {email,password};
  };
  const authFailure=(error,mode)=>{
    const code=error?.code||'',raw=(error?.message||'').toLowerCase();
    if(code==='email_address_invalid'||raw.includes('invalid email')){fieldError('Email','이메일 형식이 올바르지 않아요.');message('이메일 주소를 확인해 주세요.',true);return}
    if(code==='weak_password'||raw.includes('password should be')){fieldError('Password','비밀번호는 6자 이상 입력해 주세요.');message('비밀번호를 확인해 주세요.',true);return}
    if(code==='email_not_confirmed'){message('이메일 인증이 필요해요. 받은편지함의 인증 링크를 확인해 주세요.',true);return}
    if(code==='user_already_exists'&&mode==='signup'){message('이미 가입된 이메일이에요. 로그인해 주세요.',true);return}
    if(code==='invalid_credentials'||raw.includes('invalid login credentials')){message('이메일 또는 비밀번호가 맞지 않아요. 두 항목을 다시 확인해 주세요.',true);return}
    if(error?.status===429||code.includes('rate_limit')){message('요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',true);return}
    message((mode==='signup'?'회원가입':'로그인')+'을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.',true);
  };
  const setAccount=(user)=>{
    window.aiTrainerUser=user||null;
    const email=$('#accountEmail'),logout=$('#logoutButton'),loginButton=$('#loginAccountButton');
    if(email)email.textContent=user?.email||'게스트로 이용 중';
    if(logout)logout.hidden=!user;
    if(loginButton)loginButton.hidden=Boolean(user);
    window.updateSocialAccess?.();
    window.onAiTrainerAuthChanged?.(user||null);
  };
  const enter=()=>$('#loginSkip')?.click();
  const getProfile=async(user)=>{
    if(!user)return;
    const nickname=user.user_metadata?.nickname;
    if(nickname)window.applyAiTrainerNickname?.(nickname);
  };
  const saveProfile=async(user,nickname)=>{
    if(!client||!user)return;
    const {error}=await client.auth.updateUser({data:{nickname}});
    if(error)message('닉네임은 이 기기에 저장했지만 서버 저장은 실패했습니다: '+error.message,true);
  };
  const login=async()=>{
    const values=validate('login');if(!values)return;
    if(!client){message('로그인 연결을 사용할 수 없어요. 잠시 후 다시 시도해 주세요.',true);return}
    const button=$('#loginNext');button.disabled=true;message('로그인 중입니다…');
    try{const {data,error}=await client.auth.signInWithPassword(values);if(error){authFailure(error,'login');return}clearErrors();setAccount(data.user);await getProfile(data.user);enter()}
    catch(error){authFailure(error,'login')}
    finally{button.disabled=false}
  };
  const signup=async()=>{
    const values=validate('signup');if(!values)return;
    if(!client){message('회원가입 연결을 사용할 수 없어요. 잠시 후 다시 시도해 주세요.',true);return}
    const button=$('#signupButton');button.disabled=true;message('회원가입 중입니다…');
    try{const {data,error}=await client.auth.signUp(values);if(error){authFailure(error,'signup');return}clearErrors();if(data.session){setAccount(data.user);await getProfile(data.user);message('회원가입이 완료되었습니다');enter()}else message('가입 요청이 완료됐어요. 받은편지함의 인증 링크를 확인한 뒤 로그인해 주세요.')}
    catch(error){authFailure(error,'signup')}
    finally{button.disabled=false}
  };
  $('#authEmail')?.addEventListener('input',()=>{fieldError('Email');message('로그인하면 계획과 완료 기록을 계정에 저장할 수 있어요.')});
  $('#authPassword')?.addEventListener('input',()=>{fieldError('Password');message('로그인하면 계획과 완료 기록을 계정에 저장할 수 있어요.')});
  if($('#loginNext'))$('#loginNext').onclick=login;
  $('#signupButton')?.addEventListener('click',signup);
  $('#authPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
  $('#loginAccountButton')?.addEventListener('click',()=>$('#loginScreen').classList.remove('hidden'));
  $('#logoutButton')?.addEventListener('click',async()=>{
    if(!client)return;const {error}=await client.auth.signOut();if(error){message('로그아웃 실패: '+error.message,true);return}setAccount(null);$('#loginScreen').classList.remove('hidden');message('로그아웃했습니다');
  });
  $('#saveProfile')?.addEventListener('click',async()=>{
    const {data}=client?await client.auth.getUser():{data:{user:null}};
    if(data?.user)await saveProfile(data.user,$('#nickname').value.trim()||'운동새싹');
  });
  if(client){
    client.auth.getSession().then(async({data,error})=>{
      if(error){console.warn('세션 확인 실패',error.message);$('#loginScreen')?.classList.remove('hidden');return}
      if(data.session?.user){setAccount(data.session.user);await getProfile(data.session.user);$('#loginScreen')?.classList.add('hidden');}
      else $('#loginScreen')?.classList.remove('hidden');
    });
    client.auth.onAuthStateChange((_event,session)=>{setAccount(session?.user||null)});
  }else{
    setAccount(null);
    $('#loginScreen')?.classList.remove('hidden');
  }
})();
