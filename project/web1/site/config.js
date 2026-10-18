// 공개 설정만 둡니다. Google 계정, 시트 ID, Aside 프로필/세션은 포함하지 않습니다.
window.ARKER_CONFIG = Object.freeze({
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyQg5U6psQTD7XdFQEUcaqarykLwmWLAJFcuOnc-LcbNyUstHHZJpzwVAKlHejLTR2Qpg/exec", // 배포된 https://script.google.com/macros/s/.../exec
  privacyApproved: true, // 운영자의 실제 수집 정책 확인 후 true
  retentionText: "상담 종료 후 1년간 보관합니다.",
  privacyContact: "개인정보 관련 문의는 이 페이지의 고객 문의 양식에서 접수할 수 있습니다.",
  naverMapClientId: "", // NAVER Cloud Maps의 공개 Client ID(ncpKeyId). Client Secret은 넣지 않습니다.
  naverMapPosition: null, // 확인된 { lat, lng }가 없으면 Geocoding으로 공개 주소를 검색합니다.
});
