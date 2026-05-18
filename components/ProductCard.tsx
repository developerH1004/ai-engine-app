'use client'
import { AIProduct } from '@/lib/supabase'
import { useState, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import { GlossaryTerm } from '@/lib/glossaryData'
import { parseTextWithGlossary } from '@/lib/useGlossary'

/**
 * 팝업 위치 계산
 * clientY/clientX: 마우스 클릭 좌표 (뷰포트 기준, 스크롤 무관)
 */
function calcPopupPos(
  clientX: number,
  clientY: number,
  popupW: number,
  popupH: number,
): React.CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const m  = 12

  // 세로: 클릭 아래 → 공간 없으면 위
  let top = clientY + 16
  if (top + popupH > vh - m) {
    top = clientY - popupH - 8
  }
  top = Math.max(m, Math.min(top, vh - popupH - m))

  // 가로: 클릭 왼쪽 정렬, 오른쪽 잘리면 조정
  let left = clientX
  if (left + popupW + m > vw) {
    left = Math.max(m, vw - popupW - m)
  }
  left = Math.max(m, left)

  return { position: 'fixed', top, left, width: popupW }
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
  const [detailOpen,    setDetailOpen]    = useState(false)
  const [detailStyle,   setDetailStyle]   = useState<React.CSSProperties>({})
  const [glossaryTerm,  setGlossaryTerm]  = useState<GlossaryTerm | null>(null)
  const [glossaryStyle, setGlossaryStyle] = useState<React.CSSProperties>({})

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

  // 카드 클릭 → 마우스 좌표 기준 팝업
  function openDetail(e: React.MouseEvent) {
    setDetailStyle(calcPopupPos(e.clientX, e.clientY, 620, 560))
    setDetailOpen(true)
  }

  // 용어 클릭 → 마우스 좌표 기준 팝업
  function openGlossary(term: GlossaryTerm, e: React.MouseEvent) {
    e.stopPropagation()
    setGlossaryStyle(calcPopupPos(e.clientX, e.clientY, 480, 400))
    setGlossaryTerm(term)
  }

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
          onMouseDown={e => openGlossary(seg.term, e as React.MouseEvent)}
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
        className="card p-4 flex flex-col gap-2"
        style={{ cursor: 'pointer', ...(isComparing ? { borderColor: 'var(--accent)', background: 'rgba(0,255,136,0.05)' } : {}) }}
        onClick={openDetail}
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
          onClick={e => e.stopPropagation()}
        >
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
          <div style={{ ...popupBase, zIndex: 401, border: '1px solid rgba(255,255,255,0.12)', ...detailStyle }}>
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
          </div>
        </>
      )}

      {/* ── 용어 해설 팝업 ── */}
      {glossaryTerm && (
        <>
          <div style={{ ...dimStyle, zIndex: 500 }} onClick={() => setGlossaryTerm(null)} />
          <div style={{ ...popupBase, zIndex: 501, border: '1px solid rgba(0,255,136,0.2)', ...glossaryStyle }}>
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
