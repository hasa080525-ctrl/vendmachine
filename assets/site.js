(function(){
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if(burgerBtn && mobileNav){
    burgerBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      burgerBtn.classList.toggle('active', isOpen);
      burgerBtn.setAttribute('aria-expanded', isOpen);
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burgerBtn.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

document.querySelectorAll('.faq-q').forEach(q => {
  if(!q.parentElement.classList.contains('faq-item')) return;
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

function submitApplyForm(){
  const nameEl = document.getElementById('fName');
  const phoneEl = document.getElementById('fPhone');
  if(!nameEl || !phoneEl) return;
  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  if(!name || !phone){
    alert('업체명(또는 성함)과 연락처를 입력해주세요.');
    return;
  }
  const regionEl = document.getElementById('fRegion');
  const placeEl = document.getElementById('fPlace');
  const messageEl = document.getElementById('fMessage');
  const region = regionEl ? regionEl.value : '';
  const place = placeEl ? placeEl.value : '';
  const message = messageEl ? messageEl.value.trim() : '';
  const summary =
    '[LK 엘케이 자판기 설치 문의]\n' +
    '업체명/성함: ' + name + '\n' +
    '연락처: ' + phone + '\n' +
    '설치 희망 지역: ' + region + '\n' +
    '설치 장소 유형: ' + place + '\n' +
    '남기신 말씀: ' + (message || '(없음)');

  window.open('https://open.kakao.com/o/sOXeVnpi', '_blank', 'noopener');

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(summary).then(function(){
      alert('문의 내용이 복사되었습니다.\n곧 열리는(또는 열린) 카카오톡 채팅창에 붙여넣기(꾹 눌러서 붙여넣기) 해주세요!');
    }).catch(function(){
      alert('아래 오픈채팅에서 다음 내용으로 문의해주세요:\n\n' + summary);
    });
  } else {
    alert('아래 오픈채팅에서 다음 내용으로 문의해주세요:\n\n' + summary);
  }
}
