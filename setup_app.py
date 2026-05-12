"""
앱 파일 자동 생성 스크립트 — setup_app.py
==========================================
C:\dogfish\ai-engine-app 폴더에서 실행하세요.

실행:
    cd C:\dogfish\ai-engine-app
    python setup_app.py
"""

import os

files = {}

# ── lib/supabase.ts ───────────────────────────────────────────
files['lib/supabase.ts'] = """import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type AIProduct = {
  id: number
  category_main: string
  category_sub: string
  country: string
  manufacturer: string
  product_name: string
  description: string
  official_url: string
  verification_status: string
  is_research_model: boolean
  created_at: string
  updated_at: string
  versions?: AIVersion[]
}

export type AIVersion = {
  id: number
  product_id: number
  version_name: string
  is_active: boolean
  sort_order: number
}
"""

# ── app/globals.css ────────────────────────────────────────────
files['app/globals.css'] = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --accent: #00ff88;
  --accent-dim: #00cc6a;
  --accent-glow: rgba(0, 255, 136, 0.15);
  --surface: #111318;
  --surface-2: #1a1d26;
  --border: rgba(255,255,255,0.08);
}

* { box-sizing: border-box; }

body {
  font-family: 'Noto Sans KR', sans-serif;
  background: #080a0f;
  min-height: 100vh;
}

.font-display { font-family: 'Bebas Neue', sans-serif; }
.font-mono    { font-family: 'JetBrains Mono', monospace; }

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--accent-dim); border-radius: 2px; }

