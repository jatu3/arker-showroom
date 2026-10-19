import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const films = JSON.parse(read('films.json'));
const probe = file => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path.join(root, file)]));

test('쇼츠 10편과 긴 이야기 2편이 모두 있다', () => {
  assert.equal(films.length, 12);
  assert.equal(new Set(films.map(f => f.id)).size, 12);
  assert.equal(films.filter(f => f.format === 'short').length, 10);
  assert.equal(films.filter(f => f.format === 'long').length, 2);
});

test('원본 영상은 비율·길이가 맞고 한글 자막이 붙어 있다', () => {
  for (const f of films) {
    for (const key of ['video', 'poster', 'captions']) assert.ok(fs.existsSync(path.join(root, f[key])), f[key]);
    const meta = probe(f.video), v = meta.streams.find(s => s.codec_type === 'video');
    assert.equal(v.width, f.format === 'short' ? 1080 : 1920);
    assert.equal(v.height, f.format === 'short' ? 1920 : 1080);
    assert.ok(Math.abs(Number(meta.format.duration) - f.seconds) < .11);
    assert.ok(read(f.captions).startsWith('WEBVTT\n'));
    for (const [at] of f.chapters) assert.ok(at >= 0 && at < f.seconds);
  }
});

test('미리보기 영상은 소리 없는 짧은 파생본이다', () => {
  for (const f of films) {
    const file = `assets/previews/${f.id}.mp4`;
    assert.ok(fs.existsSync(path.join(root, file)), file);
    const meta = probe(file);
    assert.ok(!meta.streams.some(s => s.codec_type === 'audio'), `${file} has audio`);
    assert.ok(Number(meta.format.duration) <= 8.2);
    assert.ok(fs.statSync(path.join(root, file)).size < 300_000);
  }
});

test('페이지가 참조하는 그림 파일이 모두 있다', () => {
  const text = read('index.html') + read('app.js') + read('styles.css');
  const refs = new Set([...text.matchAll(/assets\/(?:cutouts|props|posters|characters|products)\/[\w-]+\.webp/g)].map(m => m[0]));
  for (const m of text.matchAll(/\['((?:halmae|grandpa|haneul|oksoon|jinwoo)-[a-z]+)'/g)) refs.add(`assets/cutouts/${m[1]}.webp`);
  for (const m of text.matchAll(/'(halmae-[a-z]+)', '/g)) refs.add(`assets/cutouts/${m[1]}.webp`);
  for (const f of films.filter(f => f.format === 'short' && f.number <= 9)) refs.add(`assets/props/album-${f.id.toLowerCase()}.webp`);
  assert.ok(refs.size > 30);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), ref);
});

test('자동 소리 재생과 외부 스크립트가 없고 접수 검증이 유지된다', () => {
  const html = read('index.html');
  assert.ok(!/<video[^>]*autoplay/i.test(html));
  assert.ok(!/<script[^>]*src="https?:/i.test(html));
  assert.ok(/id="tv-video" src="assets\/videos\/L1\.mp4"[^>]*controls/.test(html), 'TV는 본편을 컨트롤과 함께 바로 재생');
  assert.ok(!/class="tv-play"/.test(html), '가운데 재생 버튼 없음');
  assert.ok(/id="sound-toggle"/.test(html), '상단 소리 버튼');
  const js = read('intake.js');
  assert.ok(js.includes('data.nonce !== pending.nonce'));
  assert.ok(js.includes('!localPreview'));
});
