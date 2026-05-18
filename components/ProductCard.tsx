// components/ProductCard.tsx  ← 기존 파일 교체
'use client'
import { AIProduct } from '@/lib/supabase'
import { useState } from 'react'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import { GlossaryTerm } from '@/lib/glossaryData'
import GlossaryText from './GlossaryText'
import GlossaryModal from './GlossaryModal'

export default function ProductCard({ product, isComparing, onCompare }: {
  product: AIProduct
  isComparing: boolean
  onCompare: (p: AIProduct) => void
}) {
  const [showDetail, setShowDetail]   = useState(false)
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

  return (
    <>
      {/* ── 카드 ── */}
      <div
        className="card p-4 flex flex-col gap-2"
        style={{
          cursor: 'pointer',
          ...(isComparing ? { borderColor: 'var(--accent)', background: 'rgba(0,255,136,0.05)' } : {}),
        }}
        onClick={() => setShowDetail(true)}
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

        {/* 설명 (카드에서는 2줄만) */}
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

        {/* 액션 */}
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

      {/* ── 상세 팝업 ── */}
      {showDetail && (
        <div
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111318',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              width: '100%', maxWidth: '620px',
              maxHeight: '88vh', overflowY: 'auto',
              padding: '24px', position: 'relative',
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
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '4px', paddingRight: '30px' }}>
              {product.product_name}
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>
              {product.manufacturer} · {ko ? (product.country_ko || product.country) : product.country}
            </p>

            {/* 배지 묶음 */}
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

            {/* 전문가 분석 (용어 링크 포함) */}
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
                  {/* ★ 핵심: GlossaryText로 용어 자동 링크 ★ */}
                  <GlossaryText
                    text={cleanDesc}
                    onTermClick={term => setGlossaryTerm(term)}
                  />
                </div>
                <p style={{ fontSize: '10px', color: '#444', marginTop: '5px', fontFamily: 'monospace' }}>
                  💡 {ko ? '파란 단어를 클릭하면 용어 해설을 볼 수 있어요' : 'Click blue words to see glossary definitions'}
                </p>
              </div>
            )}

            {/* 버전 */}
            {(active.length > 0 || depr.length > 0) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '8px', fontFamily: 'monospace' }}>
                  {ko ? '버전 정보' : 'Versions'}
                </div>
                {active.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {active.map(v => (
                      <span key={v.id} className="badge badge-green" style={{ fontSize: '11px' }}>{v.version_name}</span>
                    ))}
                  </div>
                )}
                {depr.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {depr.map(v => (
                      <span key={v.id} className="badge badge-gray" style={{ fontSize: '11px', textDecoration: 'line-through', opacity: 0.5 }}>{v.version_name}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 세부 정보 그리드 */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px', marginBottom: '16px',
            }}>
              {[
                { label: ko ? '서비스 유형' : 'Service Type', val: ko ? (product.service_type_ko || product.service_type) : product.service_type },
                { label: ko ? '요금제' : 'Pricing', val: ko ? (product.pricing_type_ko || product.pricing_type) : product.pricing_type },
                { label: ko ? '구독 플랜' : 'Plan', val: ko ? (product.subscription_ko || product.subscription_plan) : product.subscription_plan },
                { label: 'API Pricing', val: ko ? (product.api_pricing_ko || product.api_pricing) : product.api_pricing },
              ].filter(r => r.val && r.val !== 'Unknown' && r.val !== '정보 없음').map(row => (
                <div key={row.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', marginBottom: '4px' }}>{row.label}</div>
                  <div style={{ fontSize: '12px', color: '#bbb' }}>{row.val}</div>
                </div>
              ))}
            </div>

            {/* 공식 URL */}
            {product.official_url && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px', fontFamily: 'monospace' }}>
                  {ko ? '공식 URL' : 'Official URL'}
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
        </div>
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
