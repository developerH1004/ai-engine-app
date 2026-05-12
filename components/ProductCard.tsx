'use client'
import { AIProduct } from '@/lib/supabase'
import { useState } from 'react'

export default function ProductCard({ product, isComparing, onCompare }: {
  product: AIProduct
  isComparing: boolean
  onCompare: (p: AIProduct) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const active = product.versions?.filter(v => v.is_active) || []
  const depr   = product.versions?.filter(v => !v.is_active) || []
  const desc   = product.description && product.description !== 'nan' ? product.description : ''

  return (
    <div
      className="card p-4 flex flex-col gap-2"
      style={isComparing ? { borderColor: 'var(--accent)', background: 'rgba(0,255,136,0.05)' } : {}}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '13px', lineHeight: 1.3 }}>
            {product.product_name}
          </h3>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
            {product.manufacturer} · {product.country}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
          {product.is_research_model && (
            <span className="badge badge-orange" style={{ fontSize: '10px' }}>연구모델</span>
          )}
          <span className="badge badge-gray" style={{ fontSize: '10px', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(product.category_sub || '').replace(/^\d+-\d+\.\s/, '')}
          </span>
        </div>
      </div>

      {/* 설명 */}
      {desc && (
        <div>
          <p style={{
            fontSize: '12px',
            color: '#999',
            lineHeight: 1.6,
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? undefined : 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: expanded ? 'visible' : 'hidden',
          }}>
            {desc}
          </p>
          {desc.length > 60 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ fontSize: '11px', color: 'var(--accent-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px' }}
            >
              {expanded ? '접기 ▲' : '더보기 ▼'}
            </button>
          )}
        </div>
      )}

      {/* 운영버전 */}
      {active.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {active.slice(0, 3).map(v => (
            <span key={v.id} className="badge badge-green" style={{ fontSize: '10px' }}>{v.version_name}</span>
          ))}
          {active.length > 3 && (
            <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{active.length - 3}</span>
          )}
        </div>
      )}

      {/* 구버전 */}
      {depr.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {depr.slice(0, 2).map(v => (
            <span key={v.id} className="badge badge-gray" style={{ fontSize: '10px', textDecoration: 'line-through', opacity: 0.5 }}>{v.version_name}</span>
          ))}
          {depr.length > 2 && (
            <span className="badge badge-gray" style={{ fontSize: '10px' }}>+{depr.length - 2}</span>
          )}
        </div>
      )}

      {/* 액션 */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
        {product.official_url && (
          <a
            href={product.official_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '11px',
              color: '#777',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none',
            }}
          >
            🔗 공식 사이트
          </a>
        )}
        <button
          onClick={() => onCompare(product)}
          style={{
            fontSize: '11px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: isComparing ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.08)',
            color: isComparing ? '#00ff88' : '#777',
            background: isComparing ? 'rgba(0,255,136,0.1)' : 'transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isComparing ? '✓ 비교중' : '+ 비교'}
        </button>
      </div>
    </div>
  )
}
