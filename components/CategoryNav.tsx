'use client'
import { useState } from 'react'
import { useLang } from '@/lib/LangContext'

const CATEGORIES_EN: Record<string, string[]> = {
  '01. Foundation Models': ['01-01. General Purpose Language Models (Frontier LLMs)','01-02. Small Language Models (SLMs)','01-03. Multimodal Integrated Intelligence','01-04. Logical Reasoning Specialized Models','01-05. Enterprise-Specific Fine-Tuned Models'],
  '02. Search & Knowledge Discovery': ['02-01. Conversational AI Search Engines','02-02. Academic & Paper Research','02-03. Fact Verification & Fact-Checking','02-04. Enterprise Intelligent Search','02-05. Patent & Regulatory Analysis','02-06. AI Browsers & Web Agents'],
  '03. Visual Art & Generative Design': ['03-01. Artistic Image Generation','03-02. Image Editing & Retouching','03-03. Brand & Logo Design','03-04. UI/UX & Web Layout','03-05. 3D Modeling & Asset Generation','03-06. Architecture & Spatial/Interior Design','03-07. Character & Game Art Design'],
  '04. Video & Motion Synthesis': ['04-01. Text-to-Video (T2V)','04-02. AI Avatars & Virtual Humans','04-03. Video Translation & Dubbing','04-04. Automated Video Editing','04-05. VFX & Special Effects','04-06. Real-Time Video Enhancement','04-07. Animation & Motion Capture'],
  '05. Audio & Music Generation': ['05-01. Speech Synthesis & TTS','05-02. Voice Conversion & Cloning','05-03. AI Music Composition & BGM','05-04. Sound Effect Generation','05-05. Audio Post-Production'],
  '06. Development & Coding': ['06-01. AI Coding Assistants','06-02. Code Review & Security Vulnerability Analysis','06-03. Low-Code / No-Code (LCNC) Builders','06-04. Database Design & Query Optimization','06-05. Documentation & API Management'],
  '07. Agents & Automation': ['07-01. Autonomous Behavioral Agents','07-02. Workflow Integration Automation','07-03. Customer Service Agents','07-04. Personal Work Assistants','07-05. AI Safety, Evaluation & Red Teaming'],
  '08. Business & Office Productivity': ['08-01. Meeting Recording & Summarization','08-02. Document Generation & Editing','08-03. Data Visualization & Chart Generation','08-04. Automated Presentation Production','08-05. Document Processing & OCR'],
  '09. Marketing & Content Creation': ['09-01. Copywriting & Ad Copy','09-02. E-Commerce Marketing Assets','09-03. SNS Management & Performance Analytics','09-04. SEO Optimization Strategies','09-05. AI Influencers & Virtual Creators'],
  '10. Education & Academic': ['10-01. Personalized Tutoring','10-02. Foreign Language Learning & Conversation','10-03. Automated Grading & Feedback','10-04. Academic Writing Assistants'],
  '11. Specialized Industries': ['11-01. Healthcare & Biotechnology','11-02. Legal & Compliance','11-03. Finance & FinTech','11-04. Real Estate & Architecture','11-05. Retail & Logistics','11-06. Agriculture & Smart Farming','11-07. Energy & Climate Tech'],
  '12. Hardware & Robotics': ['12-01. Humanoid & General-Purpose Robots','12-02. Industrial Collaborative Robots','12-03. Autonomous Driving & Mobility','12-04. Smart Sensors & Wearables'],
  '13. Infrastructure & Security': ['13-01. AI Semiconductors & Accelerators','13-02. MLOps, Model Serving & Data Ops','13-03. Cybersecurity & Threat Detection','13-04. Sovereign AI & Private Cloud'],
}

const MAIN_KO: Record<string, string> = {
  '01. Foundation Models':'파운데이션 모델','02. Search & Knowledge Discovery':'검색 및 지식 탐구',
  '03. Visual Art & Generative Design':'비주얼 아트 및 디자인','04. Video & Motion Synthesis':'영상 및 모션 그래픽',
  '05. Audio & Music Generation':'오디오 및 음악','06. Development & Coding':'개발 및 코딩',
  '07. Agents & Automation':'에이전트 및 자동화','08. Business & Office Productivity':'비즈니스 및 사무 생산성',
  '09. Marketing & Content Creation':'마케팅 및 콘텐츠 제작','10. Education & Academic':'교육 및 학술',
  '11. Specialized Industries':'전문 산업군','12. Hardware & Robotics':'하드웨어 및 로보틱스',
  '13. Infrastructure & Security':'인프라 및 보안',
}

