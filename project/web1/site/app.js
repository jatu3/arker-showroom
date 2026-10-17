const config = window.ARKER_CONFIG || {};
const $ = (selector) => document.querySelector(selector);
const products = { gd001: 'AHS-GD001', gd001fd: 'AHS-GD001FD', gd902: 'AHS-GD902', gd200: 'AHS-GD200', gd100: 'AHS-GD100' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const menu = $('.menu-toggle');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? '닫기' : '메뉴';
  $('#navigation').classList.toggle('open', open);
});
function closeMenu() { menu.textContent = '메뉴'; menu.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('open'); }
$('#navigation').addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
try { const theme = localStorage.getItem('arker-theme'); if (['dark', 'light'].includes(theme)) document.documentElement.dataset.theme = theme; } catch {}
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
function syncThemeLabel() {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : systemTheme.matches;
  $('.theme-toggle').setAttribute('aria-label', dark ? '밝은 테마로 변경' : '어두운 테마로 변경');
}
syncThemeLabel();
systemTheme.addEventListener('change', syncThemeLabel);
$('.theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  syncThemeLabel();
  try { localStorage.setItem('arker-theme', theme); } catch {}
});
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.documentElement.classList.add('js-reveal');
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
let selectedProduct = '';
document.querySelectorAll('[data-product]').forEach((button) => button.addEventListener('click', () => {
  selectedProduct = products[button.dataset.product];
  $('#dialog-title').textContent = selectedProduct;
  $('#dialog-image').src = `./assets/images/${button.dataset.product}.webp`;
  $('#dialog-image').alt = `${selectedProduct} 제품 정면`;
  $('#product-dialog').showModal();
}));
async function closeDialog(dialog) {
  if (dialog.classList.contains('is-closing')) return;
  if (!reduceMotion.matches) {
    dialog.classList.add('is-closing');
    await Promise.allSettled(dialog.getAnimations().map((animation) => animation.finished));
    dialog.classList.remove('is-closing');
  }
  dialog.close();
}
document.querySelectorAll('.dialog-close').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(dialog); }));
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog(dialog);
}));
function startInquiry(product) {
  $('#inquiry-form [name=product]').value = product;
  $('#inquiry-form [name=kind][value=quote]').checked = true;
  updateKind();
  $('#contact').scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  $('#inquiry-form [name=name]').focus({ preventScroll: true });
}
$('#product-inquiry').addEventListener('click', async () => { await closeDialog($('#product-dialog')); startInquiry(selectedProduct); });
document.querySelectorAll('[data-inquiry]').forEach((button) => button.addEventListener('click', () => startInquiry(button.dataset.inquiry)));
document.querySelectorAll('#privacy-open, .privacy-trigger').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); $('#privacy-dialog').showModal(); }));
$('#retention-text').textContent = config.retentionText || '운영 전 보유 기간을 확정해야 합니다.';
$('#privacy-contact').textContent = config.privacyContact || '';
const form = $('#inquiry-form');
const status = $('#form-status');
function updateKind() {
  const quote = form.elements.kind.value === 'quote';
  $('.quote-fields').hidden = !quote;
  form.elements.region.disabled = !quote;
  form.elements.dimensions.disabled = !quote;
}
form.elements.kind.forEach((radio) => radio.addEventListener('change', updateKind));
const endpointValid = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.appsScriptUrl || '');
const connected = endpointValid && config.privacyApproved === true;
$('#connection-note').textContent = connected ? '필수 항목을 입력해 주세요. 접수가 완료되면 접수번호를 안내합니다.' : '디자인 시안입니다. 온라인 접수 연결 준비 중이며, 입력 내용은 전송되지 않습니다.';
let pending = null;
let draftId = crypto.randomUUID();
form.addEventListener('input', () => { if (!pending) draftId = crypto.randomUUID(); });
function finish(message, success = false) {
  if (!pending) return;
  clearTimeout(pending.timer);
  pending.frame.remove();
  pending = null;
  form.querySelector('button[type=submit]').disabled = false;
  form.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = false; });
  updateKind();
  form.removeAttribute('aria-busy');
  form.querySelector('button[type=submit] span').textContent = '상담 요청 보내기';
  status.textContent = message;
  if (success) { form.reset(); updateKind(); draftId = crypto.randomUUID(); }
  status.focus();
}
window.addEventListener('message', (event) => {
  // HtmlService는 Google의 중첩 iframe에서 실행되므로 source가 최상위 iframe과 다릅니다.
  // 고정된 Google origin + 일회용 nonce + 요청 ID 세 가지가 모두 맞아야 응답을 채택합니다.
  const trusted = event.origin === 'https://script.google.com' || /^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/.test(event.origin) || event.origin === 'https://script.googleusercontent.com';
  const data = event.data;
  if (!pending || !trusted || !data || data.type !== 'arker-submission' || data.nonce !== pending.nonce || data.requestId !== pending.requestId) return;
  if (data.ok === true && /^ARK-[a-f0-9-]{36}$/i.test(data.receiptId || '')) finish(`접수되었습니다. 접수번호 ${data.receiptId}. 담당자가 내용을 확인한 후 연락드리겠습니다.`, true);
  else finish(data.message || '접수를 확인하지 못했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.');
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (pending) return;
  if (!connected) { status.textContent = '아직 접수 연결 전입니다. 입력 내용은 전송하거나 저장하지 않았습니다.'; status.focus(); return; }
  if (!form.reportValidity()) return;
  const fields = Object.fromEntries(new FormData(form));
  const requestId = draftId;
  const nonce = crypto.randomUUID();
  const frame = document.createElement('iframe');
  frame.name = `arker-${nonce}`;
  frame.title = '상담 접수 응답';
  frame.hidden = true;
  document.body.append(frame);
  const transport = document.createElement('form');
  transport.method = 'POST'; transport.action = config.appsScriptUrl; transport.target = frame.name; transport.hidden = true;
  const payload = { ...fields, consent: fields.consent === 'on', policyVersion: '2026-10-18-v1', requestId, nonce, returnOrigin: location.origin, page: location.pathname };
  const input = document.createElement('input'); input.name = 'payload'; input.value = JSON.stringify(payload); transport.append(input); document.body.append(transport);
  pending = { nonce, requestId, frame, timer: setTimeout(() => finish('접수 확인 응답이 지연되고 있습니다. 입력 내용은 유지했습니다. 그대로 다시 보내면 같은 요청 번호로 중복 접수를 방지합니다.'), 60000) };
  status.textContent = '요청을 전송하고 저장 확인을 기다리고 있습니다…';
  form.setAttribute('aria-busy', 'true');
  form.querySelector('button[type=submit]').disabled = true;
  form.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = true; });
  form.querySelector('button[type=submit] span').textContent = '접수 확인 중…';
  transport.submit(); transport.remove();
});

// One short wave at the touch point; no continuous pointer or scroll listeners.
document.querySelectorAll('button, .button, .text-link, .nav-cta').forEach((control) => {
  control.classList.add('interactive');
  control.addEventListener('pointerdown', (event) => {
    if (reduceMotion.matches || control.disabled) return;
    const rect = control.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = 'tap-wave';
    wave.setAttribute('aria-hidden', 'true');
    wave.style.setProperty('--wave-size', `${Math.hypot(rect.width, rect.height) * 2}px`);
    wave.style.setProperty('--wave-x', `${event.clientX - rect.left}px`);
    wave.style.setProperty('--wave-y', `${event.clientY - rect.top}px`);
    control.append(wave);
    wave.addEventListener('animationend', () => wave.remove(), { once: true });
    setTimeout(() => wave.remove(), 700);
  });
});
