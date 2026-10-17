/** ARKER 전용 쓰기 API. tjkim 시트/계정/로그인 정보를 재사용하지 않습니다.
 * Script Properties: SPREADSHEET_ID, ALLOWED_ORIGINS (쉼표 구분), PRIVACY_APPROVED=true.
 * 배포: 실행 사용자=소유자, 액세스=모든 사용자. Google Sheets는 비공개로 유지.
 */
var POLICY_VERSION = '2026-10-18-v1';
var HEADERS = ['접수번호', '요청ID', '접수일시', '상태', '이름', '연락처', '이메일', '관심제품', '설치지역', '규격', '문의내용', '동의버전', '유입경로', '담당자', '처리메모'];

function doGet() {
  // 개인정보를 읽는 공개 API는 제공하지 않습니다.
  return ContentService.createTextOutput(JSON.stringify({ service: 'ARKER intake', ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = {}, origin = '', result;
  try {
    var raw = e && e.parameter && e.parameter.payload;
    if (!raw || raw.length > 16000) throw new Error('입력 형식을 확인해 주세요.');
    data = JSON.parse(raw);
    origin = allowedOrigin_(data.returnOrigin);
    if (!origin) throw new Error('접수 가능한 사이트가 아닙니다.');
    result = saveSubmission_(data);
  } catch (error) {
    // 시트 ID, 내부 예외 또는 입력한 개인정보가 응답/로그로 노출되지 않도록 합니다.
    var message = error && error.publicMessage ? error.publicMessage : '접수를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.';
    result = { ok: false, message: message };
  }
  if (!origin) return HtmlService.createHtmlOutput('접수 가능한 사이트가 아닙니다.');
  result.type = 'arker-submission';
  result.requestId = String(data.requestId || '');
  result.nonce = String(data.nonce || '');
  var script = 'window.top.postMessage(' + safeJson_(result) + ',' + safeJson_(origin) + ');';
  return HtmlService.createHtmlOutput('<!doctype html><html><body><script>' + script + '</script></body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function allowedOrigin_(origin) {
  if (typeof origin !== 'string' || !/^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) return '';
  var origins = (PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGINS') || '').split(',').map(function(value) { return value.trim(); });
  return origins.indexOf(origin) >= 0 ? origin : '';
}
function safeJson_(value) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
function reject_(message) { var error = new Error(message); error.publicMessage = message; throw error; }
function text_(data, key, max, required) {
  var value = data[key] == null ? '' : data[key];
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) reject_('입력 항목의 길이와 형식을 확인해 주세요.');
  return value.trim();
}
function cell_(value) { return /^[\s]*[=+\-@]/.test(value) ? "'" + value : value; }
function validate_(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') reject_('입력 형식을 확인해 주세요.');
  if (data.website) reject_('입력 내용을 확인해 주세요.');
  if (data.kind !== 'quote' && data.kind !== 'contact') reject_('문의 유형을 선택해 주세요.');
  if (data.consent !== true || data.policyVersion !== POLICY_VERSION) reject_('개인정보 수집 안내를 확인하고 동의해 주세요.');
  var uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuid.test(data.requestId || '') || !uuid.test(data.nonce || '')) reject_('새로고침 후 다시 접수해 주세요.');
  var clean = {
    kind: data.kind, requestId: data.requestId, name: text_(data, 'name', 50, true),
    phone: text_(data, 'phone', 30, true), email: text_(data, 'email', 120, false),
    product: text_(data, 'product', 100, false), region: text_(data, 'region', 100, false),
    dimensions: text_(data, 'dimensions', 100, false), message: text_(data, 'message', 3000, true),
    page: text_(data, 'page', 200, false)
  };
  if (!/^[0-9+() .\-]{8,30}$/.test(clean.phone) || clean.phone.replace(/\D/g, '').length < 8) reject_('연락처를 확인해 주세요.');
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) reject_('이메일 주소를 확인해 주세요.');
  if (clean.message.length < 5) reject_('문의 내용을 5자 이상 입력해 주세요.');
  if (clean.kind === 'contact') { clean.region = ''; clean.dimensions = ''; }
  return clean;
}
function saveSubmission_(data) {
  var properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('PRIVACY_APPROVED') !== 'true') reject_('현재 접수 준비 중입니다.');
  var clean = validate_(data);
  var id = properties.getProperty('SPREADSHEET_ID');
  if (!id) reject_('현재 접수 준비 중입니다.');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) reject_('접수가 몰리고 있습니다. 잠시 후 다시 시도해 주세요.');
  try {
    var book = SpreadsheetApp.openById(id);
    var name = clean.kind === 'quote' ? 'ARKER_견적요청' : 'ARKER_고객문의';
    var sheet = book.getSheetByName(name);
    if (!sheet) { sheet = book.insertSheet(name); sheet.appendRow(HEADERS); sheet.setFrozenRows(1); }
    // 잘못된 탭에 개인정보가 기록되지 않도록 헤더 계약을 검증합니다.
    var headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (headers.join('|') !== HEADERS.join('|')) reject_('접수 설정을 확인 중입니다. 잠시 후 다시 시도해 주세요.');
    var count = sheet.getLastRow();
    if (count > 1) {
      var existing = sheet.getRange(2, 2, count - 1, 1).createTextFinder(clean.requestId).matchEntireCell(true).findNext();
      if (existing) return { ok: true, receiptId: String(sheet.getRange(existing.getRow(), 1).getValue()), duplicate: true };
    }
    // 기본적인 전체 폭주 제한입니다. Origin/허니팟은 인증이나 완전한 봇 차단이 아닙니다.
    var cache = CacheService.getScriptCache();
    var minute = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHHmm');
    var key = 'intake-' + minute;
    var used = Number(cache.get(key) || 0);
    if (used >= 30) reject_('접수가 몰리고 있습니다. 잠시 후 다시 시도해 주세요.');
    var receipt = 'ARK-' + Utilities.getUuid();
    sheet.appendRow([receipt, clean.requestId, Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'), '신규', clean.name, clean.phone, clean.email, clean.product, clean.region, clean.dimensions, clean.message, POLICY_VERSION, clean.page, '', ''].map(cell_));
    SpreadsheetApp.flush();
    cache.put(key, String(used + 1), 120);
    return { ok: true, receiptId: receipt, duplicate: false };
  } finally { lock.releaseLock(); }
}
