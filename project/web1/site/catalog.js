// Product appearances are described from ARKER's original photographs.
export const catalog = {
  gd001: { name: 'AHS-GD001', title: '목재의 결을 살린 차분한 현관', description: '넓은 면을 따라 이어지는 목재 무늬가 특징입니다. 장식을 줄인 도어 패널과 프레임의 결이 어우러져, 벽돌이나 목재가 있는 외관과 함께 살펴보기 좋습니다.', detail: '목재 무늬 패널과 단정한 프레임', source: 19 },
  gd001fd: { name: 'AHS-GD001FD', title: '우드 패널에 더한 작은 장식', description: '목재 무늬 패널에 반복되는 원형 장식이 포인트입니다. 우드 톤은 유지하면서 현관문에 조금 더 뚜렷한 표정을 주고 싶을 때 비교해 보세요.', detail: '목재 무늬와 원형 장식의 조합', source: 20 },
  gd902: { name: 'AHS-GD902', title: '패턴과 수직선이 만드는 인상', description: '잔잔한 패턴 위로 밝은 수직 라인이 이어집니다. 단색 외벽과 대비되는 입구를 계획하거나, 세로 방향의 포인트가 있는 디자인을 찾을 때 살펴보세요.', detail: '패턴 패널과 밝은 수직 포인트', source: 21 },
  gd200: { name: 'AHS-GD200', title: '입체적인 면과 촘촘한 선', description: '중앙의 사각 패턴과 주변의 가는 선이 함께 보이는 디자인입니다. 그레이 계열 프레임과 패널의 질감 차이를 실제 구성 사진으로 비교할 수 있습니다.', detail: '중앙 사각 패턴과 가는 선의 대비', source: 22 },
  gd100: { name: 'AHS-GD100', title: '색면과 선으로 정리한 디자인', description: '그레이와 따뜻한 색의 패널을 나누고 밝은 수직선으로 연결했습니다. 여러 외장재가 만나는 입구에서 도어의 색과 선을 함께 맞춰 볼 수 있습니다.', detail: '색면 분할과 수직선의 조합', source: 23 }
};

export const doorViews = [
  { key: 'single', label: '싱글', suffix: '', size: 'W1000 × H2200 mm', description: '한 짝의 문으로 구성하는 기본형입니다. 현관의 유효 개구부와 문이 열리는 공간을 함께 확인하세요.' },
  { key: 'left', label: '좌소대', suffix: '-left', size: 'W1300 × H2200 mm', description: '외부에서 보았을 때 왼쪽에 보조 패널을 더한 구성입니다. 출입문 옆에 여유 폭이 있는 입구에서 검토합니다.' },
  { key: 'right', label: '우소대', suffix: '-right', size: 'W1300 × H2200 mm', description: '외부에서 보았을 때 오른쪽에 보조 패널을 더한 구성입니다. 주변 벽과 창, 동선을 기준으로 방향을 정합니다.' },
  { key: 'double', label: '양소대', suffix: '-double', size: 'W1500 × H2200 mm', description: '문 양옆에 보조 패널을 더한 구성입니다. 넓은 입구에서 문과 외벽의 균형을 비교해 보세요.' },
  { key: 'colors', label: '프레임 색상', suffix: '-colors' }
];

export function productImage(model, view) {
  return `./assets/images/${model}${view.suffix}.webp`;
}
