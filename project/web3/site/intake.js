const $ = (s) => document.querySelector(s);
const config = window.ARKER_CONFIG || {};
const form = $('#inquiry-form');
const status = $('#form-status');
function updateKind() {
  const quote = form.elements.kind.value === 'quote';
  $('.quote-fields').hidden = !quote;
  form.elements.region.disabled = !quote;
  form.elements.dimensions.disabled = !quote;
}
form.elements.kind.forEach((radio) => radio.addEventListener('change', updateKind));
form.addEventListener('change', updateKind);
updateKind();
const endpointValid = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.appsScriptUrl || '');
const localPreview = ['localhost','127.0.0.1'].includes(location.hostname);
const connected = !localPreview && endpointValid && config.privacyApproved === true;
$('#connection-note').textContent = connected ? '필수 항목을 입력해 주세요. 접수가 완료되면 접수번호를 안내합니다.' : '미리보기에서는 접수하지 않습니다. 실제 상담은 아커 메인 쇼룸을 이용해 주세요.';
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