.glow { box-shadow: 0 0 20px var(--accent-glow), 0 0 40px var(--accent-glow); }
.glow-text { text-shadow: 0 0 20px var(--accent); }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.2s ease;
}
.card:hover {
  border-color: var(--accent-dim);
  background: var(--surface-2);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
}
.badge-green  { background: rgba(0,255,136,0.12); color: #00ff88; border: 1px solid rgba(0,255,136,0.3); }
.badge-gray   { background: rgba(255,255,255,0.06); color: #999; border: 1px solid rgba(255,255,255,0.1); }
.badge-blue   { background: rgba(99,179,237,0.12); color: #63b3ed; border: 1px solid rgba(99,179,237,0.3); }
.badge-orange { background: rgba(251,146,60,0.12); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }

.input-field {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #fff;
  padding: 10px 16px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}
.input-field:focus { border-color: var(--accent-dim); }
.input-field::placeholder { color: #555; }

.btn-primary {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary:hover { background: var(--accent-dim); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-ghost {
  background: transparent;
  color: #aaa;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover { border-color: var(--accent-dim); color: var(--accent); }
.btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.3s ease forwards; }

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
.pulse { animation: pulse-glow 2s ease-in-out infinite; }

.grid-bg {
  background-image:
    linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
"""

# ── app/layout.tsx ─────────────────────────────────────────────
files['app/layout.tsx'] = """import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '이거봐! AI가 모두 모였어',
  description: '전 세계 실존하는 모든 AI를 한눈에.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  )
}
"""

# ── components/Header.tsx ─────────────────────────────────────
files['components/Header.tsx'] = """'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl" style={{background:'rgba(8,10,15,0.85)'}}>
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl" style={{color:'var(--accent)'}}>AI</span>
          <span className="font-display text-2xl text-white">MAP</span>
          <span className="badge badge-green font-mono text-xs ml-1 pulse">LIVE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="btn-ghost text-sm">탐색</Link>
          <Link href="/request" className="btn-ghost text-sm">등록 요청</Link>
          <Link href="/auth" className="btn-primary text-sm ml-2">시리얼 인증</Link>
        </nav>
        <button className="md:hidden btn-ghost text-sm" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-2" style={{background:'rgba(8,10,15,0.95)'}}>
          <Link href="/" className="btn-ghost text-sm text-left">탐색</Link>
          <Link href="/request" className="btn-ghost text-sm text-left">등록 요청</Link>
          <Link href="/auth" className="btn-primary text-sm text-center">시리얼 인증</Link>
        </div>
      )}
    </header>
  )
}
"""

# ── components/SearchBar.tsx ──────────────────────────────────
files['components/SearchBar.tsx'] = """'use client'
export default function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
      <input className="input-field pl-11 text-base h-12" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder || '검색...'} />
      {value && (
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          onClick={() => onChange('')}>✕</button>
      )}
    </div>
  )
}
"""

# ── components/StatsBar.tsx ────────────────────────────────────
files['components/StatsBar.tsx'] = """export default function StatsBar({ totalCount }: { totalCount: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 my-6">
      {[
        { label: '등록된 AI', value: totalCount.toLocaleString(), unit: '개' },
        { label: '대분류', value: '13', unit: '개' },
        { label: '세분류', value: '60', unit: '개' },
      ].map(({ label, value, unit }) => (
        <div key={label} className="card p-4 text-center">
          <div className="font-display text-3xl md:text-4xl" style={{color:'var(--accent)'}}>
            {value}<span className="text-lg text-gray-500 ml-1">{unit}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">{label}</div>
        </div>
      ))}
    </div>
  )
}
"""

# ── components/CategoryNav.tsx ─────────────────────────────────
files['components/CategoryNav.tsx'] = """'use client'
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
            {ICONS[main]} {main.replace(/^\\d+\\.\\s/,'')}
          </button>
        ))}
      </div>
      {selectedMain && CATEGORIES[selectedMain] && (
        <div className="flex flex-wrap gap-2 pl-2 border-l-2 fade-in" style={{borderColor:'var(--accent-dim)'}}>
          <button onClick={() => onSelect(selectedMain,'')} className={`badge text-xs cursor-pointer ${!selectedSub ? 'badge-blue' : 'badge-gray'}`}>전체</button>
          {CATEGORIES[selectedMain].map(sub => (
            <button key={sub} onClick={() => onSelect(selectedMain,sub)} className={`badge text-xs cursor-pointer ${selectedSub===sub ? 'badge-blue' : 'badge-gray'}`}>
              {sub.replace(/^\\d+-\\d+\\.\\s/,'')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
"""

# ── components/ProductCard.tsx ────────────────────────────────
files['components/ProductCard.tsx'] = """'use client'
import { AIProduct } from '@/lib/supabase'

export default function ProductCard({ product, isComparing, onCompare }: {
  product: AIProduct; isComparing: boolean; onCompare: (p: AIProduct) => void
}) {
  const active = product.versions?.filter(v => v.is_active) || []
  const depr   = product.versions?.filter(v => !v.is_active) || []
  return (
    <div className={`card p-5 flex flex-col gap-3`}
      style={isComparing ? {borderColor:'var(--accent)',background:'rgba(0,255,136,0.05)'} : {}}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm leading-tight truncate">{product.product_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{product.manufacturer} · {product.country}</p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {product.is_research_model && <span className="badge badge-orange">연구모델</span>}
          <span className="badge badge-gray truncate max-w-[100px]">{product.category_sub?.replace(/^\\d+-\\d+\\.\\s/,'')}</span>
        </div>
      </div>
      {product.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{product.description}</p>}
      {active.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-1 font-mono">운영버전</p>
          <div className="flex flex-wrap gap-1">
            {active.slice(0,4).map(v => <span key={v.id} className="badge badge-green text-xs">{v.version_name}</span>)}
            {active.length > 4 && <span className="badge badge-gray text-xs">+{active.length-4}</span>}
          </div>
        </div>
      )}
      {depr.length > 0 && (
        <div>
          <p className="text-xs text-gray-600 mb-1 font-mono">구버전</p>
          <div className="flex flex-wrap gap-1">
            {depr.slice(0,3).map(v => <span key={v.id} className="badge badge-gray text-xs line-through opacity-60">{v.version_name}</span>)}
            {depr.length > 3 && <span className="badge badge-gray text-xs">+{depr.length-3}</span>}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
        {product.official_url && (
          <a href={product.official_url} target="_blank" rel="noopener noreferrer"
            className="btn-ghost text-xs flex-1 text-center" onClick={e => e.stopPropagation()}>
            🔗 공식 사이트
          </a>
        )}
        <button onClick={() => onCompare(product)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${isComparing ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'}`}>
          {isComparing ? '✓ 비교 중' : '비교'}
        </button>
      </div>
    </div>
  )
}
"""

# ── components/ComparePanel.tsx ────────────────────────────────
files['components/ComparePanel.tsx'] = """'use client'
import { AIProduct } from '@/lib/supabase'

export default function ComparePanel({ products, onClose }: { products: AIProduct[]; onClose: () => void }) {
  const fields = [
    {label:'제조사',key:'manufacturer'},{label:'국가',key:'country'},
    {label:'대분류',key:'category_main'},{label:'세분류',key:'category_sub'},
    {label:'검증상태',key:'verification_status'},
  ]
  const cols = `120px repeat(${products.length}, 1fr)`
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:'rgba(0,0,0,0.85)'}}>
      <div className="w-full max-w-5xl mx-4 mb-4 card p-6 max-h-[85vh] overflow-y-auto fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl" style={{color:'var(--accent)'}}>AI 비교</h2>
          <button onClick={onClose} className="btn-ghost">✕ 닫기</button>
        </div>
        <div className="grid gap-4 mb-6" style={{gridTemplateColumns:cols}}>
          <div/>
          {products.map(p => (
            <div key={p.id} className="text-center">
              <h3 className="font-bold text-white text-sm">{p.product_name}</h3>
              <p className="text-xs text-gray-500">{p.manufacturer}</p>
            </div>
          ))}
        </div>
        {fields.map(f => (
          <div key={f.key} className="grid gap-4 py-3 border-t border-white/5" style={{gridTemplateColumns:cols}}>
            <div className="text-xs text-gray-500 font-mono flex items-center">{f.label}</div>
            {products.map(p => <div key={p.id} className="text-xs text-gray-300 text-center">{String((p as any)[f.key]||'-')}</div>)}
          </div>
        ))}
        <div className="grid gap-4 py-3 border-t border-white/5" style={{gridTemplateColumns:cols}}>
          <div className="text-xs text-gray-500 font-mono">전문가 분석</div>
          {products.map(p => <div key={p.id} className="text-xs text-gray-400 leading-relaxed">{p.description||'-'}</div>)}
        </div>
        <div className="grid gap-4 py-3 border-t border-white/5" style={{gridTemplateColumns:cols}}>
          <div className="text-xs text-gray-500 font-mono">운영버전</div>
          {products.map(p => (
            <div key={p.id} className="flex flex-wrap gap-1">
              {p.versions?.filter(v=>v.is_active).slice(0,5).map(v => <span key={v.id} className="badge badge-green text-xs">{v.version_name}</span>)}
            </div>
          ))}
        </div>
        <div className="grid gap-4 py-3 border-t border-white/5" style={{gridTemplateColumns:cols}}>
          <div className="text-xs text-gray-500 font-mono">공식 사이트</div>
          {products.map(p => (
            <div key={p.id} className="text-center">
              {p.official_url ? <a href={p.official_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:underline">바로가기 →</a> : <span className="text-gray-600 text-xs">-</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
"""

# ── app/page.tsx ───────────────────────────────────────────────
files['app/page.tsx'] = """'use client'
import { useState, useEffect } from 'react'
import { supabase, AIProduct } from '@/lib/supabase'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import CategoryNav from '@/components/CategoryNav'
import ProductCard from '@/components/ProductCard'
import ComparePanel from '@/components/ComparePanel'
import StatsBar from '@/components/StatsBar'

const PAGE_SIZE = 48

export default function Home() {
  const [products, setProducts]         = useState<AIProduct[]>([])
  const [filtered, setFiltered]         = useState<AIProduct[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchQuery, setSearchQuery]   = useState('')
  const [selectedMain, setSelectedMain] = useState('')
  const [selectedSub, setSelectedSub]   = useState('')
  const [compareList, setCompareList]   = useState<AIProduct[]>([])
  const [showCompare, setShowCompare]   = useState(false)
  const [totalCount, setTotalCount]     = useState(0)
  const [page, setPage]                 = useState(0)

  useEffect(() => { fetchProducts() }, [selectedMain, selectedSub, page])

  useEffect(() => {
    if (!searchQuery.trim()) { setFiltered(products); return }
    const q = searchQuery.toLowerCase()
    setFiltered(products.filter(p =>
      p.product_name.toLowerCase().includes(q) ||
      (p.manufacturer||'').toLowerCase().includes(q) ||
      (p.description||'').toLowerCase().includes(q)
    ))
  }, [searchQuery, products])

  async function fetchProducts() {
    setLoading(true)
    try {
      let q = supabase.from('ai_products').select('*', { count: 'exact' })
        .order('category_main').order('product_name')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (selectedMain) q = q.eq('category_main', selectedMain)
      if (selectedSub)  q = q.eq('category_sub', selectedSub)
      const { data, count, error } = await q
      if (error) throw error
      if (data && data.length > 0) {
        const ids = data.map((p: any) => p.id)
        const { data: versions } = await supabase.from('ai_versions').select('*').in('product_id', ids).order('sort_order')
        const withV = data.map((p: any) => ({ ...p, versions: versions?.filter((v: any) => v.product_id === p.id) || [] }))
        setProducts(withV); setFiltered(withV)
      } else { setProducts([]); setFiltered([]) }
      setTotalCount(count || 0)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  function toggleCompare(product: AIProduct) {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id)
      if (prev.length >= 3) { alert('최대 3개까지 비교 가능합니다.'); return prev }
      return [...prev, product]
    })
  }

  function handleCategory(main: string, sub: string) {
    setSelectedMain(main); setSelectedSub(sub); setPage(0); setSearchQuery('')
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 pb-20">
        <section className="py-12 text-center">
          <p className="font-mono text-xs text-green-400 tracking-widest mb-3 pulse">LIVE DATABASE · 매일 자정 자동 업데이트</p>
          <h1 className="font-display text-6xl md:text-8xl text-white leading-none mb-2">이거봐!</h1>
          <h2 className="font-display text-4xl md:text-6xl glow-text mb-6" style={{color:'var(--accent)'}}>AI가 모두 모였어</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            전 세계 실존하는 모든 AI를 한눈에.<br/>대분류·세분류별 탐색, 전문가 분석, 실시간 업데이트.
          </p>
        </section>

        <StatsBar totalCount={totalCount} />
        <div className="my-8"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="AI 이름, 제조사, 기능으로 검색..." /></div>
        <CategoryNav selectedMain={selectedMain} selectedSub={selectedSub} onSelect={handleCategory} />

        {compareList.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50 flex gap-3 items-center">
            <button onClick={() => setShowCompare(true)} className="btn-primary flex items-center gap-2 shadow-2xl glow">
              <span>⚖️</span><span>{compareList.length}개 비교하기</span>
            </button>
            <button onClick={() => setCompareList([])} className="btn-ghost text-sm">초기화</button>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 mb-4">
          <div className="flex items-center gap-3">
            {(selectedMain || searchQuery) && (
              <button onClick={() => { setSelectedMain(''); setSelectedSub(''); setSearchQuery(''); setPage(0) }} className="btn-ghost text-xs">✕ 초기화</button>
            )}
            <span className="text-gray-500 text-sm font-mono">
              {searchQuery ? `"${searchQuery}" ${filtered.length}개` : `${totalCount.toLocaleString()}개`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length:12}).map((_,i) => (
              <div key={i} className="card p-5 h-48 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-3"/><div className="h-3 bg-gray-800 rounded w-1/2 mb-4"/>
                <div className="h-3 bg-gray-800 rounded w-full mb-2"/><div className="h-3 bg-gray-800 rounded w-5/6"/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-4">🔍</div><p>검색 결과가 없습니다.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
            {filtered.map(p => <ProductCard key={p.id} product={p} isComparing={!!compareList.find(c => c.id === p.id)} onCompare={toggleCompare} />)}
          </div>
        )}

        {!searchQuery && totalCount > PAGE_SIZE && (
          <div className="flex justify-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} className="btn-ghost disabled:opacity-30">← 이전</button>
            <span className="flex items-center text-gray-500 font-mono text-sm">{page+1} / {Math.ceil(totalCount/PAGE_SIZE)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={(page+1)*PAGE_SIZE>=totalCount} className="btn-ghost disabled:opacity-30">다음 →</button>
          </div>
        )}
      </main>

      {showCompare && compareList.length > 0 && <ComparePanel products={compareList} onClose={() => setShowCompare(false)} />}
    </div>
  )
}
"""

# ── app/auth/page.tsx ──────────────────────────────────────────
files['app/auth/page.tsx'] = """'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function AuthPage() {
  const [code, setCode]     = useState('')
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ok:boolean,msg:string}|null>(null)

  async function handleAuth() {
    if (!code.trim() || !email.trim()) { setResult({ok:false,msg:'코드와 이메일을 모두 입력해주세요.'}); return }
    setLoading(true)
    try {
      const { data: serial, error } = await supabase.from('serial_codes').select('*').eq('code', code.trim().toUpperCase()).single()
      if (error || !serial) { setResult({ok:false,msg:'유효하지 않은 시리얼 코드입니다.'}); return }
      if (serial.is_used) { setResult({ok:false,msg:'이미 사용된 코드입니다.'}); return }
      const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { data: { serial_code: code.trim().toUpperCase() } } })
      if (authError) throw authError
      setResult({ok:true,msg:`${email}로 인증 링크를 발송했습니다!`})
    } catch(e:any) { setResult({ok:false,msg:e.message||'오류가 발생했습니다.'}) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card p-8">
          <h1 className="font-display text-3xl mb-2" style={{color:'var(--accent)'}}>시리얼 코드 인증</h1>
          <p className="text-gray-500 text-sm mb-8">책 내부 시리얼 코드로 무제한 이용권을 활성화하세요.</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-mono mb-1 block">시리얼 코드</label>
              <input className="input-field font-mono tracking-widest uppercase" value={code} onChange={e=>setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" maxLength={20}/>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-mono mb-1 block">이메일</label>
              <input className="input-field" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/>
            </div>
            <button className="btn-primary w-full" onClick={handleAuth} disabled={loading}>{loading ? '처리 중...' : '인증하기'}</button>
            {result && (
              <div className={`p-4 rounded-lg text-sm fade-in ${result.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {result.msg}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-8 text-center">시리얼 코드는 1회만 사용 가능합니다.</p>
        </div>
      </div>
    </div>
  )
}
"""

# ── app/request/page.tsx ───────────────────────────────────────
files['app/request/page.tsx'] = """'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function RequestPage() {
  const [type, setType]       = useState<'update'|'new'|'delete'>('new')
  const [name, setName]       = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setLoading(true)
    try {
      await supabase.from('update_requests').insert({ request_type: type, product_name: name.trim()||null, content: content.trim(), status:'pending' })
      setDone(true)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="card p-8">
          <h1 className="font-display text-3xl mb-2" style={{color:'var(--accent)'}}>업데이트 요청</h1>
          <p className="text-gray-500 text-sm mb-8">누락된 AI, 잘못된 정보, 새 버전 출시 등을 알려주세요.</p>
          {done ? (
            <div className="text-center py-8 fade-in">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-green-400 font-bold mb-2">요청이 접수되었습니다!</p>
              <button className="btn-ghost mt-6" onClick={() => { setDone(false); setContent(''); setName('') }}>추가 요청</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 font-mono mb-2 block">요청 유형</label>
                <div className="flex gap-2">
                  {([{value:'new',label:'신규 등록'},{value:'update',label:'정보 수정'},{value:'delete',label:'삭제 요청'}] as const).map(t => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-all ${type===t.value ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-mono mb-1 block">AI 제품명</label>
                <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="예: GPT-5, Claude 4..."/>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-mono mb-1 block">요청 내용 *</label>
                <textarea className="input-field min-h-[120px] resize-none" value={content} onChange={e=>setContent(e.target.value)} placeholder="공식 URL, 버전 정보 등 포함하면 더 빠릅니다"/>
              </div>
              <button className="btn-primary w-full" onClick={handleSubmit} disabled={loading||!content.trim()}>{loading ? '제출 중...' : '요청 제출'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
"""

# ── 파일 생성 ─────────────────────────────────────────────────
def create_files():
    base = os.getcwd()
    created = 0
    for path, content in files.items():
        full_path = os.path.join(base, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content.lstrip('\n'))
        print(f'  ✅ {path}')
        created += 1
    print(f'\n총 {created}개 파일 생성 완료!')
    print('\n다음 단계:')
    print('  npm run dev')
    print('  브라우저: http://localhost:3000')

if __name__ == '__main__':
    print('='*50)
    print(' 앱 파일 자동 생성')
    print('='*50)
    print(f'경로: {os.getcwd()}\n')
    create_files()
