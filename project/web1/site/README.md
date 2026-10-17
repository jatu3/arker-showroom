# ARKER 정적 쇼룸

사이트: https://jatu3.github.io/arker-showroom/

네이티브 HTML·CSS·JavaScript로 구성된 정적 사이트다. 폰트와 이미지는 로컬 자산을 사용한다.

```sh
npm run dev
npm run check
npm run build
```

GitHub Actions가 검사·빌드한 `dist`를 Pages에 배포한다. Google Sheets 접수 API는 `apps-script` 소스를 별도로 배포하며 정적 산출물에는 포함하지 않는다.

`config.js`에는 공개 웹 앱 주소와 개인정보 안내만 둔다. `SPREADSHEET_ID`, `ALLOWED_ORIGINS`, `PRIVACY_APPROVED`는 Apps Script의 스크립트 속성으로 설정한다. 소유자가 `initializeArker`를 실행하면 운영 안내와 접수 탭을 준비할 수 있다. Apps Script 코드를 수정하면 웹 앱 배포도 새 버전으로 갱신해야 한다.

견적과 고객 문의는 별도 탭에 기록한다. 접수 완료는 Google의 저장 확인 응답과 요청 ID·일회용 nonce가 일치할 때 표시한다. 문의 내역을 읽는 공개 API는 제공하지 않는다.

상담 정보는 상담 종료 후 1년 보관한다. 담당자가 종료일을 기록하고 보유 기간이 지난 정보와 별도 사본을 정리한다. 자동 삭제 기능은 포함하지 않는다.
