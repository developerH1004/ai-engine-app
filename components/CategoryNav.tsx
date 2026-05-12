'use client'
const CATEGORIES: Record<string, string[]> = {
  '01. 파운데이션 모델': ['01-01. 범용 언어 모델','01-02. 소형 언어 모델','01-03. 멀티모달 통합 지능','01-04. 논리 추론 특화','01-05. 기업 특화 파인튜닝 모델'],
  '02. 검색 및 지식 탐구': ['02-01. 대화형 AI 검색','02-02. 학술 및 논문 리서치','02-03. 사실 검증 및 데이터 팩트체크','02-04. 기업용 지능형 검색','02-05. 특허 및 규제 분석','02-06. AI 브라우저 및 웹 에이전트'],
  '03. 비주얼 아트 및 디자인': ['03-01. 예술적 이미지 생성','03-02. 이미지 편집 및 리터칭','03-03. 브랜드 및 로고 디자인','03-04. UI/UX 및 웹 레이아웃','03-05. 3D 모델링 및 에셋 생성','03-06. 건축 및 공간/인테리어 디자인','03-07. 캐릭터 및 게임 아트 디자인'],
  '04. 영상 및 모션 그래픽': ['04-01. 텍스트-투-비디오','04-02. AI 아바타 및 가상 휴먼','04-03. 영상 번역 및 더빙','04-04. 자동 영상 편집','04-05. VFX 및 특수효과','04-06. 실시간 영상 향상','04-07. 애니메이션 및 모션 캡처'],
  '05. 오디오 및 음악': ['05-01. 음성 합성 및 TTS','05-02. 음성 변환 및 클로닝','05-03. AI 작곡 및 배경음악','05-04. 효과음 생성','05-05. 오디오 포스트 프로덕션'],
  '06. 개발 및 코딩': ['06-01. AI 코딩 어시스턴트','06-02. 코드 리뷰 및 보안 취약점 분석','06-03. 노코드/로우코드 빌더','06-04. 데이터베이스 설계 및 쿼리 최적화','06-05. 문서화 및 API 관리'],
  '07. 에이전트 및 자동화': ['07-01. 자율 행동 에이전트','07-02. 워크플로우 통합 자동화','07-03. 고객 서비스 에이전트','07-04. 개인용 업무 비서','07-05. AI 안전·정렬·레드팀'],
  '08. 비즈니스 및 사무 생산성': ['08-01. 회의 기록 및 요약','08-02. 문서 생성 및 편집','08-03. 데이터 시각화 및 차트 생성','08-04. 프레젠테이션 자동 제작','08-05. 문서 처리 및 OCR'],
  '09. 마케팅 및 콘텐츠 제작': ['09-01. 카피라이팅 및 광고 문구','09-02. 이커머스 마케팅 에셋','09-03. SNS 관리 및 성과 분석','09-04. SEO 최적화 전략','09-05. AI 인플루언서 및 버추얼 크리에이터'],
  '10. 교육 및 학술': ['10-01. 개인 맞춤형 튜터링','10-02. 외국어 학습 및 대화','10-03. 자동 채점 및 피드백','10-04. 학술적 글쓰기 어시스턴트'],
  '11. 전문 산업군': ['11-01. 의료 및 바이오','11-02. 법률 및 컴플라이언스','11-03. 금융 및 핀테크','11-04. 부동산 및 건축','11-05. 유통 및 물류','11-06. 농업 및 스마트팜','11-07. 에너지 및 기후 테크'],
  '12. 하드웨어 및 로보틱스': ['12-01. 휴머노이드 및 범용 로봇','12-02. 산업용 협동 로봇','12-03. 자율주행 및 모빌리티','12-04. 스마트 센서 및 웨어러블'],
  '13. 인프라 및 보안': ['13-01. AI 반도체 및 가속기','13-02. MLOps 및 모델 서빙 플랫폼','13-03. 사이버 보안 및 위협 탐지','13-04. 소버린 AI 및 프라이빗 클라우드'],
}
const ICONS: Record<string, string> = {
  '01. 파운데이션 모델':'🧠','02. 검색 및 지식 탐구':'🔍','03. 비주얼 아트 및 디자인':'🎨',
  '04. 영상 및 모션 그래픽':'🎬','05. 오디오 및 음악':'🎵','06. 개발 및 코딩':'💻',
  '07. 에이전트 및 자동화':'🤖','08. 비즈니스 및 사무 생산성':'📊','09. 마케팅 및 콘텐츠 제작':'📣',
  '10. 교육 및 학술':'📚','11. 전문 산업군':'🏭','12. 하드웨어 및 로보틱스':'⚙️','13. 인프라 및 보안':'🔒',
}
export default function CategoryNav({ selectedMain, selectedSub, onSelect }: {
  selectedMain: string; selectedSub: string; onSelect: (m: string, s: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSelect('','')} className={`badge text-xs cursor-pointer ${!selectedMain ? 'badge-green' : 'badge-gray'}`}>전체</button>
        {Object.keys(CATEGORIES).map(main => (
          <button key={main} onClick={() => onSelect(main,'')} className={`badge text-xs cursor-pointer ${selectedMain===main ? 'badge-green' : 'badge-gray'}`}>
            {ICONS[main]} {main.replace(/^\d+\.\s/,'')}
          </button>
        ))}
      </div>
      {selectedMain && CATEGORIES[selectedMain] && (
        <div className="flex flex-wrap gap-2 pl-2 border-l-2 fade-in" style={{borderColor:'var(--accent-dim)'}}>
          <button onClick={() => onSelect(selectedMain,'')} className={`badge text-xs cursor-pointer ${!selectedSub ? 'badge-blue' : 'badge-gray'}`}>전체</button>
          {CATEGORIES[selectedMain].map(sub => (
            <button key={sub} onClick={() => onSelect(selectedMain,sub)} className={`badge text-xs cursor-pointer ${selectedSub===sub ? 'badge-blue' : 'badge-gray'}`}>
              {sub.replace(/^\d+-\d+\.\s/,'')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
