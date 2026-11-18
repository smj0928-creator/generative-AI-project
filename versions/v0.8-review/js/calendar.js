(function(){
  const mypage=document.querySelector('#mypage'),stats=mypage?.querySelector('.stats-grid');
  if(!stats)return;
  const section=document.createElement('section');
  section.className='streak-section';
  section.innerHTML=`<div class="section-head"><h2>연속 운동 달력</h2><span>실제 완료 날짜</span></div>
    <div class="card streak-card"><div class="streak-intro"><span class="streak-flame" aria-hidden="true">🔥</span><div><b><span id="calendarStreak">0</span>일 연속 운동</b><p id="calendarIntro">첫 운동을 완료하면 달력에 표시돼요.</p></div></div>
    <div class="calendar-heading"><button id="calendarPrev" type="button" aria-label="이전 달">‹</button><strong id="calendarMonth"></strong><button id="calendarNext" type="button" aria-label="다음 달">›</button></div>
    <p id="calendarMonthCount" class="tiny"></p><div class="calendar-weekdays" aria-hidden="true"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
    <div id="calendarDays" class="calendar-days"></div><p id="calendarDayDetail" class="calendar-detail" role="status"></p>
    <p class="tiny calendar-note">운동 완료 기록이 있는 날짜만 불꽃으로 표시됩니다. 이전 기록에 날짜가 없으면 표시되지 않을 수 있어요.</p></div>`;
  stats.insertAdjacentElement('afterend',section);
  const $=s=>section.querySelector(s);
  let month=new Date(),currentState=null,selectedDay=null;
  month=new Date(month.getFullYear(),month.getMonth(),1);
  const dayKey=value=>new Date(value).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  function render(state){
    if(!state)return;currentState=state;
    const entries=(Array.isArray(state.activityHistory)?state.activityHistory:[]).filter(x=>x.completedAt&&!Number.isNaN(Date.parse(x.completedAt)));
    const grouped=new Map();for(const item of entries){const key=dayKey(item.completedAt);grouped.set(key,[...(grouped.get(key)||[]),item])}
    const count=state.streak||0;$('#calendarStreak').textContent=count;
    $('#calendarIntro').textContent=count?'쉬는 날도 회복의 일부예요. 무리하지 말고 이어가요.':'첫 운동을 완료하면 달력에 표시돼요.';
    const year=month.getFullYear(),index=month.getMonth(),days=new Date(year,index+1,0).getDate();
    $('#calendarMonth').textContent=`${year}년 ${index+1}월`;
    const monthPrefix=`${year}-${String(index+1).padStart(2,'0')}-`;
    $('#calendarMonthCount').textContent=`이번 달 운동한 날 ${[...grouped.keys()].filter(key=>key.startsWith(monthPrefix)).length}일`;
    const grid=$('#calendarDays');grid.replaceChildren();
    for(let i=0;i<new Date(year,index,1).getDay();i++){const blank=document.createElement('span');blank.className='calendar-blank';grid.append(blank)}
    const today=dayKey(new Date());
    for(let n=1;n<=days;n++){
      const key=monthPrefix+String(n).padStart(2,'0'),items=grouped.get(key)||[];
      const button=document.createElement('button');button.type='button';button.className='calendar-day';
      if(items.length)button.classList.add('worked');if(key===today)button.classList.add('today');
      if(key===selectedDay)button.classList.add('selected');
      button.textContent=String(n);button.setAttribute('aria-label',`${index+1}월 ${n}일, 운동 ${items.length}회`);
      button.onclick=()=>{selectedDay=key;showDetail(key,grouped);render(currentState)};grid.append(button);
    }
    showDetail(selectedDay||today,grouped);
  }
  function showDetail(key,grouped){const items=grouped.get(key)||[];const date=key?.split('-')||[];$('#calendarDayDetail').textContent=items.length?`${Number(date[1])}월 ${Number(date[2])}일 · ${items.length}회 완료 · ${items.map(x=>x.title||'운동').join(', ')}`:`${Number(date[1])}월 ${Number(date[2])}일 · 완료한 운동이 없어요.`}
  $('#calendarPrev').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);selectedDay=null;render(currentState)};
  $('#calendarNext').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);selectedDay=null;render(currentState)};
  window.aiTrainerCalendar={render};
})();
