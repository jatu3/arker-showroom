export const officeLocation = Object.freeze({
  name: '아커 사업장',
  address: '경기도 화성시 효행구 비봉면 푸른들판로1125번길 35',
  source: 'https://arker.co.kr/shopinfo/company.html'
});

export function initLocation(config) {
  const frame = document.querySelector('#location-map-frame');
  if (!frame) return;
  const canvas = document.querySelector('#naver-map');
  const fallback = document.querySelector('#map-fallback');
  const status = document.querySelector('#map-status');
  const searchUrl = `https://map.naver.com/p/search/${encodeURIComponent(officeLocation.address)}`;
  document.querySelectorAll('[data-naver-location]').forEach((link) => { link.href = searchUrl; });
  document.querySelector('#copy-address').addEventListener('click', async () => {
    const message = document.querySelector('#address-copy-status');
    let timeout;
    try {
      await Promise.race([
        navigator.clipboard.writeText(officeLocation.address),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Clipboard permission timeout')), 2000); })
      ]);
      message.textContent = '주소를 복사했습니다.';
    } catch {
      const address = document.querySelector('#office-address');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(address);
      selection.removeAllRanges();
      selection.addRange(range);
      message.textContent = '주소를 선택했습니다. 길게 누르거나 복사 단축키로 복사해 주세요.';
    } finally { clearTimeout(timeout); }
  });

  const clientId = String(config.naverMapClientId || '').trim();
  if (!clientId) {
    frame.dataset.state = 'external';
    return; // No SDK request until a Maps application is configured.
  }

  function showFallback() {
    canvas.hidden = true;
    fallback.hidden = false;
    frame.dataset.state = 'error';
    frame.removeAttribute('aria-busy');
    status.textContent = '지도를 바로 표시하지 못했습니다. 네이버 지도에서 위치와 길찾기를 확인해 주세요.';
  }

  let authenticationFailed = false;
  function loadSDK() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Map SDK timeout')), 12000);
      const done = (error) => {
        clearTimeout(timer);
        if (error) reject(error); else resolve(window.naver.maps);
      };
      window.__arkerNaverMapReady = () => {
        if (window.naver?.maps?.Map) done();
        else done(new Error('Map SDK unavailable'));
      };
      window.navermap_authFailure = () => { authenticationFailed = true; showFallback(); done(new Error('Map authentication failed')); };
      const script = document.createElement('script');
      const url = new URL('https://oapi.map.naver.com/openapi/v3/maps.js');
      url.searchParams.set('ncpKeyId', clientId);
      url.searchParams.set('submodules', 'geocoder');
      url.searchParams.set('callback', '__arkerNaverMapReady');
      script.src = url.href;
      script.async = true;
      script.onerror = () => done(new Error('Map SDK request failed'));
      document.head.append(script);
    });
  }

  function findPosition(maps) {
    return new Promise((resolve, reject) => {
      const fixed = config.naverMapPosition;
      if (fixed && Number.isFinite(fixed.lat) && Number.isFinite(fixed.lng)
        && fixed.lat >= 33 && fixed.lat <= 39 && fixed.lng >= 124 && fixed.lng <= 132) {
        resolve(new maps.LatLng(fixed.lat, fixed.lng));
        return;
      }
      const timer = setTimeout(() => reject(new Error('Geocoding timeout')), 8000);
      if (!maps.Service?.geocode) {
        clearTimeout(timer);
        reject(new Error('Geocoding is not enabled'));
        return;
      }
      maps.Service.geocode({ query: officeLocation.address }, (result, response) => {
        clearTimeout(timer);
        if (result !== maps.Service.Status.OK) { reject(new Error('Geocoding failed')); return; }
        const addresses = response?.v2?.addresses || [];
        const match = addresses.find((item) => /푸른들판로1125번길35(?![\d-])/.test(String(item.roadAddress || '').replace(/\s/g, '')));
        const lat = Number(match?.y), lng = Number(match?.x);
        if (!match || !Number.isFinite(lat) || !Number.isFinite(lng)) { reject(new Error('Exact office address not found')); return; }
        resolve(new maps.LatLng(lat, lng));
      });
    });
  }

  async function renderMap() {
    frame.dataset.state = 'loading';
    frame.setAttribute('aria-busy', 'true');
    status.textContent = '네이버 지도를 불러오고 있습니다.';
    try {
      const maps = await loadSDK();
      const point = await findPosition(maps);
      if (authenticationFailed) return;
      // Give the SDK a visible, measured surface before initializing its tiles.
      canvas.hidden = false;
      const map = new maps.Map(canvas, {
        center: point, zoom: 16, zoomControl: true,
        scrollWheel: false, keyboardShortcuts: true
      });
      new maps.Marker({ position: point, map, title: officeLocation.name });
      fallback.hidden = true;
      frame.dataset.state = 'ready';
      frame.removeAttribute('aria-busy');
      status.textContent = '아커 사업장 위치입니다. 상세 이동 경로는 네이버 지도에서 확인할 수 있습니다.';
      const observer = 'ResizeObserver' in window ? new ResizeObserver(() => {
        if (canvas.clientWidth && canvas.clientHeight) {
          map.setSize(new maps.Size(canvas.clientWidth, canvas.clientHeight));
          map.setCenter(point);
        }
      }) : null;
      observer?.observe(canvas);
      window.addEventListener('pagehide', (event) => {
        if (!event.persisted) { observer?.disconnect(); map.destroy(); }
      }, { once: true });
    } catch { showFallback(); }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        renderMap();
      }
    }, { rootMargin: '250px' });
    observer.observe(frame);
  } else renderMap();
}