const SUB_KO: Record<string, string> = {
  '01-01. General Purpose Language Models (Frontier LLMs)':'범용 언어 모델','01-02. Small Language Models (SLMs)':'소형 언어 모델','01-03. Multimodal Integrated Intelligence':'멀티모달 통합 지능','01-04. Logical Reasoning Specialized Models':'논리 추론 특화','01-05. Enterprise-Specific Fine-Tuned Models':'기업 특화 파인튜닝',
  '02-01. Conversational AI Search Engines':'대화형 AI 검색','02-02. Academic & Paper Research':'학술 및 논문 리서치','02-03. Fact Verification & Fact-Checking':'사실 검증 및 팩트체크','02-04. Enterprise Intelligent Search':'기업용 지능형 검색','02-05. Patent & Regulatory Analysis':'특허 및 규제 분析','02-06. AI Browsers & Web Agents':'AI 브라우저 및 웹 에이전트',
  '03-01. Artistic Image Generation':'예술적 이미지 생성','03-02. Image Editing & Retouching':'이미지 편집 및 리터칭','03-03. Brand & Logo Design':'브랜드 및 로고 디자인','03-04. UI/UX & Web Layout':'UI/UX 및 웹 레이아웃','03-05. 3D Modeling & Asset Generation':'3D 모델링 및 에셋 생성','03-06. Architecture & Spatial/Interior Design':'건축 및 공간/인테리어','03-07. Character & Game Art Design':'캐릭터 및 게임 아트',
  '04-01. Text-to-Video (T2V)':'텍스트-투-비디오','04-02. AI Avatars & Virtual Humans':'AI 아바타 및 가상 휴먼','04-03. Video Translation & Dubbing':'영상 번역 및 더빙','04-04. Automated Video Editing':'자동 영상 편집','04-05. VFX & Special Effects':'VFX 및 특수 효과','04-06. Real-Time Video Enhancement':'실시간 영상 향상','04-07. Animation & Motion Capture':'애니메이션 및 모션 캡처',
  '05-01. Speech Synthesis & TTS':'음성 합성 및 TTS','05-02. Voice Conversion & Cloning':'음성 변환 및 클로닝','05-03. AI Music Composition & BGM':'AI 작곡 및 배경음악','05-04. Sound Effect Generation':'효과음 생성','05-05. Audio Post-Production':'오디오 포스트 프로덕션',
  '06-01. AI Coding Assistants':'AI 코딩 어시스턴트','06-02. Code Review & Security Vulnerability Analysis':'코드 리뷰 및 보안 분析','06-03. Low-Code / No-Code (LCNC) Builders':'노코드/로우코드 빌더','06-04. Database Design & Query Optimization':'DB 설계 및 쿼리 최적화','06-05. Documentation & API Management':'문서화 및 API 관리',
  '07-01. Autonomous Behavioral Agents':'자율 행동 에이전트','07-02. Workflow Integration Automation':'워크플로우 통합 자동화','07-03. Customer Service Agents':'고객 서비스 에이전트','07-04. Personal Work Assistants':'개인용 업무 비서','07-05. AI Safety, Evaluation & Red Teaming':'AI 안전·정렬·레드팀',
  '08-01. Meeting Recording & Summarization':'회의 기록 및 요약','08-02. Document Generation & Editing':'문서 생성 및 편집','08-03. Data Visualization & Chart Generation':'데이터 시각화 및 차트','08-04. Automated Presentation Production':'프레젠테이션 자동 제작','08-05. Document Processing & OCR':'문서 처리 및 OCR',
  '09-01. Copywriting & Ad Copy':'카피라이팅 및 광고 문구','09-02. E-Commerce Marketing Assets':'이커머스 마케팅 에셋','09-03. SNS Management & Performance Analytics':'SNS 관리 및 성과 분析','09-04. SEO Optimization Strategies':'SEO 최적화 전략','09-05. AI Influencers & Virtual Creators':'AI 인플루언서 및 버추얼',
  '10-01. Personalized Tutoring':'개인 맞춤형 튜터링','10-02. Foreign Language Learning & Conversation':'외국어 학습 및 대화','10-03. Automated Grading & Feedback':'자동 채점 및 피드백','10-04. Academic Writing Assistants':'학술적 글쓰기 어시스턴트',
  '11-01. Healthcare & Biotechnology':'의료 및 바이오','11-02. Legal & Compliance':'법률 및 컴플라이언스','11-03. Finance & FinTech':'금융 및 핀테크','11-04. Real Estate & Architecture':'부동산 및 건축','11-05. Retail & Logistics':'유통 및 물류','11-06. Agriculture & Smart Farming':'농업 및 스마트팜','11-07. Energy & Climate Tech':'에너지 및 기후 테크',
  '12-01. Humanoid & General-Purpose Robots':'휴머노이드 및 범용 로봇','12-02. Industrial Collaborative Robots':'산업용 협동 로봇','12-03. Autonomous Driving & Mobility':'자율주행 및 모빌리티','12-04. Smart Sensors & Wearables':'스마트 센서 및 웨어러블',
  '13-01. AI Semiconductors & Accelerators':'AI 반도체 및 가속기','13-02. MLOps, Model Serving & Data Ops':'MLOps 및 모델 서빙','13-03. Cybersecurity & Threat Detection':'사이버 보안 및 위협 탐지','13-04. Sovereign AI & Private Cloud':'소버린 AI 및 프라이빗 클라우드',
}

