# 사용: fonttools[woff] 가 있는 Python 으로 실행. 페이지 글자만 남긴 woff2 서브셋을 만든다.
from pathlib import Path
import re
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT = Path(__file__).resolve().parents[1]; FONT = ROOT / 'assets/fonts'
text = ''.join((ROOT / n).read_text() for n in ['index.html', 'app.js', 'intake.js', 'films.json'])
codes = set(map(ord, text)) | set(range(32, 256)) | set(map(ord, '…“”‘’★☀❄▶▸◀←→↑↓↗·×▍'))
def save(font, target, points):
    o = subset.Options(); o.flavor = 'woff2'; o.name_IDs = ['*']
    w = subset.Subsetter(options=o); w.populate(unicodes=points); w.subset(font); font.flavor = 'woff2'; font.save(FONT / target)
    print(target, (FONT / target).stat().st_size)
save(TTFont(FONT / 'BlackHanSans-Regular.ttf'), 'BlackHanSans.woff2', codes)
save(TTFont(FONT / 'NanumPenScript-Regular.ttf'), 'NanumPenScript.woff2', codes)
for weight, target in [(400, 'PretendardRegular.woff2'), (800, 'PretendardBold.woff2')]:
    font = instantiateVariableFont(TTFont(FONT / 'Pretendard.woff2'), {'wght': weight}, inplace=True); save(font, target, codes)
