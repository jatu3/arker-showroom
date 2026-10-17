import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');

function setup() {
  const sheets = new Map();
  const cache = new Map();
  const properties = { SPREADSHEET_ID: 'private-test-sheet', PRIVACY_APPROVED: 'true', ALLOWED_ORIGINS: 'https://example.github.io' };
  let releases = 0;
  function makeSheet() {
    return { rows: [], appendRow(row) { this.rows.push([...row]); }, setFrozenRows() {}, getLastRow() { return this.rows.length; },
      getRange(row, col, height = 1, width = 1) {
        const sheet = this;
        return { getValues() { return sheet.rows.slice(row - 1, row - 1 + height).map((r) => r.slice(col - 1, col - 1 + width)); },
          getValue() { return sheet.rows[row - 1][col - 1]; }, createTextFinder(needle) { return { matchEntireCell() { return this; }, findNext() {
            const index = sheet.rows.findIndex((r, i) => i >= row - 1 && i < row - 1 + height && r[col - 1] === needle);
            return index < 0 ? null : { getRow: () => index + 1 };
          } }; }
        };
      }
    };
  }
  const book = { getSheetByName: (name) => sheets.get(name), insertSheet(name) { const sheet = makeSheet(); sheets.set(name, sheet); return sheet; } };
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties[key] }) },
    SpreadsheetApp: { openById: () => book, flush() {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() { releases++; } }) },
    CacheService: { getScriptCache: () => ({ get: (key) => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    Utilities: { getUuid: randomUUID, formatDate: (_date, zone) => zone === 'UTC' ? '202610171430' : '2026-10-17 23:30:00' },
    HtmlService: { XFrameOptionsMode: { ALLOWALL: 'all' }, createHtmlOutput: (html) => ({ html, setXFrameOptionsMode() { return this; } }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (text) => ({ text, setMimeType() { return this; } }) }
  });
  vm.runInContext(source, context);
  return { context, sheets, cache, properties, releases: () => releases };
}
const submission = (patch = {}) => ({ kind: 'quote', requestId: randomUUID(), nonce: randomUUID(), returnOrigin: 'https://example.github.io', name: '검수 담당자', phone: '010-0000-0000', email: '', product: 'AHS-GD001', region: '화성시', dimensions: '', message: '시스템 현관문 견적을 문의합니다.', consent: true, policyVersion: '2026-10-18-v1', page: '/ark/', website: '', ...patch });

test('견적과 고객문의는 별도 탭에 저장하고 접수번호를 반환한다', () => {
  const { context, sheets, releases } = setup();
  const first = context.saveSubmission_(submission());
  assert.match(first.receiptId, /^ARK-/);
  context.saveSubmission_(submission({ kind: 'contact' }));
  assert.equal(sheets.get('ARKER_견적요청').rows.length, 2);
  assert.equal(sheets.get('ARKER_고객문의').rows.length, 2);
  assert.equal(sheets.get('ARKER_고객문의').rows[1][8], '');
  assert.equal(releases(), 2);
});
test('응답 유실 후 같은 요청을 재전송해도 중복 저장하지 않는다', () => {
  const { context, sheets } = setup(); const input = submission();
  const first = context.saveSubmission_(input); const second = context.saveSubmission_(input);
  assert.equal(second.receiptId, first.receiptId); assert.equal(second.duplicate, true);
  assert.equal(sheets.get('ARKER_견적요청').rows.length, 2);
});
test('동의, 연락처, 내용 및 허니팟을 서버에서 검증한다', () => {
  const { context, sheets } = setup();
  for (const patch of [{ consent: false }, { phone: 'abc' }, { message: '짧음' }, { website: 'spam' }, { kind: 'admin' }, { name: { nested: true } }, { policyVersion: 'old' }]) assert.throws(() => context.saveSubmission_(submission(patch)));
  assert.equal(sheets.size, 0);
});
test('셀 수식 주입 문자를 텍스트로 저장한다', () => {
  const { context, sheets } = setup();
  context.saveSubmission_(submission({ name: '=IMPORTXML("https://invalid", "x")', message: '  +SUM(1,2)' }));
  const row = sheets.get('ARKER_견적요청').rows[1];
  assert.ok(row[4].startsWith("'=")); assert.ok(row[10].startsWith("'+"));
});
test('허용하지 않은 출처에서는 기록하지 않는다', () => {
  const { context, sheets } = setup();
  context.doPost({ parameter: { payload: JSON.stringify(submission({ returnOrigin: 'https://example.github.io.attacker.test' })) } });
  assert.equal(sheets.size, 0);
});
test('프라이버시 설정 전에는 저장하지 않는다', () => {
  const { context, properties, sheets } = setup(); properties.PRIVACY_APPROVED = 'false';
  assert.throws(() => context.saveSubmission_(submission())); assert.equal(sheets.size, 0);
});
test('기존 탭의 헤더가 바뀌면 저장을 멈추고 잠금을 반환한다', () => {
  const { context, sheets, releases } = setup(); context.saveSubmission_(submission());
  sheets.get('ARKER_견적요청').rows[0][4] = '다른열';
  assert.throws(() => context.saveSubmission_(submission())); assert.equal(releases(), 2);
});
test('쓰기 완료 응답에 이름과 연락처를 포함하지 않는다', () => {
  const { context } = setup(); const input = submission();
  const response = context.doPost({ parameter: { payload: JSON.stringify(input) } });
  assert.match(response.html, /window.top.postMessage/); assert.match(response.html, /"ok":true/);
  assert.ok(!response.html.includes(input.name)); assert.ok(!response.html.includes(input.phone));
  assert.ok(response.html.includes(input.nonce));
});
test('JSON에 스크립트 종료 문자열이 있어도 실행 코드로 해석하지 않는다', () => {
  const { context } = setup(); assert.equal(context.safeJson_('</script>'), '"\\u003c/script\\u003e"');
});
test('분당 제한 초과 요청을 쓰지 않으며 재전송 응답은 유지한다', () => {
  const { context, sheets, cache } = setup(); const input = submission();
  context.saveSubmission_(input); cache.set('intake-202610171430', '30');
  assert.throws(() => context.saveSubmission_(submission()));
  assert.equal(context.saveSubmission_(input).ok, true); assert.equal(sheets.get('ARKER_견적요청').rows.length, 2);
});
