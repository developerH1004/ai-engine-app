'use client'
import { AIProduct } from '@/lib/supabase'
import { useState, useRef, useEffect } from 'react'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import { GlossaryTerm } from '@/lib/glossaryData'
import { parseTextWithGlossary } from '@/lib/useGlossary'

function calcPopupPos(
  clientX: number,
  clientY: number,
  popupW: number,
  popupH: number,
): React.CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const m = 12

  // 세로: 클릭 아래 → 공간 없으면 위
  let top = clientY + 16
  if (top + popupH > vh - m) top = Math.max(m, clientY - popupH - 8)
  top = Math.max(m, Math.min(top, vh - popupH - m))

  // 가로: 클릭 왼쪽 정렬, 오른쪽 잘리면 조정
  let left = clientX
  if (left + popupW + m > vw) left = Math.max(m, vw - popupW - m)
  left = Math.max(m, left)

  return { position: 'fixed', top, left, width: popupW }
}

function calcPopupPosFromRect(rect: DOMRect, popupW: number): React.CSSProperties {
  const vw = window.innerWidth
  const left = Math.max(12, (vw - popupW) / 2)
  // top: 카드의 페이지 절대 위치 (스크롤 포함)
  const pageTop = rect.top + window.scrollY
  return { position: 'absolute', top: pageTop, left, width: popupW }
}

