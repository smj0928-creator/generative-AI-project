(function(){
  const config=window.SUPABASE_CONFIG||{};
  const ready=Boolean(window.supabase?.createClient && config.url && config.publishableKey && !config.url.startsWith('YOUR_') && !config.publishableKey.startsWith('YOUR_'));
  window.supabaseReady=ready;
  window.supabaseClient=ready?window.supabase.createClient(config.url,config.publishableKey):null;
  if(!ready) console.info('Supabase 설정 대기 중: js/supabase-config.js에 Project URL과 Publishable Key를 입력하세요');
})();
