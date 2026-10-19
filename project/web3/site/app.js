const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover) and (pointer: fine)');
const storage = {get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
const escape = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const label = f => f.format === 'short' ? `EP ${String(f.number).padStart(2, '0')}` : `긴 이야기 ${f.number}`;
let films = [];

/* ---------- 모션 설정 ---------- */
const motionOn = () => root.dataset.motion === 'on';
const motionListeners = [];
function syncMotion(){
  const on = storage.get('arker-motion') !== 'off' && !systemMotion.matches;
  root.dataset.motion = on ? 'on' : 'off';
  document.body.classList.toggle('js-motion', on);
  for (const b of $$('#motion-toggle,#motion-footer')) { b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '모션 켜짐' : '모션 꺼짐'; }
  motionListeners.forEach(fn => fn(on));
}
syncMotion();
systemMotion.addEventListener('change', syncMotion);
for (const b of $$('#motion-toggle,#motion-footer')) b.addEventListener('click', () => { storage.set('arker-motion', motionOn() ? 'off' : 'on'); syncMotion(); });

/* ---------- 헤더·스크롤 ---------- */
$('#menu-toggle').addEventListener('click', () => { const open = $('#navigation').classList.toggle('open'); $('#menu-toggle').setAttribute('aria-expanded', String(open)); });
$$('#navigation a').forEach(a => a.addEventListener('click', () => { $('#navigation').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#navigation').classList.contains('open')) { $('#navigation').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); $('#menu-toggle').focus(); } });
const navObserver = new IntersectionObserver(entries => entries.forEach(({isIntersecting, target}) => { if (!isIntersecting) return; $$('#navigation a').forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${target.id}`))); }), {rootMargin: '-45% 0px -50% 0px'});
$$('main section[id]').forEach(s => navObserver.observe(s));

const floaters = $$('.hero-floaters [data-depth]');
const meter = $('.scroll-meter');
let ticking = false;
function onScroll(){
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    meter.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (motionOn() && y < innerHeight * 1.4) floaters.forEach(el => { el.style.transform = `translateY(${(-y * el.dataset.depth).toFixed(1)}px)`; });
  });
}
addEventListener('scroll', onScroll, {passive: true}); onScroll();
motionListeners.push(on => { if (!on) floaters.forEach(el => { el.style.transform = ''; }); });

/* 등장 효과 */
const revealObserver = new IntersectionObserver(entries => entries.forEach(({isIntersecting, target}) => { if (isIntersecting) { target.classList.add('in'); revealObserver.unobserve(target); } }), {threshold: .12});
$$('.reveal').forEach(el => revealObserver.observe(el));

/* 버튼을 누르면 만화 효과음 */
const powWords = ['쾅!', '딸깍!', '짠!', '스르륵~', '휭~', '좋아유!', '번쩍!'];
document.addEventListener('click', e => {
  if (!motionOn() || !e.detail) return;
  const target = e.target.closest('.btn,.chip,.knob,.door-pick,.square-btn,.polaroid,.cast-face,.seg button,.tv-play');
  if (!target) return;
  const pow = document.createElement('span');
  pow.className = 'pow'; pow.setAttribute('aria-hidden', 'true');
  pow.textContent = powWords[Math.floor(Math.random() * powWords.length)];
  pow.style.left = `${e.clientX}px`; pow.style.top = `${e.clientY - 20}px`; pow.style.setProperty('--r', `${Math.round(Math.random() * 24 - 12)}deg`);
  document.body.append(pow); pow.addEventListener('animationend', () => pow.remove(), {once: true});
});

/* ---------- 히어로 ---------- */
$$('.kinetic').forEach(line => { line.replaceChildren(...[...line.dataset.line].map((ch, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = ch; return s; })); });
const heroQuotes = ['바람은 밖에, 따뜻함은 안에!', '겨울엔 휭이, 여름엔 후끈이. 문 하나로 다 막네!', '색은 내가 정했어. 월넛! 호두색이 복 들어와.', '우리 휴지는 꼼짝도 안 혀!', '오십 년 만에 철들었네!'];
let quoteIndex = 0, quoteTimer;
function typeQuote(text){
  const el = $('#hero-quote');
  if (!motionOn()) { el.textContent = text; return; }
  el.classList.add('typing'); el.textContent = ''; let i = 0;
  const step = () => { el.textContent = text.slice(0, ++i); if (i < text.length) quoteTimer = setTimeout(step, 55); else el.classList.remove('typing'); };
  step();
}
function cycleQuotes(){ clearTimeout(quoteTimer); quoteIndex = (quoteIndex + 1) % heroQuotes.length; typeQuote(heroQuotes[quoteIndex]); quoteTimer = setTimeout(cycleQuotes, 5200); }
setTimeout(cycleQuotes, 4800);

const heroPeople = $$('.hero-person');
$('.hero').addEventListener('pointermove', e => {
  if (!motionOn() || e.pointerType !== 'mouse') return;
  const x = (e.clientX / innerWidth - .5) * 2, y = (e.clientY / innerHeight - .5) * 2;
  heroPeople.forEach((p, i) => { p.style.translate = `${(x * (i ? -14 : 14)).toFixed(1)}px ${(y * 6).toFixed(1)}px`; });
});

/* 소리: 모든 플레이어가 같은 상태를 씀 (첫 방문은 소리 켬, 미리보기 영상은 항상 무음) */
let muted = false;
const soundButton = $('#sound-toggle');
const playable = () => [$('#tv-video'), $('#cinema-video')];
function setMuted(value){
  muted = value;
  playable().forEach(v => { v.muted = value; });
  soundButton.classList.toggle('is-muted', value);
  soundButton.setAttribute('aria-pressed', String(value));
  const text = value ? '소리 켜기' : '소리 끄기';
  soundButton.setAttribute('aria-label', text); soundButton.title = text;
}
function playWithSound(video){
  video.muted = muted;
  return video.play().catch(error => {
    if (error?.name !== 'NotAllowedError' || muted) return;
    // 브라우저가 소리 있는 자동 재생을 막으면 무음으로 재생하고 소리 버튼을 꺼진 상태로 표시
    setMuted(true); return video.play().catch(() => {});
  });
}
soundButton.addEventListener('click', () => {
  setMuted(!muted);
  if (!muted) playable().forEach(v => { if (!v.paused) v.play().catch(() => {}); });
});
playable().forEach(v => v.addEventListener('volumechange', () => { if (v.muted !== muted) setMuted(v.muted); }));

/* TV: 본편이 화면에 붙어서 바로 재생, 채널 손잡이는 큰 화면 팝업 */
const tvVideo = $('#tv-video'), staticCanvas = $('#tv-static');
let heroVisible = true, tvUserPaused = false, tvAutoPausing = false;
function drawStatic(ms = 380){
  const ctx = staticCanvas.getContext('2d'); staticCanvas.width = 160; staticCanvas.height = 90;
  const img = ctx.createImageData(160, 90); const end = performance.now() + ms;
  staticCanvas.classList.add('on');
  const frame = () => {
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    if (performance.now() < end) requestAnimationFrame(frame); else staticCanvas.classList.remove('on');
  };
  frame();
}
function pauseTv(){ if (tvVideo.paused) return; tvAutoPausing = true; tvVideo.pause(); }
function syncTv(){
  const want = motionOn() && heroVisible && !document.hidden && !tvUserPaused && !$('#cinema').open;
  if (want) { if (tvVideo.paused) playWithSound(tvVideo); } else pauseTv();
}
tvVideo.addEventListener('pause', () => { if (tvAutoPausing) tvAutoPausing = false; else if (!tvVideo.ended) tvUserPaused = true; });
tvVideo.addEventListener('play', () => { tvUserPaused = false; });
$$('[data-channel]').forEach(b => b.addEventListener('click', () => {
  const id = b.dataset.channel;
  if (motionOn()) { drawStatic(); b.classList.add('turning'); setTimeout(() => b.classList.remove('turning'), 450); }
  pauseTv();
  setTimeout(() => navigateFilm(id), motionOn() ? 300 : 0);
}));
// tj001 처럼 첫 화면에서 바로 재생: TV가 화면 아래 반 화면 이내에 있으면 재생, 지나쳐 내려가면 멈춤
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; syncTv(); }, {rootMargin: '0px 0px 60% 0px'}).observe($('#hero-tv'));
motionListeners.push(syncTv);

/* ---------- 영상 카드 ---------- */
function attachPreview(card, film){
  const poster = $('.poster', card), body = $('.card-body', card);
  let video;
  card.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || !motionOn()) return;
    if (!video) { video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-hidden', 'true'); video.src = `assets/previews/${film.id}.mp4`; poster.append(video); }
    video.play().then(() => poster.classList.add('previewing')).catch(() => {});
  });
  card.addEventListener('pointerleave', () => { poster.classList.remove('previewing'); video?.pause(); body.style.transform = ''; });
  card.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !motionOn()) return;
    const r = body.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    body.style.transform = `rotateY(${(x * 12).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg) translateY(-6px)`;
  });
}
function filmCard(film, {kind = 'rail'} = {}){
  const card = document.createElement('article');
  const isShort = film.format === 'short';
  card.className = `film-card ${kind === 'rail' ? 'short-card' : ''} ${kind === 'long' ? 'long-card' : ''} ${isShort ? '' : 'is-long'}`;
  card.dataset.film = film.id;
  const chapters = kind === 'long' ? `<div class="chapters-peek" role="group" aria-label="${escape(film.title)} 챕터">${film.chapters.slice(1).map(([t, title]) => `<button class="chip" data-watch="${film.id}" data-start="${t}"><b>${fmt(t)}</b>${escape(title)}</button>`).join('')}</div>` : '';
  const meta = kind === 'long'
    ? `<p class="kicker">FEATURE FILM 0${film.number} · ${escape(film.topic)} · ${fmt(film.seconds)}</p><h3><button data-watch="${film.id}">${escape(film.title)}</button></h3><p class="hook">${escape(film.hook)}</p>${chapters}`
    : `<div class="card-meta"><p class="kicker">${label(film)} · ${escape(film.topic)}</p><h3><button data-watch="${film.id}">${escape(film.title)}</button></h3><p>${escape(film.hook)}</p></div>`;
  card.innerHTML = `<div class="card-body">${kind === 'long' ? '<span class="burst new-burst" aria-hidden="true"><span>NEW!</span></span>' : ''}<span class="num" aria-hidden="true">${isShort ? film.number : label(film)}</span><button class="poster ${isShort ? 'portrait' : 'landscape'}" data-watch="${film.id}" aria-label="${escape(film.title)} ${fmt(film.seconds)} 재생"><img src="${film.poster}" width="${isShort ? 540 : 1280}" height="${isShort ? 960 : 720}" alt="" loading="lazy" decoding="async">${kind === 'grid' ? `<span class="topic-tag">${escape(film.topic)}</span>` : ''}<span class="dur">${fmt(film.seconds)}</span><span class="play-disc" aria-hidden="true"><span class="tri"></span></span></button>${meta}</div>`;
  if (canHover.matches) attachPreview(card, film);
  return card;
}

/* 쇼츠 레일: 끌어서 넘기기 */
const rail = $('#short-rail');
function railProgress(){ const max = rail.scrollWidth - rail.clientWidth; $('#rail-bar').style.width = `${max > 0 ? Math.max(12, (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth * 100) : 100}%`; }
rail.addEventListener('scroll', railProgress, {passive: true}); addEventListener('resize', railProgress);
for (const [id, dir] of [['rail-prev', -1], ['rail-next', 1]]) $(`#${id}`).addEventListener('click', () => rail.scrollBy({left: dir * rail.clientWidth * .8, behavior: motionOn() ? 'smooth' : 'instant'}));
let drag = null;
rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; drag = {x: e.clientX, left: rail.scrollLeft, moved: false}; });
addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) { drag.moved = true; rail.classList.add('dragging'); } if (drag.moved) rail.scrollLeft = drag.left - dx; });
addEventListener('pointerup', () => { if (!drag) return; const moved = drag.moved; drag = null; rail.classList.remove('dragging'); if (moved) { const stop = ev => { ev.stopPropagation(); ev.preventDefault(); }; rail.addEventListener('click', stop, {capture: true, once: true}); setTimeout(() => rail.removeEventListener('click', stop, {capture: true}), 50); } });

/* ---------- 방송표 ---------- */
let topic = 'all', format = 'all';
const gridCards = new Map();
function renderGrid(){
  const term = $('#film-search').value.trim().toLocaleLowerCase('ko');
  const list = films.filter(f => (topic === 'all' || f.topic === topic) && (format === 'all' || f.format === format) && `${f.title} ${f.hook} ${f.topic} ${f.id}`.toLocaleLowerCase('ko').includes(term));
  const grid = $('#film-grid');
  const before = new Map([...grid.children].map(el => [el.dataset.film, el.getBoundingClientRect()]));
  const cards = list.map(f => { if (!gridCards.has(f.id)) gridCards.set(f.id, filmCard(f, {kind: 'grid'})); return gridCards.get(f.id); });
  grid.replaceChildren(...cards);
  if (motionOn()) cards.forEach((el, i) => {
    const old = before.get(el.dataset.film);
    if (old) { const now = el.getBoundingClientRect(); const dx = old.left - now.left, dy = old.top - now.top; if (dx || dy) el.animate([{transform: `translate(${dx}px,${dy}px)`}, {transform: 'none'}], {duration: 450, easing: 'cubic-bezier(.34,1.4,.64,1)'}); }
    else el.animate([{opacity: 0, transform: 'scale(.6) rotate(-6deg)'}, {opacity: 1, transform: 'none'}], {duration: 420, delay: i * 35, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards'});
  });
  $('#empty-state').hidden = list.length > 0;
  $('#results-status').textContent = `${list.length}편 방송 중`;
}
$('#film-search').addEventListener('input', renderGrid);
$$('[data-format]').forEach(b => b.addEventListener('click', () => { format = b.dataset.format; $$('[data-format]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderGrid(); }));

/* ---------- 바람 실험실 ---------- */
const lab = {stage: $('#lab-stage'), canvas: $('#wind-canvas'), door: 'arker', season: 'winter', parts: [], visible: false, raf: 0, last: 0, popAt: 0};
const labCopy = {
  'arker-winter': ['아커 문 앞에서 휭이가 길을 잃었어요. 집 안은 따뜻!', 'halmae-laugh', '따뜻해서 웃는 복순 할매', 72],
  'old-winter': ['옛날 문 틈으로 휭이가 쏙! 할매가 덜덜 떨어요.', 'halmae-cold', '추위에 떠는 복순 할매', 22],
  'arker-summer': ['어이쿠, 후끈이가 튕겨 나가네! 집 안은 시원.', 'halmae-laugh', '시원해서 웃는 복순 할매', 42],
  'old-summer': ['후끈이가 쳐들어온다! 고무신이 다 녹겄네!', 'halmae-hot', '더위에 부채질하는 복순 할매', 94],
};
function setLab(){
  const key = `${lab.door}-${lab.season}`, [text, face, alt, temp] = labCopy[key];
  lab.stage.dataset.door = lab.door; lab.stage.dataset.season = lab.season;
  $('#lab-result').textContent = text;
  const halmae = $('#lab-halmae'), door = $('#lab-door');
  const faceSrc = `assets/cutouts/${face}.webp`;
  if (!halmae.src.endsWith(faceSrc)) { halmae.src = faceSrc; halmae.alt = alt; halmae.classList.remove('swap'); void halmae.offsetWidth; halmae.classList.add('swap'); }
  const doorSrc = lab.door === 'arker' ? 'assets/props/door-gd001.webp' : 'assets/cutouts/prop-olddoor.webp';
  if (!door.src.endsWith(doorSrc)) { door.src = doorSrc; door.alt = lab.door === 'arker' ? '아커 현관문 GD001' : '틈이 벌어진 옛날 문'; door.classList.remove('swap'); void door.offsetWidth; door.classList.add('swap'); }
  $('#thermo-fill').style.setProperty('--t', `${temp}%`);
  if (!motionOn()) drawLab(0);
}
$$('[data-lab-door]').forEach(b => b.addEventListener('click', () => { lab.door = b.dataset.labDoor; $$('[data-lab-door]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); setLab(); }));
$$('[data-lab-season]').forEach(b => b.addEventListener('click', () => { lab.season = b.dataset.labSeason; $$('[data-lab-season]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); setLab(); }));
function sizeLab(){ const r = lab.canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); lab.canvas.width = Math.round(r.width * d); lab.canvas.height = Math.round(r.height * d); lab.w = r.width; lab.h = r.height; lab.dpr = d; if (!motionOn()) drawLab(0); }
new ResizeObserver(sizeLab).observe(lab.canvas);
function spawn(){ const s = lab.w / 600; return {x: -30 * s, y: lab.h * (.18 + Math.random() * .55), r: (14 + Math.random() * 10) * s, vx: (2.2 + Math.random() * 1.6) * s, vy: (Math.random() - .5) * .6 * s, phase: Math.random() * 6, state: 'in', alpha: 1, pass: Math.random() < .5}; }
function blob(ctx, p, t){
  const hot = lab.season === 'summer';
  ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y);
  ctx.strokeStyle = 'rgba(17,17,17,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const off = (k - 1) * p.r * .55, dir = p.vx > 0 ? -1 : 1; ctx.beginPath(); ctx.moveTo(dir * p.r * 1.2, off); ctx.quadraticCurveTo(dir * p.r * 2, off + Math.sin(t / 120 + k + p.phase) * 4, dir * p.r * 2.8, off); ctx.stroke(); }
  ctx.fillStyle = hot ? '#ff6a3d' : '#e9f7ff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let a = 0; a <= Math.PI * 2 + .01; a += Math.PI / 5) { const wob = p.r * (1 + .12 * Math.sin(a * 3 + t / 160 + p.phase)); const px = Math.cos(a) * wob, py = Math.sin(a) * wob * .8; a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111'; const ex = p.vx > 0 ? p.r * .25 : -p.r * .25;
  ctx.beginPath(); ctx.arc(ex - p.r * .2, -p.r * .12, p.r * .11, 0, 7); ctx.arc(ex + p.r * .22, -p.r * .12, p.r * .11, 0, 7); ctx.fill();
  ctx.beginPath(); if (p.state === 'bounce') ctx.arc(ex, p.r * .25, p.r * .14, 0, 7); else ctx.arc(ex, p.r * .15, p.r * .16, .1 * Math.PI, .9 * Math.PI); ctx.stroke();
  ctx.restore();
}
function drawLab(t){
  const ctx = lab.canvas.getContext('2d'); if (!lab.w) return;
  ctx.setTransform(lab.dpr, 0, 0, lab.dpr, 0, 0); ctx.clearRect(0, 0, lab.w, lab.h);
  if (!motionOn()) { const s = lab.w / 600; [[.18, .3], [.3, .55], [.12, .62]].forEach(([fx, fy], i) => blob(ctx, {x: lab.w * fx, y: lab.h * fy, r: 20 * s, vx: 1, phase: i, state: 'in', alpha: 1}, 0)); return; }
  const doorLeft = lab.w * .5 - (lab.door === 'arker' ? lab.w * .09 : lab.w * .1);
  if (lab.parts.length < 12 && t - lab.last > 420) { lab.parts.push(spawn()); lab.last = t; }
  for (const p of lab.parts) {
    p.x += p.vx; p.y += p.vy + Math.sin(t / 300 + p.phase) * .4;
    if (p.state === 'in' && p.x + p.r > doorLeft) {
      if (lab.door === 'old' && p.pass) { p.state = 'through'; p.vx *= .8; }
      else { p.state = 'bounce'; p.vx = -Math.abs(p.vx) * .7; p.vy = (Math.random() - .5) * 2; if (t - lab.popAt > 1400) { lab.popAt = t; const pop = $('#lab-pop'); pop.textContent = lab.door === 'arker' ? ['튕~!', '꽉!', '못 들어가!'][Math.floor(Math.random() * 3)] : '덜컹!'; pop.style.top = `${(p.y / lab.h * 100 - 8).toFixed(1)}%`; pop.classList.remove('show'); void pop.offsetWidth; pop.classList.add('show'); } }
    }
    if (p.state === 'bounce' || p.x > lab.w * .9) p.alpha -= .012;
    if (p.state === 'through') p.r *= .999;
  }
  lab.parts = lab.parts.filter(p => p.alpha > 0 && p.x < lab.w + 60 && p.x > -80);
  lab.parts.forEach(p => blob(ctx, p, t));
}
function loopLab(t){ drawLab(t); lab.raf = lab.visible && motionOn() && !document.hidden ? requestAnimationFrame(loopLab) : 0; }
function syncLab(){ if (lab.visible && motionOn() && !lab.raf) lab.raf = requestAnimationFrame(loopLab); if (!motionOn()) { cancelAnimationFrame(lab.raf); lab.raf = 0; lab.parts = []; drawLab(0); } }
new IntersectionObserver(([e]) => { lab.visible = e.isIntersecting; syncLab(); }, {threshold: .1}).observe(lab.stage);
motionListeners.push(syncLab);
document.addEventListener('visibilitychange', () => { syncLab(); syncTv(); if (document.hidden) $('#cinema-video').pause(); });
setLab();

/* ---------- 아커의 문 ---------- */
const models = {GD001: ['나뭇결의 여유', '목재 무늬를 따라 이어지는 차분한 표정. 벽돌이나 목재 외관과 함께 살펴보기 좋은 디자인입니다.'], GD001FD: ['작은 장식의 차이', '차분한 우드 패널에 더한 원형 장식. 익숙한 나뭇결 속 작은 포인트가 입구에 표정을 만듭니다.'], GD902: ['패턴과 수직선', '잔잔한 패턴 위로 이어지는 밝은 수직 라인. 단색 외벽과 대비되는 현관을 계획할 때 살펴보세요.'], GD200: ['입체적인 면', '중앙의 사각 패턴과 촘촘한 선의 조합. 프레임과 패널의 질감이 만드는 차이를 느껴 보세요.'], GD100: ['색과 선의 조화', '그레이와 따뜻한 색면을 수직선으로 연결한 디자인. 여러 외장재가 만나는 입구와 함께 비교해 보세요.']};
let model = 'GD001';
function placeSpot(){ const b = $(`[data-model="${model}"]`), stage = $('.door-stage'); const r = b.getBoundingClientRect(), s = stage.getBoundingClientRect(); stage.querySelector('.spotlight').style.setProperty('--spot', `${r.left - s.left + r.width / 2}px`); }
$$('[data-model]').forEach(b => { b.setAttribute('aria-label', `AHS-${b.dataset.model} ${models[b.dataset.model][0]}`); b.addEventListener('click', () => {
  model = b.dataset.model; $$('[data-model]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('#model-code').textContent = `AHS-${model}`; $('#model-title').textContent = models[model][0]; $('#model-description').textContent = models[model][1];
  const card = $('.door-card'); card.classList.remove('flash'); void card.offsetWidth; if (motionOn()) card.classList.add('flash');
  placeSpot();
}); });
addEventListener('resize', placeSpot); requestAnimationFrame(placeSpot);
$('#model-inquiry').addEventListener('click', () => { const form = $('#inquiry-form'); form.elements.product.value = `AHS-${model}`; form.elements.kind.value = 'quote'; form.dispatchEvent(new Event('change', {bubbles: true})); location.hash = '#contact'; form.elements.name.focus({preventScroll: true}); });

/* ---------- 등장인물 (대본의 실제 대사) ---------- */
const cast = [
  {name: '복순 할매', role: '시골집 안주인 · 리액션 담당', color: '#f28c28', eps: ['EP01', 'EP03', 'EP08', 'L1', 'L2'], lines: [['halmae-laugh', '바람은 밖에, 따뜻함은 안에!', 'EP10'], ['halmae-mic', '모델이니께 웃어 봐, 영감!', 'EP03'], ['halmae-teach', '복순 할매의 주문 교실! 영감, 공책 펴!', 'EP08'], ['halmae-hot', '아이고 더워라! 고무신이 다 녹겄네!', 'EP04'], ['halmae-cry', '오십 년 만에 철들었네!', 'EP09']]},
  {name: '만복 영감', role: '할매 남편 · 고집과 허당', color: '#6f8fc9', eps: ['EP02', 'EP05', 'EP09', 'L1'], lines: [['grandpa-model', '근데 나는 왜 문 옆에 세워 놨어?', 'EP03'], ['grandpa-watermelon', '그럼 나는 이제 평상에서 수박만 먹으면 되겄구먼.', 'EP04'], ['grandpa-pry', '으랏차! 어라, 꿈쩍도 안 하네?', 'EP05'], ['grandpa-laugh', '다 받아 적었다! 모양, 경첩, 색, 열쇠, 배송!', 'EP08'], ['grandpa-flower', '할멈, 결혼 오십 주년 축하혀.', 'EP09']]},
  {name: '하늘', role: '아홉 살 손녀 · 질문 담당', color: '#4fb3e8', eps: ['EP06', 'EP10'], lines: [['haneul-base', '하늘이의 왜왜왜! 오늘의 주제는 할머니네 새 문!', 'EP06'], ['haneul-ask', '첫 번째 왜! 문 이름이 왜 아커예요?', 'EP06'], ['haneul-surprise', '할아버지가 세게 닫아도 왜 쾅 안 해요?', 'EP06'], ['haneul-laugh', '마지막 장은 다 같이 사진 찍어요! 하나, 둘, 셋!', 'EP10']]},
  {name: '옥순 할매', role: '옆집 라이벌', color: '#f28ca8', eps: ['EP07', 'EP10'], lines: [['oksoon-brag', '복순아! 우리 집 문 좀 봐라, 번쩍번쩍 금색이다!', 'EP07'], ['oksoon-base', '금색 하나면 됐지, 뭘 골라?', 'EP07'], ['oksoon-surprise', '어머, 우리 휴지는 와 춤을 추노?', 'EP07'], ['oksoon-jealous', '일곱째 장은 빼라! 내가 진 날이다!', 'EP10']]},
  {name: '진우', role: '아커 직원 · 설명 담당', color: '#c58a5c', eps: ['EP01', 'L1', 'L2'], lines: [['jinwoo-base', '문을 닫으면 네 면이 꽉 눌려서, 틈으로 못 들어와요.', 'EP04'], ['jinwoo-point', '치수만 재 주시면 맞춰서 만들어요.', 'EP07'], ['jinwoo-phone', '번호키 있잖아요. 비밀번호, 이번엔 기억하시죠?', 'EP05'], ['jinwoo-laugh', '복순네 문 이야기, 금호아트도어 아커였습니다.', 'EP10']]},
];
function renderCast(){
  $('#cast-grid').replaceChildren(...cast.map((c, ci) => {
    const el = document.createElement('article'); el.className = 'cast-card reveal'; el.style.transitionDelay = `${ci * 80}ms`;
    el.innerHTML = `<button class="cast-face" style="--c:${c.color}" aria-label="${c.name} 표정과 대사 바꾸기"><span class="tap" aria-hidden="true">눌러봐!</span><img src="assets/cutouts/${c.lines[0][0]}.webp" alt="${c.name}" loading="lazy" decoding="async" height="720"></button><h3>${c.name}</h3><p class="role">${c.role}</p><p class="cast-quote" aria-live="polite"></p><div class="cast-eps" role="group" aria-label="${c.name} 출연 영상">${c.eps.map(id => `<button data-watch="${id}">${id}</button>`).join('')}</div>`;
    let i = 0;
    const show = () => { const [face, line, ep] = c.lines[i]; const img = $('img', el); img.src = `assets/cutouts/${face}.webp`; img.classList.remove('swap'); void img.offsetWidth; if (motionOn()) img.classList.add('swap'); $('.cast-quote', el).innerHTML = `“${escape(line)}” <button class="chip" data-watch="${ep}" style="font-size:11px;padding:1px 8px;font-family:Pretendard">${ep} ▶</button>`; };
    show(); $('.cast-face', el).addEventListener('click', () => { i = (i + 1) % c.lines.length; show(); });
    revealObserver.observe(el);
    return el;
  }));
  // 표정 그림 미리 받아 두기 (화면 근처일 때만)
  new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); cast.forEach(c => c.lines.slice(1).forEach(([f]) => { const i = new Image(); i.src = `assets/cutouts/${f}.webp`; })); }, {rootMargin: '300px'}).observe($('#cast-grid'));
}

/* ---------- 앨범 ---------- */
function renderAlbum(){
  const board = $('#album-board');
  const items = films.filter(f => f.format === 'short' && f.number <= 9).map(f => [f.id, `assets/props/album-${f.id.toLowerCase()}.webp`, `${label(f)} ${f.title}`]);
  items.push(['EP10', 'assets/props/album-group.webp', '다 같이 찰칵! · EP 10']);
  board.replaceChildren(...items.map(([id, src, cap], i) => {
    const b = document.createElement('button'); b.className = `polaroid ${id === 'EP10' ? 'group' : ''}`; b.dataset.watch = id;
    b.style.setProperty('--rot', `${[-6, 4, -3, 7, -5, 3, -7, 5, -2, 2][i]}deg`); b.style.setProperty('--i', i); b.style.setProperty('--fx', `${(i % 5 - 2) * 40}px`);
    b.setAttribute('aria-label', `${cap} 재생`);
    b.innerHTML = `<img src="${src}" alt="" loading="lazy" decoding="async" width="640" height="${id === 'EP10' ? 480 : 640}"><span>${escape(cap)}</span>`;
    return b;
  }));
  revealObserver.observe(board);
}

/* ---------- 재생창 ---------- */
const cinema = $('#cinema'), video = $('#cinema-video');
let current, returnFocus, lastScroll = 0, pendingSeek = 0, loadingTimer, nextTimer;
const setStatus = m => { $('#playback-status').textContent = m; };
function play(){ video.muted = muted; const p = video.play(); if (p) p.catch(() => { setStatus('재생 버튼을 눌러 시작해 주세요.'); $('#playback-retry').hidden = false; }); }
function cancelNext(){ clearInterval(nextTimer); $('#next-up').hidden = true; }
function openFilm(id, start = 0){
  const film = films.find(f => f.id === id); if (!film) return;
  cancelNext(); pauseTv(); current = film; pendingSeek = Math.min(Math.max(0, Number(start) || 0), film.seconds - .5);
  video.pause(); clearTimeout(loadingTimer); video.removeAttribute('src'); video.load();
  $('#cinema-number').textContent = `${label(film)} · ${film.topic}`; $('#cinema-title').textContent = film.title; $('#cinema-hook').textContent = film.hook;
  $('.cinema-stage').classList.toggle('portrait', film.format === 'short'); video.poster = film.poster;
  const track = $('track', video); track.src = film.captions; $('#caption-download').href = film.captions;
  $('#chapters').replaceChildren(...film.chapters.map(([t, title]) => { const b = document.createElement('button'); b.dataset.chapter = String(t); b.innerHTML = `<span>${fmt(t)}</span>${escape(title)}`; b.addEventListener('click', () => { if (video.readyState >= 1) video.currentTime = t; else pendingSeek = t; play(); }); return b; }));
  if (!cinema.open) {
    returnFocus = document.activeElement; lastScroll = scrollY; cinema.showModal();
    if (motionOn()) { cinema.classList.remove('opening'); void cinema.offsetWidth; cinema.classList.add('opening'); setTimeout(() => cinema.classList.remove('opening'), 1000); }
  }
  $('#playback-retry').hidden = true; setStatus('영상을 준비하고 있어요.'); video.src = film.video; video.load(); play();
  loadingTimer = setTimeout(() => { if (video.readyState < 2) { setStatus('불러오는 데 시간이 걸리고 있어요. 연결을 확인하거나 다시 재생해 주세요.'); $('#playback-retry').hidden = false; } }, 12000);
}
function navigateFilm(id, start = 0){ const hash = `#/watch/${id}${start ? `?t=${start}` : ''}`; if (location.hash === hash) openFilm(id, start); else location.hash = hash; }
function route(){
  const m = location.hash.match(/^#\/watch\/([A-Za-z0-9]+)(?:\?t=([\d.]+))?$/);
  if (m) { if (films.some(f => f.id === m[1])) openFilm(m[1], m[2]); else { history.replaceState(null, '', location.pathname + location.search + '#schedule'); $('#results-status').textContent = '그 영상을 찾지 못했어요. 방송표에서 골라 주세요.'; } }
  else if (cinema.open) cinema.close();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-watch]'); if (b) { e.preventDefault(); navigateFilm(b.dataset.watch, Number(b.dataset.start) || 0); } });
addEventListener('hashchange', route);
function closeFilm(){ video.pause(); if (cinema.open) cinema.close(); }
$('#cinema-close').addEventListener('click', closeFilm);
cinema.addEventListener('close', () => {
  cancelNext(); video.pause(); video.removeAttribute('src'); $('track', video).removeAttribute('src'); video.load(); clearTimeout(loadingTimer);
  if (location.hash.startsWith('#/watch/')) history.replaceState(null, '', location.pathname + location.search);
  scrollTo({top: lastScroll, behavior: 'instant'}); returnFocus?.focus({preventScroll: true});
  syncTv();
});
cinema.addEventListener('click', e => { if (e.target !== cinema) return; const r = $('.cinema-frame').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeFilm(); });
$('#cinema-doors').addEventListener('click', e => { e.preventDefault(); closeFilm(); requestAnimationFrame(() => { location.hash = '#doors'; }); });
$('#playback-retry').addEventListener('click', () => { if (video.error) openFilm(current.id, video.currentTime); else play(); });
video.addEventListener('loadedmetadata', () => { if (pendingSeek) { video.currentTime = pendingSeek; pendingSeek = 0; } });
video.addEventListener('canplay', () => { clearTimeout(loadingTimer); setStatus(''); });
video.addEventListener('playing', () => { setStatus(''); $('#playback-retry').hidden = true; cancelNext(); });
video.addEventListener('waiting', () => setStatus('불러오는 중…'));
video.addEventListener('error', () => { if (!video.getAttribute('src')) return; setStatus('영상을 불러오지 못했어요. 다시 시도해 주세요.'); $('#playback-retry').hidden = false; });
video.addEventListener('timeupdate', () => { const ch = [...(current?.chapters || [])].reverse().find(([t]) => video.currentTime >= t)?.[0]; $$('[data-chapter]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.chapter) === ch))); });
const neighbor = step => films[(films.findIndex(f => f.id === current?.id) + step + films.length) % films.length];
video.addEventListener('ended', () => {
  const index = films.findIndex(f => f.id === current?.id);
  if (!$('#autonext').checked || index === films.length - 1) { setStatus('이 이야기가 끝났어요. 다른 편도 만나 보세요.'); return; }
  const next = films[index + 1]; let n = 5;
  $('#next-title').textContent = `${label(next)} ${next.title}`; $('#next-count').textContent = n; $('#next-up').hidden = false; $('#next-now').focus();
  nextTimer = setInterval(() => { n -= 1; $('#next-count').textContent = n; if (n <= 0) { cancelNext(); navigateFilm(next.id); } }, 1000);
});
$('#next-now').addEventListener('click', () => { cancelNext(); navigateFilm(neighbor(1).id); });
$('#next-cancel').addEventListener('click', () => { cancelNext(); setStatus('이어보기를 멈췄어요.'); });
for (const [id, step] of [['previous-film', -1], ['next-film', 1]]) $(`#${id}`).addEventListener('click', () => navigateFilm(neighbor(step).id));

const privacy = $('#privacy-dialog');
for (const id of ['privacy-open', 'privacy-footer']) $(`#${id}`).addEventListener('click', () => privacy.showModal());
$('.privacy-close').addEventListener('click', () => privacy.close());

/* ---------- 데이터 불러오기 ---------- */
try {
  const res = await fetch('./films.json'); if (!res.ok) throw Error(res.status);
  films = await res.json();
  rail.replaceChildren(...films.filter(f => f.format === 'short').map(f => filmCard(f)));
  railProgress();
  $('#long-grid').replaceChildren(...films.filter(f => f.format === 'long').map(f => { const c = filmCard(f, {kind: 'long'}); c.classList.add('reveal'); revealObserver.observe(c); return c; }));
  const topics = ['all', ...new Set(films.map(f => f.topic))];
  $('#topic-filters').replaceChildren(...topics.map(t => { const b = document.createElement('button'); b.className = 'chip'; b.dataset.topic = t; b.setAttribute('aria-pressed', String(t === 'all')); b.textContent = t === 'all' ? `전체 (${films.length})` : t; b.addEventListener('click', () => { topic = t; $$('[data-topic]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderGrid(); }); return b; }));
  renderGrid(); renderCast(); renderAlbum(); route();
} catch (error) {
  rail.innerHTML = '<p class="loading">영상 목록을 불러오지 못했어요. 새로고침해 주세요.</p>';
  $('#results-status').textContent = '영상 목록 연결을 확인해 주세요.';
  console.error('films.json unavailable', error);
}
