"""선택적 자산 제작 도구. fonttools[woff]가 설치된 로컬 환경에서 실행.
콘텐츠 수정 후 실행하면 화면과 접수 메시지의 글리프를 새로 포함한다.
"""
from pathlib import Path
from fontTools import subset
ROOT = Path(__file__).resolve().parents[1]
font_dir = ROOT / 'assets/fonts'
text = ''.join((ROOT / name).read_text() for name in ['index.html', 'app.js', 'catalog.js', 'config.js', 'apps-script/Code.gs'])
codes = set(map(ord, text)) | set(range(32, 256))
for source, target in [('PretendardVariable.woff2', 'PretendardUI.woff2'), ('SpaceGrotesk.ttf', 'SpaceGrotesk.woff2')]:
    options = subset.Options()
    options.flavor = 'woff2'
    options.name_IDs = ['*']
    font = subset.load_font(str(font_dir / source), options)
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=codes)
    worker.subset(font)
    subset.save_font(font, str(font_dir / target), options)
print('Subset fonts written. Keep upstream font files and licenses for regeneration.')
