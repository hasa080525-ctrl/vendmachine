/*
 * Generates static landing pages under /areas/:
 *  - 1 hub page listing all 16 regions
 *  - 16 region pages (LK 자판기 설치, one per 시/도 — 광주·전남은 REGIONS
 *    데이터상 "전남광주통합특별시" 한 항목으로 합쳐져 있음, vansuccess와 동일)
 *  - ~230 district pages, one per real 시/군/구
 * Also (re)writes sitemap-areas.xml with every URL from this run.
 * Re-run this script (`node scripts/generate-areas.js`) whenever region/
 * district copy needs to change - do not hand-edit the generated files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AREAS_DIR = path.join(ROOT, 'areas');
const SITE = 'https://vendmachine.co.kr';

// Copied verbatim from vansuccess.co.kr's scripts/generate-areas.js REGIONS
// dataset (real KR administrative divisions), reused here since it's the
// same nationwide install-service business model.
const REGIONS = [
  { name: '서울특별시', districts: ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'] },
  { name: '부산광역시', districts: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '강서구', '해운대구', '사하구', '금정구', '연제구', '수영구', '사상구', '기장군(기장읍 · 장안읍 · 정관읍 · 일광읍)'] },
  { name: '대구광역시', districts: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군(화원읍 · 논공읍 · 다사읍 · 유가읍 · 옥포읍 · 현풍읍)', '군위군(군위읍)'] },
  { name: '인천광역시', districts: ['미추홀구', '연수구', '남동구', '부평구', '계양구', '제물포구', '영종구', '서해구', '검단구', '강화군(강화읍)', '옹진군'] },
  { name: '대전광역시', districts: ['동구', '중구', '서구', '유성구', '대덕구'] },
  { name: '울산광역시', districts: ['중구', '남구', '동구', '북구', '울주군(언양읍 · 온산읍 · 온양읍 · 범서읍 · 청량읍 · 삼남읍)'] },
  { name: '세종특별자치시', districts: [] },
  { name: '전남광주통합특별시', districts: ['동구', '서구', '남구', '북구', '광산구', '목포시', '여수시', '순천시', '나주시', '광양시', '담양군(담양읍)', '곡성군(곡성읍)', '구례군(구례읍)', '고흥군(고흥읍 · 도양읍)', '보성군(보성읍 · 벌교읍)', '화순군(화순읍)', '장흥군(장흥읍 · 관산읍 · 대덕읍)', '강진군(강진읍)', '해남군(해남읍)', '영암군(영암읍 · 삼호읍)', '무안군(무안읍 · 일로읍 · 삼향읍)', '함평군(함평읍)', '영광군(영광읍 · 백수읍 · 홍농읍)', '장성군(장성읍)', '완도군(완도읍 · 금일읍 · 노화읍)', '진도군(진도읍)', '신안군(압해읍 · 지도읍)'] },
  { name: '경기도', districts: ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '안산시', '고양시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '과천시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '동두천시', '양주시', '포천시', '여주시', '양평군(양평읍)', '가평군(가평읍)', '연천군(연천읍 · 전곡읍)'] },
  { name: '강원특별자치도', districts: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군(홍천읍)', '횡성군(횡성읍)', '영월군(영월읍 · 상동읍)', '평창군(평창읍)', '정선군(정선읍 · 고한읍 · 사북읍 · 신동읍)', '철원군(철원읍 · 김화읍 · 갈말읍 · 동송읍)', '화천군(화천읍)', '양구군(양구읍)', '인제군(인제읍)', '고성군(간성읍 · 거진읍)', '양양군(양양읍)'] },
  { name: '충청북도', districts: ['청주시', '충주시', '제천시', '보은군(보은읍)', '옥천군(옥천읍)', '영동군(영동읍)', '증평군(증평읍)', '진천군(진천읍 · 덕산읍)', '괴산군(괴산읍)', '음성군(음성읍 · 금왕읍 · 대소읍)', '단양군(단양읍 · 매포읍)'] },
  { name: '충청남도', districts: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군(금산읍)', '부여군(부여읍)', '서천군(서천읍 · 장항읍)', '청양군(청양읍)', '홍성군(홍성읍 · 광천읍 · 홍북읍)', '예산군(예산읍 · 삽교읍)', '태안군(태안읍 · 안면읍)'] },
  { name: '전북특별자치도', districts: ['전주시', '익산시', '군산시', '정읍시', '남원시', '김제시', '완주군(봉동읍 · 삼례읍 · 용진읍)', '진안군(진안읍)', '무주군(무주읍)', '장수군(장수읍)', '임실군(임실읍)', '순창군(순창읍)', '고창군(고창읍)', '부안군(부안읍)'] },
  { name: '경상북도', districts: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군(의성읍)', '청송군(청송읍)', '영양군(영양읍)', '영덕군(영덕읍)', '청도군(청도읍 · 화양읍)', '고령군(대가야읍)', '성주군(성주읍)', '칠곡군(왜관읍 · 북삼읍 · 석적읍)', '예천군(예천읍 · 호명읍)', '봉화군(봉화읍)', '울진군(울진읍 · 평해읍)', '울릉군(울릉읍)'] },
  { name: '경상남도', districts: ['창원시', '김해시', '양산시', '진주시', '거제시', '통영시', '사천시', '밀양시', '의령군(의령읍)', '함안군(가야읍 · 칠원읍)', '창녕군(창녕읍 · 남지읍)', '고성군(고성읍)', '남해군(남해읍)', '하동군(하동읍)', '산청군(산청읍)', '함양군(함양읍)', '거창군(거창읍)', '합천군(합천읍)'] },
  { name: '제주특별자치도', districts: ['제주시', '서귀포시'] },
];

function baseName(district) {
  return district.replace(/\(.*\)$/, '');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function topicParticle(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '은';
  return code % 28 === 0 ? '는' : '은';
}

function regionSlug(region) {
  return `${region.name}-자판기설치`;
}
function districtSlug(region, district) {
  return `${region.name}-${baseName(district)}-자판기설치`;
}

function head(title, desc, canonical, keywords) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#1C1B18">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="keywords" content="${esc(keywords)}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/assets/site.css">
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LK 엘케이">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:url" content="${canonical}">`;
}

function header() {
  return `<header>
  <div class="wrap nav">
    <a class="logo" href="/"><span class="logo-mark">LK</span>LK 엘케이</a>
    <a class="nav-cta" href="tel:010-3951-0535">설치 문의 010-3951-0535</a>
  </div>
</header>
<div class="mobile-cta-bar">
  <a class="mobile-cta-call" href="tel:010-3951-0535">☎ 전화</a>
  <a class="mobile-cta-kakao" href="https://open.kakao.com/o/sOXeVnpi" target="_blank" rel="noopener">💬 카톡</a>
  <a class="mobile-cta-apply" href="/#apply">설치 상담</a>
</div>`;
}

function footer() {
  return `<footer>
  <div class="wrap">
    <p>© 2026 LK 엘케이. All rights reserved. · <a href="/" style="color:#fff;">홈으로</a></p>
  </div>
</footer>`;
}

function faqMini() {
  return `  <section class="section-alt">
    <div class="wrap" style="max-width:640px;">
      <div class="section-head"><h2>자주 묻는 질문</h2></div>
      <div class="faq-item open">
        <div class="faq-q">설치 비용은 어떻게 되나요?<span class="plus">+</span></div>
        <div class="faq-a"><p>설치 장소와 자판기 사양에 따라 달라질 수 있어 상담을 통해 정확히 안내해드립니다. 상담은 무료입니다.</p></div>
      </div>
      <div class="faq-item">
        <div class="faq-q">전국 어디든 설치가 가능한가요?<span class="plus">+</span></div>
        <div class="faq-a"><p>네, 전국 지역 설치가 가능합니다. 설치 희망 지역과 장소 유형을 상담 시 말씀해주시면 일정을 안내해드립니다.</p></div>
      </div>
    </div>
  </section>`;
}

function regionPageTemplate(region) {
  const title = `${region.name} 무인 자판기 설치 | LK 엘케이`;
  const desc = `${region.name} 지역 LK 광고형 홈타운 밴딩머신 설치 안내. 24시간 무인 운영, 원격 관리, 다국어 지원 자판기를 전국 어디서나 설치해드립니다.`;
  const canonical = `${SITE}/areas/${encodeURIComponent(regionSlug(region))}.html`;
  const keywords = `${region.name}자판기설치, ${region.name} 무인자판기, ${region.name} 밴딩머신, 자판기 설치업체, ${region.name} 무인매장`;
  const districtLinks = region.districts.length
    ? region.districts.map(d => `<a href="/areas/${encodeURIComponent(districtSlug(region, d))}.html">${region.name} ${baseName(d)} 자판기 설치</a>`).join('\n          ')
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head(title, desc, canonical, keywords)}
</head>
<body>
${header()}
<div class="breadcrumb"><a href="/">홈</a><span class="sep">/</span><a href="/areas/">설치 지역</a><span class="sep">/</span><span>${esc(region.name)}</span></div>
<section class="subpage-hero" style="padding:44px 0;">
  <div class="wrap">
    <h1>${esc(region.name)} 무인 자판기 설치</h1>
    <p>LK 광고형 홈타운 밴딩머신을 ${esc(region.name)} 전역에 설치해드립니다.</p>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><h2>${esc(region.name)}, 이렇게 설치됩니다</h2><p>병원·PC방·카페·학교/학원·아파트 커뮤니티·헬스장·관공서·오피스·종교시설 등 다양한 공간에 설치 가능합니다.</p></div>
    <div class="feat-grid">
      <div class="feat-card"><div class="feat-icon">⏱</div><h3>24시간 무인 운영</h3><p>인건비 부담 없이 24시간 운영됩니다.</p></div>
      <div class="feat-card"><div class="feat-icon">📶</div><h3>원격 관리</h3><p>문제 발생 시 원격으로 즉시 제어합니다.</p></div>
      <div class="feat-card"><div class="feat-icon">🌐</div><h3>다국어 지원</h3><p>한국어·영어·중국어·일본어를 지원합니다.</p></div>
      <div class="feat-card"><div class="feat-icon">🛞</div><h3>이동식 바퀴형</h3><p>바퀴가 있어 원하는 위치로 이동·배치할 수 있습니다.</p></div>
    </div>
  </div>
</section>
${faqMini()}
${districtLinks ? `<section class="section-alt">
  <div class="wrap">
    <div class="section-head"><h2>${esc(region.name)} 시/군/구별 설치 안내</h2></div>
    <div class="region-grid">
          ${districtLinks}
    </div>
  </div>
</section>` : ''}
<section class="cta-section" id="apply">
  <div class="wrap" style="max-width:520px;">
    <h2>${esc(region.name)} 자판기 설치, 지금 문의하세요</h2>
    <p>상담은 무료이며, 전화·카카오톡으로 편하게 문의하실 수 있습니다.</p>
    <div class="hero-actions" style="justify-content:center; display:flex; gap:12px;">
      <a class="btn-primary" style="background:var(--ink); color:#fff;" href="tel:010-3951-0535">☎ 전화 문의</a>
      <a class="btn-ghost" style="border-color:var(--ink); color:var(--ink);" href="https://open.kakao.com/o/sOXeVnpi" target="_blank" rel="noopener">💬 카톡 상담</a>
    </div>
    <p style="margin-top:20px;"><a href="/areas/" style="color:var(--accent-dark); font-weight:700;">전국 설치 지역 전체 보기 →</a></p>
  </div>
</section>
${footer()}
<script src="/assets/site.js"></script>
</body>
</html>
`;
}

function districtPageTemplate(region, district) {
  const district_ = baseName(district);
  const title = `${region.name} ${district_} 무인 자판기 설치 | LK 엘케이`;
  const desc = `${region.name} ${district_} 지역 LK 광고형 홈타운 밴딩머신 설치 안내. 24시간 무인 운영, 원격 관리, 다국어 지원 자판기를 설치해드립니다.`;
  const canonical = `${SITE}/areas/${encodeURIComponent(districtSlug(region, district))}.html`;
  const parentUrl = `/areas/${encodeURIComponent(regionSlug(region))}.html`;
  const keywords = `${district_}자판기설치, ${district_} 무인자판기, ${region.name}${district_}자판기, 자판기 설치업체, ${district_} 밴딩머신`;
  const hasSub = /\(.*\)$/.test(district);
  const subNote = hasSub ? district.match(/\((.*)\)$/)[1] : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head(title, desc, canonical, keywords)}
</head>
<body>
${header()}
<div class="breadcrumb"><a href="/">홈</a><span class="sep">/</span><a href="/areas/">설치 지역</a><span class="sep">/</span><a href="${parentUrl}">${esc(region.name)}</a><span class="sep">/</span><span>${esc(district_)}</span></div>
<section class="subpage-hero" style="padding:44px 0;">
  <div class="wrap">
    <h1>${esc(district_)} 무인 자판기 설치</h1>
    <p>LK 광고형 홈타운 밴딩머신을 ${esc(district_)} 전역에 설치해드립니다.</p>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-head"><h2>${esc(district_)} 설치 안내</h2><p>${esc(district_)}${topicParticle(district_)} <a href="${parentUrl}">${esc(region.name)}</a> 소속 지역으로, 전국 어디서나 동일한 조건으로 설치해드립니다.${hasSub ? ` ${esc(district_)} 관내 ${esc(subNote)} 등 모든 읍 지역도 동일하게 설치 가능합니다.` : ''}</p></div>
    <div class="feat-grid">
      <div class="feat-card"><div class="feat-icon">⏱</div><h3>24시간 무인 운영</h3><p>인건비 부담 없이 24시간 운영됩니다.</p></div>
      <div class="feat-card"><div class="feat-icon">📶</div><h3>원격 관리</h3><p>문제 발생 시 원격으로 즉시 제어합니다.</p></div>
      <div class="feat-card"><div class="feat-icon">🌐</div><h3>다국어 지원</h3><p>한국어·영어·중국어·일본어를 지원합니다.</p></div>
      <div class="feat-card"><div class="feat-icon">🛞</div><h3>이동식 바퀴형</h3><p>바퀴가 있어 원하는 위치로 이동·배치할 수 있습니다.</p></div>
    </div>
  </div>
</section>
${faqMini()}
<section class="cta-section" id="apply">
  <div class="wrap" style="max-width:520px;">
    <h2>${esc(district_)} 자판기 설치, 지금 문의하세요</h2>
    <p>상담은 무료이며, 전화·카카오톡으로 편하게 문의하실 수 있습니다.</p>
    <div class="hero-actions" style="justify-content:center; display:flex; gap:12px;">
      <a class="btn-primary" style="background:var(--ink); color:#fff;" href="tel:010-3951-0535">☎ 전화 문의</a>
      <a class="btn-ghost" style="border-color:var(--ink); color:var(--ink);" href="https://open.kakao.com/o/sOXeVnpi" target="_blank" rel="noopener">💬 카톡 상담</a>
    </div>
    <p style="margin-top:20px;"><a href="${parentUrl}" style="color:var(--accent-dark); font-weight:700;">${esc(region.name)} 전체 보기 →</a> · <a href="/areas/" style="color:var(--accent-dark); font-weight:700;">전국 설치 지역 전체 보기 →</a></p>
  </div>
</section>
${footer()}
<script src="/assets/site.js"></script>
</body>
</html>
`;
}

function hubTemplate() {
  const groups = REGIONS.map(region => {
    const links = [`<a href="/areas/${encodeURIComponent(regionSlug(region))}.html">${region.name} 전체</a>`]
      .concat(region.districts.map(d => `<a href="/areas/${encodeURIComponent(districtSlug(region, d))}.html">${region.name} ${baseName(d)}</a>`));
    return `      <div style="margin-bottom:28px;">
        <h3 style="margin-bottom:12px;">${esc(region.name)}</h3>
        <div class="region-grid">
          ${links.join('\n          ')}
        </div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head('전국 설치 지역 전체 목록 | LK 엘케이', '전국 16개 광역지자체, 시/군/구 단위 LK 광고형 홈타운 밴딩머신 설치 안내 페이지 모음입니다.', `${SITE}/areas/`, '전국 자판기 설치, 지역별 자판기 설치, 무인 자판기 설치업체')}
</head>
<body>
${header()}
<div class="breadcrumb"><a href="/">홈</a><span class="sep">/</span><span>설치 지역</span></div>
<section class="subpage-hero" style="padding:44px 0;">
  <div class="wrap">
    <h1>전국 설치 지역 전체 목록</h1>
    <p>전국 16개 광역지자체, 시/군/구 단위로 LK 광고형 홈타운 밴딩머신 설치 안내 페이지를 정리했습니다.</p>
  </div>
</section>
<section>
  <div class="wrap">
${groups}
  </div>
</section>
${footer()}
<script src="/assets/site.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(AREAS_DIR, { recursive: true });

let regionCount = 0;
let districtCount = 0;
const sitemapEntries = [];

for (const region of REGIONS) {
  const filename = `${regionSlug(region)}.html`;
  fs.writeFileSync(path.join(AREAS_DIR, filename), regionPageTemplate(region), 'utf8');
  sitemapEntries.push({ loc: `${SITE}/areas/${encodeURIComponent(filename)}`, priority: '0.6' });
  regionCount++;
  for (const district of region.districts) {
    const dFilename = `${districtSlug(region, district)}.html`;
    fs.writeFileSync(path.join(AREAS_DIR, dFilename), districtPageTemplate(region, district), 'utf8');
    sitemapEntries.push({ loc: `${SITE}/areas/${encodeURIComponent(dFilename)}`, priority: '0.5' });
    districtCount++;
  }
}
fs.writeFileSync(path.join(AREAS_DIR, 'index.html'), hubTemplate(), 'utf8');
sitemapEntries.unshift({ loc: `${SITE}/areas/`, priority: '0.7' });

const today = new Date().toISOString().slice(0, 10);
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap-areas.xml'), sitemapXml, 'utf8');

console.log(`Generated ${regionCount} region pages + ${districtCount} district pages + 1 hub page.`);
console.log(`Wrote sitemap-areas.xml with ${sitemapEntries.length} URLs.`);