const ICONS: Record<string, string> = {
  '01. Foundation Models':'🧠','02. Search & Knowledge Discovery':'🔍',
  '03. Visual Art & Generative Design':'🎨','04. Video & Motion Synthesis':'🎬',
  '05. Audio & Music Generation':'🎵','06. Development & Coding':'💻',
  '07. Agents & Automation':'🤖','08. Business & Office Productivity':'📊',
  '09. Marketing & Content Creation':'📣','10. Education & Academic':'📚',
  '11. Specialized Industries':'🏭','12. Hardware & Robotics':'⚙️',
  '13. Infrastructure & Security':'🔒',
}

export default function CategoryNav({ selectedMain, selectedSub, onSelect }: {
  selectedMain: string; selectedSub: string; onSelect: (m: string, s: string) => void
}) {
  const { lang } = useLang()
  const ko = lang === 'ko'

  const getMainLabel = (key: string) => ko ? (MAIN_KO[key] ?? key.replace(/^\d+\.\s/, '')) : key.replace(/^\d+\.\s/, '')
  const getSubLabel  = (key: string) => ko ? (SUB_KO[key]  ?? key.replace(/^\d+-\d+\.\s/, '')) : key.replace(/^\d+-\d+\.\s/, '')

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', borderRadius: '6px',
    fontSize: '11px', fontWeight: 500,
    cursor: 'pointer', border: 'none',
    transition: 'all 0.12s', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 대분류 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        <button
          onClick={() => onSelect('', '')}
          style={{
            ...btnBase,
            background: !selectedMain ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
            color: !selectedMain ? '#00ff88' : '#8b949e',
            border: `1px solid ${!selectedMain ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}`,
            fontWeight: !selectedMain ? 700 : 500,
          }}
        >
          {ko ? '전체' : 'All'}
        </button>

        {Object.keys(CATEGORIES_EN).map(main => {
          const active = selectedMain === main
          return (
            <button
              key={main}
              onClick={() => onSelect(main, '')}
              style={{
                ...btnBase,
                background: active ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
                color: active ? '#00ff88' : '#8b949e',
                border: `1px solid ${active ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}`,
                fontWeight: active ? 700 : 500,
              }}
            >
              <span style={{ fontSize: '12px' }}>{ICONS[main]}</span>
              {getMainLabel(main)}
            </button>
          )
        })}
      </div>

      {/* 세분류 */}
      {selectedMain && CATEGORIES_EN[selectedMain] && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px',
          paddingLeft: '10px',
          borderLeft: '2px solid rgba(0,255,136,0.2)',
          animation: 'fadeIn 0.2s ease forwards',
        }}>
          <button
            onClick={() => onSelect(selectedMain, '')}
            style={{
              ...btnBase,
              background: !selectedSub ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)',
              color: !selectedSub ? '#00d4ff' : '#8b949e',
              border: `1px solid ${!selectedSub ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >{ko ? '전체' : 'All'}</button>

          {CATEGORIES_EN[selectedMain].map(sub => {
            const active = selectedSub === sub
            return (
              <button
                key={sub}
                onClick={() => onSelect(selectedMain, sub)}
                style={{
                  ...btnBase,
                  background: active ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#00d4ff' : '#6e7681',
                  border: `1px solid ${active ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >{getSubLabel(sub)}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}
