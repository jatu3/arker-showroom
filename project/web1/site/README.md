# ARKER 정적 쇼룸 실행과 운영 연결

정적 HTML/CSS/JS 디자인 시안과 Google Sheets 접수용 Apps Script. 의존성 설치가 필요 없다.

```bash
cd /Users/jatu/app/ark/project/web1/site
npm run dev
# http://127.0.0.1:5191
npm run check
npm run build
```

`dist/`에는 화면 파일과 자산만 들어간다. Apps Script 소스, 테스트, 문서, Aside 세션은 배포물에 포함하지 않는다. 원본 사이트를 수집한 `../main.html`과 구분하여 이 폴더의 `index.html`을 실행한다.

폰트는 현재 화면과 접수 메시지의 글자를 담은 서브셋을 사용한다. 텍스트 변경 후 필요하면 `fonttools[woff]`가 설치된 별도 Python 환경에서 `python3 scripts/subset-fonts.py`를 실행한다. 일반 실행·검사·빌드에는 Python 폰트 도구 설치가 필요 없다. 서브셋에 없는 사용자 입력 글자는 시스템 폰트로 표시된다. 원본 폰트와 이미지도 재제작용으로 보관하며 배포 빌드에서는 제외한다.

## 화면

- 최신 Stitch 코럴·청록 시안, 대형 영문 타이포와 한글 메시지, 실제 G-DOOR 제품 이미지.
- 버튼 터치 파동, 눌림·화살표 피드백, 이미지 확대, 상세 창·아코디언·메뉴 전환 애니메이션.
- 제품 상세 모달, 선택 모델을 반영하는 문의 동선.
- 견적/고객문의 유형 전환, 브라우저 유효성 검사, 접수 상태 표시.
- 모바일 메뉴, 시스템·수동 테마, 키보드 모달, 동작 감소 설정.
- 기본 설정에서는 전송하지 않으며 시안 안내를 표시한다.

## Google Sheets 연결

1. ARKER용 Google Sheets를 새로 만든다. 웹에 게시하거나 전체 공개하지 않는다. 담당자에게만 권한을 준다.
2. 별도 Apps Script 프로젝트에 `apps-script/Code.gs`를 붙여 넣는다. 프로젝트 설정에서 매니페스트를 표시하고 `appsscript.json`을 반영한다.
3. 스크립트 속성에 아래 값을 넣는다.

| 속성 | 값 |
|---|---|
| `SPREADSHEET_ID` | 새 ARKER 시트 ID |
| `ALLOWED_ORIGINS` | 실제 Pages origin. 예: `https://사용자.github.io` (저장소 경로와 마지막 `/` 제외) |
| `PRIVACY_APPROVED` | 수집 정책 확정 후 `true` |

로컬 통합 검증 시에만 `http://127.0.0.1:5191`을 쉼표로 추가할 수 있다. 운영 후 제거한다. 실제 사용자 입력의 origin 검사는 인증 수단이 아니므로 공개 웹 앱에 관리자 기능을 추가하지 않는다.

4. 배포 → 새 배포 → 웹 앱. 실행 사용자는 소유자, 액세스는 모든 사용자로 선택하고 소유자가 Sheets 접근을 승인한다. Workspace 정책에서 익명 웹 앱을 금지하는 경우 해당 정책에 맞는 별도 접수 환경이 필요하다.
5. 배포된 `/exec` URL을 `config.js`의 `appsScriptUrl`에 넣는다. 개발용 `/dev` URL을 사용하지 않는다.
6. 운영자의 실제 보유 기간과 개인정보 문의 담당자를 `retentionText`, `privacyContact`에 넣고 `privacyApproved: true`로 변경한다. 서버 `POLICY_VERSION`과 프런트 `policyVersion`은 동일한 버전으로 유지한다.
7. 합성 테스트 정보로 견적·고객문의 각각 한 건을 전송한다. `ARKER_견적요청`, `ARKER_고객문의` 탭이 자동 생성되고 접수번호가 화면과 일치하는지 확인한다. 검증 후 테스트 행을 지운다.

스크립트 코드 변경 후에는 웹 앱의 새 버전을 배포해야 한다. 속성만 변경할 때와 구분한다. 실제 Google 왕복은 아직 검증하지 않았다.

## 접수 확인과 재시도

표준 폼 POST를 iframe으로 보내고 Apps Script의 저장 확인 `postMessage`를 기다린다. Google HtmlService의 중첩 iframe 때문에 응답 origin과 일회용 nonce, 요청 ID를 확인한다. `iframe.onload`나 opaque fetch 응답으로 접수 완료를 판정하지 않는다.

60초 동안 응답을 받지 못하면 저장 여부 미확정 안내와 입력 내용을 유지한다. 같은 화면에서 수정 없이 재시도하면 같은 요청 ID를 사용해 중복 저장을 막는다. 새로고침하거나 내용을 변경하면 새 요청이 된다. 이 경우 담당자는 이름·연락처·접수시간으로 중복 여부를 확인한다.

클라이언트 초안은 메모리에만 있으며 페이지를 닫으면 사라진다. 공개 API에서 문의 내역을 읽거나 변경할 수 없다. 담당자는 Google Sheets에서 상태·담당자·처리메모를 관리한다.

헤더 이름·순서를 바꾸면 기록이 중단되도록 되어 있다. 추가 업무 열이 필요하면 별도 탭을 만들거나 코드와 헤더를 함께 변경한다. 허니팟과 분당 30건 전체 제한은 기본적인 억제 수단이며, 대량 스팸 방지가 필요하면 별도의 서버 검증 장치를 추가한다.

## GitHub Pages

저장소 루트의 `.github/workflows/pages.yml`이 `project/web1/site`를 검사·빌드하여 `dist`를 배포한다. 저장소 Settings → Pages → Source를 GitHub Actions로 선택한다. 현재 폴더에는 Git 저장소나 remote가 연결되어 있지 않아 배포는 실행하지 않았다.

실제 사이트는 상대 경로를 사용하므로 `/저장소명/` 아래에서 동작한다. `.nojekyll`도 포함된다. 도메인 확정 후 절대 OG 이미지 URL, canonical, 사이트맵, 사업자 정보는 후속 설정한다. 별도 Sites 호스팅은 사용하지 않는다.

## 검증 범위

`npm run check`는 JS 구문과 Apps Script의 시트 분리·검증·수식 주입 처리·중복 방지·개인정보 응답 제외·제한 동작을 테스트한다. Apps Script API는 테스트 대역이므로 실제 Google 권한/리디렉션/iframe 응답 검증을 대체하지 않는다.

브라우저 검수와 실측 결과는 [검수 기록](../검수/README.md)에 저장한다. 미디어 생성은 [별도 제작 절차](../media/README.md)를 따른다.