function installBadgeStyle(type: string | null) {
  if (!type) return null
  const lc = type.toLowerCase()
  if (lc.includes('local') || lc.includes('on-premise'))
    return { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)', color: '#fbbf24', icon: '💻' }
  if (lc.includes('docker') || lc.includes('self-hosted'))
    return { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', color: '#a855f7', icon: '🐳' }
  if (lc.includes('ide') || lc.includes('standalone'))
    return { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: '#60a5fa', icon: '🛠️' }
  return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#34d399', icon: '☁️' }
}

export default function ProductCard({ product, isComparing, onCompare }: {
  product: AIProduct
  isComparing: boolean
  onCompare: (p: AIProduct) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const [detailOpen,    setDetailOpen]    = useState(false)
  const [detailStyle,   setDetailStyle]   = useState<React.CSSProperties>({})
  const [glossaryTerm,  setGlossaryTerm]  = useState<GlossaryTerm | null>(null)
  const [glossaryStyle, setGlossaryStyle] = useState<React.CSSProperties>({})
  const [prompts, setPrompts]             = useState<any[]>([])
  const [promptOpen, setPromptOpen]       = useState(false)
  const [promptStyle, setPromptStyle]     = useState<React.CSSProperties>({})
  const [activePrompt, setActivePrompt]   = useState<any>(null)

  const { lang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key
  const ko = lang === 'ko'

  const active = product.versions?.filter(v => v.is_active) || []
  const depr   = product.versions?.filter(v => !v.is_active) || []

  const desc      = ko ? (product.description_ko || product.description || '') : (product.description || '')
  const cleanDesc = desc && desc !== 'nan' ? desc : ''
  const subLabel  = ko
    ? (product.category_sub_ko || product.category_sub || '').replace(/^\d+-\d+\.\s/, '')
    : (product.category_sub || '').replace(/^\d+-\d+\.\s/, '')

  const pricing    = product.pricing_type || ''
  const modality   = ko ? (product.modality_ko || product.modality || '') : (product.modality || '')
  const region     = ko ? (product.service_region_ko || product.service_region || '') : (product.service_region || '')
  const monthlyFee = product.monthly_fee_usd
  const hasSetup   = !!(product.install_type)
  const instStyle  = installBadgeStyle(product.install_type)

  // 카드의 카테고리 코드 추출 (예: "01-01" or "01")
  const catMainCode = (product.category_main || '').match(/^(\d+)/)?.[1] || ''
  const catSubCode  = (product.category_sub  || '').match(/^(\d+-\d+)/)?.[1] || ''

  // 상세팝업 열릴 때 해당 제품 프롬프트 로드
  useEffect(() => {
    if (!detailOpen) return
    import('@/lib/supabase').then(({ supabase }) => {
      // Category_Match 필드에 해당 대분류/세분류/제품명 포함된 프롬프트 조회
      const filters = ['ALL', catMainCode, catSubCode, product.product_name].filter(Boolean)
      const orStr = filters.map(f =>
        `cat_match_1.eq.${f},cat_match_2.eq.${f},cat_match_3.eq.${f},cat_match_4.eq.${f},cat_match_5.eq.${f}`
      ).join(',')
      supabase.from('prompts').select('*').or(orStr).then(({ data }) => {
        setPrompts(data || [])
      })
    })
  }, [detailOpen, catMainCode, catSubCode, product.product_name])

  // Prompt_Type → 버튼 라벨
  const PROMPT_TYPE_MAP: Record<string, { ko: string; en: string; color: string }> = {
    '일반(범용) 프롬프트 작성 방법': { ko: '📝 일반 작성법', en: '📝 General Method', color: '#3b82f6' },
    '전문가용 프롬프트 작성 방법':   { ko: '🎯 전문가 작성법', en: '🎯 Expert Method',  color: '#8b5cf6' },
    '특정분야 프롬프트 작성 방법':   { ko: '🔬 분야별 작성법', en: '🔬 Domain Method',  color: '#06b6d4' },
    '일반(범용) 프롬프트 사례':      { ko: '💡 일반 사례', en: '💡 General Examples',    color: '#10b981' },
    '전문가용 프롬프트 사례':        { ko: '⭐ 전문가 사례', en: '⭐ Expert Examples',    color: '#f59e0b' },
    '특정분야 프롬프트 사례':        { ko: '🏷️ 분야별 사례', en: '🏷️ Domain Examples',   color: '#ec4899' },
  }

  // 프롬프트 타입별 그룹화
  const promptGroups = prompts.reduce((acc: Record<string, any[]>, p) => {
    if (!acc[p.prompt_type]) acc[p.prompt_type] = []
    acc[p.prompt_type].push(p)
    return acc
  }, {})

  function renderLines(text: string | null | undefined) {
    if (!text) return null
    return text.replace(/\\n/g, '\n').split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ))
  }

  function renderDesc(text: string) {
    return parseTextWithGlossary(text).map((seg, i) =>
      seg.type === 'text' ? (
        <span key={i}>{seg.content}</span>
      ) : (
        <span
          key={i}
          onMouseDown={e => {
            e.stopPropagation()
            setGlossaryStyle(calcPopupPos(e.clientX, e.clientY, 480, 400))
            setGlossaryTerm(seg.term)
          }}
          title={ko ? seg.term.kr : seg.term.en}
          style={{ color: '#3b82f6', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer', fontWeight: 500 }}
        >
          {seg.content}
        </span>
      )
    )
  }

  const dimStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }
  const popupBase: React.CSSProperties = {
    background: '#111318', borderRadius: '14px',
    maxHeight: '80vh', overflowY: 'auto', padding: '22px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.75)',
  }

  return (
    <>
      {/* ── 카드 ── */}
      <div
        ref={cardRef}
        className="card p-4 flex flex-col gap-2"
        style={{ cursor: 'pointer', ...(isComparing ? { borderColor: 'var(--accent)', background: 'rgba(0,255,136,0.05)' } : {}) }}
        onClick={() => {
          const rect = cardRef.current?.getBoundingClientRect()
          if (rect) {
            setDetailStyle(calcPopupPosFromRect(rect, 620))
            // 팝업(=카드 위치)이 화면 세로 중앙에 오도록 스크롤
            const pageTop = rect.top + window.scrollY
            const targetScroll = pageTop - window.innerHeight / 2
            window.scrollTo({ top: targetScroll, behavior: 'smooth' })
          }
          setDetailOpen(true)
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '13px', lineHeight: 1.3 }}>{product.product_name}</h3>
            <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {product.manufacturer} · {ko ? (product.country_ko || product.country) : product.country}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
            {product.is_research_model && <span className="badge badge-orange" style={{ fontSize: '10px' }}>{tx('researchModel')}</span>}
            <span className="badge badge-gray" style={{ fontSize: '10px', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subLabel}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {pricing    && <span className="badge badge-blue"  style={{ fontSize: '10px' }}>{pricing}</span>}
          {monthlyFee && monthlyFee > 0 && <span className="badge badge-gray" style={{ fontSize: '10px' }}>${monthlyFee}/mo</span>}
          {modality   && <span className="badge badge-gray"  style={{ fontSize: '10px' }}>{modality}</span>}
          {region     && <span className="badge badge-gray"  style={{ fontSize: '10px' }}>🌐 {region}</span>}
          {hasSetup && instStyle && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
              background: instStyle.bg, border: `1px solid ${instStyle.border}`, color: instStyle.color,
            }}>
              {instStyle.icon} {ko ? '설치 가이드' : 'Setup Guide'}
            </span>
          )}
        </div>

        {cleanDesc && (
          <p style={{ fontSize: '12px', color: '#999', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
            {cleanDesc}
          </p>
        )}

        {active.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {active.slice(0, 3).map(v => <span key={v.id} className="badge badge-green" style={{ fontSize: '10px' }}>{v.version_name}</span>)}
            {active.length > 3 && <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{active.length - 3}</span>}
          </div>
        )}
        {depr.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {depr.slice(0, 2).map(v => <span key={v.id} className="badge badge-gray" style={{ fontSize: '10px', textDecoration: 'line-through', opacity: 0.5 }}>{v.version_name}</span>)}
            {depr.length > 2 && <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{depr.length - 2}</span>}
          </div>
        )}

        <div
          style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}        >
          {product.official_url && (
            <a href={product.official_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#777', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
              🔗 {tx('officialSite')}
            </a>
          )}
          <button onClick={() => onCompare(product)} style={{
            fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
            border: isComparing ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.08)',
            color: isComparing ? '#00ff88' : '#777',
            background: isComparing ? 'rgba(0,255,136,0.1)' : 'transparent',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {isComparing ? tx('comparing') : tx('addCompare')}
          </button>
        </div>
      </div>

      {/* ── 상세 팝업 ── */}
      {detailOpen && (
        <>
          <div style={{ ...dimStyle, zIndex: 400 }} onClick={() => setDetailOpen(false)} />
          <div ref={el => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
            style={{ ...popupBase, zIndex: 401, border: '1px solid rgba(255,255,255,0.12)', ...detailStyle }}>
            <button onClick={() => setDetailOpen(false)}
              style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', color: '#555', fontSize: '22px', cursor: 'pointer' }}>×</button>

            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', marginBottom: '4px', paddingRight: '30px' }}>{product.product_name}</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>
              {product.manufacturer} · {ko ? (product.country_ko || product.country) : product.country}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
              {pricing    && <span className="badge badge-blue"   style={{ fontSize: '11px' }}>{pricing}</span>}
              {monthlyFee && monthlyFee > 0 && <span className="badge badge-gray" style={{ fontSize: '11px' }}>${monthlyFee}/mo</span>}
              {modality   && <span className="badge badge-gray"   style={{ fontSize: '11px' }}>{modality}</span>}
              {region     && <span className="badge badge-gray"   style={{ fontSize: '11px' }}>🌐 {region}</span>}
              {product.is_research_model && <span className="badge badge-orange" style={{ fontSize: '11px' }}>{tx('researchModel')}</span>}
              {hasSetup && instStyle && (
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                  background: instStyle.bg, border: `1px solid ${instStyle.border}`, color: instStyle.color }}>
                  {instStyle.icon} {product.install_type}
                </span>
              )}
            </div>

            {cleanDesc && (
              <div style={{ marginBottom: '16px' }}>
                <Label>{ko ? '전문가 분석' : 'Expert Analysis'}</Label>
                <div style={{ fontSize: '13px', color: '#bbb', lineHeight: 1.75, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px' }}>
                  {renderDesc(cleanDesc)}
                </div>
                <p style={{ fontSize: '10px', color: '#3b82f650', marginTop: '4px', fontFamily: 'monospace' }}>
                  💡 {ko ? '파란 단어 클릭 → 용어 해설' : 'Click blue words for glossary'}
                </p>
              </div>
            )}

            {hasSetup && (
              <div style={{ border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px', background: 'rgba(251,191,36,0.04)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {instStyle?.icon} {ko ? '설치 및 설정 가이드' : 'Setup & Installation Guide'}
                  {product.has_prompt_book && (
                    <span style={{ marginLeft: '6px', padding: '1px 7px', borderRadius: '4px', fontSize: '10px', background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}>
                      📘 {ko ? '프롬프트 북 있음' : 'Prompt Book'}
                    </span>
                  )}
                </div>
                {(product.sys_req_en || product.sys_req_kr) && (
                  <SetupBlock label={ko ? '시스템 요구사항' : 'System Requirements'}>
                    {ko ? (product.sys_req_kr || product.sys_req_en) : (product.sys_req_en || product.sys_req_kr)}
                  </SetupBlock>
                )}
                {(product.setup_guide_en || product.setup_guide_kr) && (
                  <SetupBlock label={ko ? '설치 가이드' : 'Setup Guide'} preWrap>
                    {renderLines(ko ? (product.setup_guide_kr || product.setup_guide_en) : (product.setup_guide_en || product.setup_guide_kr))}
                  </SetupBlock>
                )}
                {(product.env_config_en || product.env_config_kr) && (
                  <SetupBlock label={ko ? '환경 설정' : 'Environment Config'}>
                    {ko ? (product.env_config_kr || product.env_config_en) : (product.env_config_en || product.env_config_kr)}
                  </SetupBlock>
                )}
                {(product.expert_focus_en || product.expert_focus_kr) && (
                  <SetupBlock label={ko ? '전문가 활용 포인트' : 'Expert Focus'} accent>
                    {ko ? (product.expert_focus_kr || product.expert_focus_en) : (product.expert_focus_en || product.expert_focus_kr)}
                  </SetupBlock>
                )}
              </div>
            )}

            {(active.length > 0 || depr.length > 0) && (
              <div style={{ marginBottom: '14px' }}>
                <Label>{ko ? '버전' : 'Versions'}</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {active.map(v => <span key={v.id} className="badge badge-green" style={{ fontSize: '11px' }}>{v.version_name}</span>)}
                  {depr.map(v => <span key={v.id} className="badge badge-gray" style={{ fontSize: '11px', textDecoration: 'line-through', opacity: 0.5 }}>{v.version_name}</span>)}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {[
                { label: ko ? '서비스 유형' : 'Service Type', val: ko ? (product.service_type_ko || product.service_type) : product.service_type },
                { label: ko ? '요금제' : 'Pricing', val: ko ? (product.pricing_type_ko || product.pricing_type) : product.pricing_type },
                { label: ko ? '구독 플랜' : 'Plan', val: ko ? (product.subscription_ko || product.subscription_plan) : product.subscription_plan },
                { label: 'API Pricing', val: ko ? (product.api_pricing_ko || product.api_pricing) : product.api_pricing },
              ].filter(r => r.val && r.val !== 'Unknown').map(row => (
                <div key={row.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '7px', padding: '9px' }}>
                  <div style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', marginBottom: '3px' }}>{row.label}</div>
                  <div style={{ fontSize: '12px', color: '#bbb' }}>{row.val}</div>
                </div>
              ))}
            </div>

            {product.official_url && (
              <div>
                <Label>URL</Label>
                <a href={product.official_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00cc6a', fontSize: '12px', wordBreak: 'break-all', textDecoration: 'none' }}>
                  {product.official_url}
                </a>
              </div>
            )}

            {/* ── 프롬프트 가이드 버튼 그룹 ── */}
            {Object.keys(promptGroups).length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px' }}>
                <Label>{ko ? '📋 프롬프트 가이드' : '📋 Prompt Guide'}</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(promptGroups).map(([type, items]) => {
                    const meta = PROMPT_TYPE_MAP[type] || { ko: type, en: type, color: '#6b7280' }
                    return (
                      <button
                        key={type}
                        onClick={e => {
                          e.stopPropagation()
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setPromptStyle({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: Math.min(680, window.innerWidth - 24) })
                          setActivePrompt({ type, items, meta })
                          setPromptOpen(true)
                        }}
                        style={{
                          padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          border: `1px solid ${meta.color}55`, color: meta.color,
                          background: `${meta.color}18`, cursor: 'pointer',
                        }}
                      >
                        {ko ? meta.ko : meta.en}
                        <span style={{ marginLeft: '4px', opacity: 0.6 }}>({items.length})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 프롬프트 가이드 팝업 ── */}
      {promptOpen && activePrompt && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 600 }}
            onClick={() => { setPromptOpen(false); setActivePrompt(null) }} />
          <div
            ref={el => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
            style={{
              ...popupBase, zIndex: 601,
              border: `1px solid ${activePrompt.meta.color}44`,
              maxHeight: '82vh',
              ...promptStyle,
            }}
          >
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '10px', color: activePrompt.meta.color, fontFamily: 'monospace', marginBottom: '4px' }}>
                  📋 {ko ? '프롬프트 가이드' : 'Prompt Guide'} · {activePrompt.items.length}{ko ? '개' : ' items'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  {ko ? activePrompt.meta.ko : activePrompt.meta.en}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{product.product_name}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                    border: '1px solid rgba(0,255,136,0.3)', color: '#00cc6a',
                    background: 'rgba(0,255,136,0.08)', cursor: 'pointer',
                  }}
                >
                  🖨️ {ko ? 'PDF 출력' : 'Print PDF'}
                </button>
                <button onClick={() => { setPromptOpen(false); setActivePrompt(null) }}
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '14px' }} />

            {/* 프롬프트 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activePrompt.items.map((p: any, i: number) => (
                <div key={p.prompt_id} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {/* ID + 번호 */}
                  <div style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace', marginBottom: '8px' }}>
                    #{i+1} · {p.prompt_id}
                  </div>

                  {/* 프롬프트 본문 */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: activePrompt.meta.color, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {ko ? '프롬프트' : 'Prompt'}
                    </div>
                    <div style={{
                      fontSize: '12px', color: '#ddd', lineHeight: 1.7,
                      background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '10px',
                      whiteSpace: 'pre-wrap', fontFamily: 'monospace',
                    }}>
                      {ko ? (p.prompt_input_kr || p.prompt_input_en) : (p.prompt_input_en || p.prompt_input_kr)}
                    </div>
                  </div>

                  {/* 출력 팁 */}
                  {(p.output_tips_en || p.output_tips_kr) && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#555', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        {ko ? '출력 팁' : 'Output Tips'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6, padding: '0 4px',
                        borderLeft: `2px solid ${activePrompt.meta.color}55` }}>
                        {ko ? (p.output_tips_kr || p.output_tips_en) : (p.output_tips_en || p.output_tips_kr)}
                      </div>
                    </div>
                  )}

                  {/* 고급 파라미터 */}
                  {p.advanced_params && p.advanced_params !== '' && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        {ko ? '고급 파라미터' : 'Advanced Params'}
                      </div>
                      <div style={{
                        fontSize: '10px', color: '#666', fontFamily: 'monospace',
                        background: 'rgba(0,0,0,0.4)', borderRadius: '4px', padding: '6px 8px',
                      }}>
                        {p.advanced_params}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── 용어 해설 팝업 (첫번째 팝업 위에 표시) ── */}
      {glossaryTerm && (
        <>
          <div style={{ ...dimStyle, zIndex: 500 }} onClick={() => setGlossaryTerm(null)} />
          <div
            ref={el => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
            style={{
              ...popupBase, zIndex: 501,
              border: '1px solid rgba(0,255,136,0.3)',
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '480px',
              maxHeight: '70vh',
            }}>
            <button onClick={() => setGlossaryTerm(null)}
              style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>×</button>
            <div style={{ display: 'inline-block', marginBottom: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', fontSize: '10px', fontFamily: 'monospace', color: '#00ff88' }}>
              📖 {ko ? 'AI 용어 해설' : 'AI Glossary'} · {glossaryTerm.id}
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{glossaryTerm.en}</div>
            <div style={{ fontSize: '13px', color: '#00cc6a', marginBottom: '14px' }}>{glossaryTerm.kr}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '12px' }} />
            <Label>{ko ? '정의' : 'Definition'}</Label>
            <div style={{ fontSize: '13px', color: '#ccc', lineHeight: 1.7, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '11px', marginBottom: '10px' }}>
              {ko ? glossaryTerm.def_kr : glossaryTerm.def_en}
            </div>
            <Label>{ko ? 'English' : '한국어'}</Label>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.65, background: 'rgba(255,255,255,0.02)', borderRadius: '7px', padding: '9px', marginBottom: '8px' }}>
              {ko ? glossaryTerm.def_en : glossaryTerm.def_kr}
            </div>
            <div style={{ fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>Category: {glossaryTerm.code}</div>
          </div>
        </>
      )}
    </>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '10px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '7px', fontFamily: 'monospace' }}>{children}</div>
}

function SetupBlock({ label, children, preWrap, accent }: {
  label: string; children: React.ReactNode; preWrap?: boolean; accent?: boolean
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', marginBottom: '4px', fontFamily: 'monospace' }}>{label}</div>
      <div style={{
        fontSize: '12px', color: '#aaa', lineHeight: 1.65,
        background: accent ? 'transparent' : 'rgba(0,0,0,0.3)',
        borderRadius: '6px', padding: accent ? '0 0 0 10px' : '9px',
        whiteSpace: preWrap ? 'pre-wrap' : 'normal',
        borderLeft: accent ? '2px solid rgba(251,191,36,0.5)' : 'none',
      }}>
        {children}
      </div>
    </div>
  )
}
