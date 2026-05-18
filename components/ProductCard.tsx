// components/ProductCard.tsx  v2
// 개선사항:
// 1) 카드 클릭 → 팝업이 카드 위치 기준으로 화면에 맞게 표시 (스크롤 위치 고려)
// 2) 한글 텍스트 내 영어 단어도 용어 링크 → 정의는 현재 언어로 표시
// 3) 약어(LLM, RAG 등) 자동 링크

'use client'
import { AIProduct } from '@/lib/supabase'
import { useState, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import { GlossaryTerm } from '@/lib/glossaryData'
import { parseTextWithGlossary } from '@/lib/useGlossary'
import GlossaryModal from './GlossaryModal'

export default function ProductCard({ product, isComparing, onCompare }: {
  product: AIProduct
  isComparing: boolean
  onCompare: (p: AIProduct) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [showDetail, setShowDetail]     = useState(false)
  const [detailStyle, setDetailStyle]   = useState<React.CSSProperties>({})
  const [glossaryTerm, setGlossaryTerm] = useState<GlossaryTerm | null>(null)
  const { lang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key
  const ko = lang === 'ko'

  const active = product.versions?.filter(v => v.is_active) || []
  const depr   = product.versions?.filter(v => !v.is_active) || []

  const desc = ko
    ? (product.description_ko || product.description || '')
    : (product.description || '')
  const cleanDesc = desc && desc !== 'nan' ? desc : ''

  const subLabel = ko
    ? (product.category_sub_ko || product.category_sub || '').replace(/^\d+-\d+\.\s/, '')
    : (product.category_sub || '').replace(/^\d+-\d+\.\s/, '')

  const pricing    = product.pricing_type || ''
  const modality   = ko ? (product.modality_ko || product.modality || '') : (product.modality || '')
  const region     = ko ? (product.service_region_ko || product.service_region || '') : (product.service_region || '')
  const monthlyFee = product.monthly_fee_usd

  // 카드 클릭 → 팝업 위치를 카드 근처로 계산
  function handleCardClick() {
    if (!cardRef.current) { setShowDetail(true); return }

    const rect = cardRef.current.getBoundingClientRect()
    const popupW = 620
    const popupH = 520  // 예상 최대 높이
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 10

    // 가로: 카드 오른쪽에 공간이 있으면 오른쪽, 아니면 왼쪽, 아니면 가운데
    let left: number
    if (rect.right + popupW + margin <= vw) {
      left = rect.right + margin
    } else if (rect.left - popupW - margin >= 0) {
      left = rect.left - popupW - margin
    } else {
      left = Math.max(margin, (vw - popupW) / 2)
    }

    // 세로: 카드 상단 기준, 화면 밖으로 나가면 위로 올림
    let top = rect.top
    if (top + popupH > vh - margin) {
      top = Math.max(margin, vh - popupH - margin)
    }
    top = Math.max(margin, top)

    setDetailStyle({ position: 'fixed', top, left, width: popupW })
    setShowDetail(true)
  }

  // 전문가 분석 텍스트 → 용어 링크 렌더링
  function renderDesc(text: string) {
    const segments = parseTextWithGlossary(text)
    return segments.map((seg, i) =>
      seg.type === 'text' ? (
        <span key={i}>{seg.content}</span>
      ) : (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); setGlossaryTerm(seg.term) }}
          title={ko ? seg.term.kr : seg.term.en}
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {seg.content}
        </span>
      )
    )
  }

  return (
    <>
      {/* ── 카드 ── */}
      <div
        ref={cardRef}
        className="card p-4 flex flex-col gap-2"
        style={{
          cursor: 'pointer',
          ...(isComparing ? { borderColor: 'var(--accent)', background: 'rgba(0,255,136,0.05)' } : {}),
        }}
        onClick={handleCardClick}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '13px', lineHeight: 1.3 }}>
              {product.product_name}
            </h3>
            <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {product.manufacturer} · {ko ? (product.country_ko || product.country) : product.country}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
            {product.is_research_model && (
              <span className="badge badge-orange" style={{ fontSize: '10px' }}>{tx('researchModel')}</span>
            )}
            <span className="badge badge-gray" style={{ fontSize: '10px', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subLabel}
            </span>
          </div>
        </div>

        {/* 배지 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {pricing && <span className="badge badge-blue" style={{ fontSize: '10px' }}>{pricing}</span>}
          {monthlyFee && monthlyFee > 0 && (
            <span className="badge badge-gray" style={{ fontSize: '10px' }}>${monthlyFee}/mo</span>
          )}
          {modality && <span className="badge badge-gray" style={{ fontSize: '10px' }}>{modality}</span>}
          {region && <span className="badge badge-gray" style={{ fontSize: '10px' }}>🌐 {region}</span>}
        </div>

        {/* 설명 2줄 */}
        {cleanDesc && (
          <p style={{
            fontSize: '12px', color: '#999', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {cleanDesc}
          </p>
        )}

        {/* 버전 */}
        {active.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {active.slice(0, 3).map(v => (
              <span key={v.id} className="badge badge-green" style={{ fontSize: '10px' }}>{v.version_name}</span>
            ))}
            {active.length > 3 && <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{active.length - 3}</span>}
          </div>
        )}
        {depr.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {depr.slice(0, 2).map(v => (
              <span key={v.id} className="badge badge-gray" style={{ fontSize: '10px', textDecoration: 'line-through', opacity: 0.5 }}>{v.version_name}</span>
            ))}
            {depr.length > 2 && <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{depr.length - 2}</span>}
          </div>
        )}

        {/* 액션 버튼 */}
        <div
          style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {product.official_url && (
            <a
              href={product.official_url} target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, textAlign: 'center', fontSize: '11px', color: '#777',
                padding: '6px 8px', borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none',
              }}
            >
              🔗 {tx('officialSite')}
            </a>
          )}
          <button
            onClick={() => onCompare(product)}
            style={{
              fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
              border: isComparing ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.08)',
              color: isComparing ? '#00ff88' : '#777',
              background: isComparing ? 'rgba(0,255,136,0.1)' : 'transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {isComparing ? tx('comparing') : tx('addCompare')}
          </button>
        </div>
      </div>

      {/* ── 상세 팝업 (카드 위치 기준) ── */}
      {showDetail && (
        <>
          {/* 배경 딤 */}
          <div
            onClick={() => setShowDetail(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)' }}
          />
          {/* 팝업 본체 */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              zIndex: 401,
              background: '#111318',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '22px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              ...detailStyle,
            }}
          >
            {/* 닫기 */}
            <button
              onClick={() => setShowDetail(false)}
              style={{
                position: 'absolute', top: '14px', right: '16px',
                background: 'none', border: 'none',
                color: '#555', fontSize: '22px', cursor: 'pointer', lineHeight: 1,
              }}
            >×</button>

            {/* 제품명 */}
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', marginBottom: '4px', paddingRight: '30px' }}>
              {product.product_name}
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>
              {product.manufacturer} · {ko ? (product.country_ko || product.country) : product.country}
            </p>

            {/* 배지 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
              {pricing && <span className="badge badge-blue" style={{ fontSize: '11px' }}>{pricing}</span>}
              {monthlyFee && monthlyFee > 0 && (
                <span className="badge badge-gray" style={{ fontSize: '11px' }}>${monthlyFee}/mo</span>
              )}
              {modality && <span className="badge badge-gray" style={{ fontSize: '11px' }}>{modality}</span>}
              {region && <span className="badge badge-gray" style={{ fontSize: '11px' }}>🌐 {region}</span>}
              {product.is_research_model && (
                <span className="badge badge-orange" style={{ fontSize: '11px' }}>{tx('researchModel')}</span>
              )}
            </div>

            {/* 전문가 분석 (용어 자동 링크) */}
            {cleanDesc && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: '#555',
                  textTransform: 'uppercase', letterSpacing: '0.7px',
                  marginBottom: '8px', fontFamily: 'monospace',
                }}>
                  {ko ? '전문가 분석' : 'Expert Analysis'}
                </div>
                <div style={{
                  fontSize: '13px', color: '#bbb', lineHeight: 1.75,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px', padding: '12px',
                }}>
                  {renderDesc(cleanDesc)}
                </div>
                <p style={{ fontSize: '10px', color: '#3b82f660', marginTop: '5px', fontFamily: 'monospace' }}>
                  💡 {ko ? '파란 단어 클릭 → 용어 해설' : 'Click blue words for glossary'}
                </p>
              </div>
            )}

            {/* 버전 */}
            {(active.length > 0 || depr.length > 0) && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '7px', fontFamily: 'monospace' }}>
                  {ko ? '버전' : 'Versions'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {active.map(v => <span key={v.id} className="badge badge-green" style={{ fontSize: '11px' }}>{v.version_name}</span>)}
                  {depr.map(v => <span key={v.id} className="badge badge-gray" style={{ fontSize: '11px', textDecoration: 'line-through', opacity: 0.5 }}>{v.version_name}</span>)}
                </div>
              </div>
            )}

            {/* 세부 정보 */}
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

            {/* 공식 URL */}
            {product.official_url && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px', fontFamily: 'monospace' }}>
                  URL
                </div>
                <a
                  href={product.official_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00cc6a', fontSize: '12px', wordBreak: 'break-all', textDecoration: 'none' }}
                >
                  {product.official_url}
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 용어 해설 팝업 ── */}
      {glossaryTerm && (
        <GlossaryModal
          term={glossaryTerm}
          onClose={() => setGlossaryTerm(null)}
        />
      )}
    </>
  )
}
