'use client'
import { AIProduct } from '@/lib/supabase'

export default function ComparePanel({ products, onClose }: {
  products: AIProduct[]
  onClose: () => void
}) {
  const fields = [
    { label: '제조사',    key: 'manufacturer' },
    { label: '국가',      key: 'country' },
    { label: '대분류',    key: 'category_main' },
    { label: '세분류',    key: 'category_sub' },
    { label: '검증상태',  key: 'verification_status' },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '1100px', margin: '0 16px 16px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '24px',
          maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 className="font-display text-2xl" style={{ color: 'var(--accent)' }}>
            AI 비교 ({products.length}개)
          </h2>
          <button onClick={onClose} className="btn-ghost">✕ 닫기</button>
        </div>

        {/* 제품명 헤더 행 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
          gap: '12px', marginBottom: '16px',
          paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div />
          {products.map(p => (
            <div key={p.id} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{p.product_name}</div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{p.manufacturer} · {p.country}</div>
              {p.official_url && (
                <a href={p.official_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                  🔗 공식 사이트
                </a>
              )}
            </div>
          ))}
        </div>

        {/* 기본 필드 비교 */}
        {fields.map(f => (
          <div key={f.key} style={{
            display: 'grid',
            gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
            gap: '12px', padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
              {f.label}
            </div>
            {products.map(p => (
              <div key={p.id} style={{ fontSize: '12px', color: '#ccc', textAlign: 'center' }}>
                {String((p as any)[f.key] || '-').replace(/^\d+[-\.]\s*/, '').replace(/^\d+-\d+\.\s*/, '')}
              </div>
            ))}
          </div>
        ))}

        {/* 운영버전 수 비교 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
          gap: '12px', padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>운영버전 수</div>
          {products.map(p => {
            const active = p.versions?.filter(v => v.is_active) || []
            return (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <span className="font-display" style={{ color: 'var(--accent)', fontSize: '20px' }}>{active.length}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>개</span>
              </div>
            )
          })}
        </div>

        {/* 구버전 수 비교 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
          gap: '12px', padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>구(중단)버전</div>
          {products.map(p => {
            const depr = p.versions?.filter(v => !v.is_active) || []
            return (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '16px', color: '#666' }}>{depr.length}</span>
                <span style={{ fontSize: '11px', color: '#555' }}>개</span>
              </div>
            )
          })}
        </div>

        {/* 최신 운영버전 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
          gap: '12px', padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>최신 버전</div>
          {products.map(p => {
            const v1 = p.versions?.find(v => v.is_active && v.sort_order === 1)
            return (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <span className="badge badge-green" style={{ fontSize: '10px' }}>{v1?.version_name || '-'}</span>
              </div>
            )
          })}
        </div>

        {/* 전문가 분석 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
          gap: '12px', padding: '12px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>전문가 분석</div>
          {products.map(p => (
            <div key={p.id} style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.6 }}>
              {p.description || '-'}
            </div>
          ))}
        </div>

        {/* 연구모델 여부 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${products.length}, 1fr)`,
          gap: '12px', padding: '10px 0',
        }}>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>구분</div>
          {products.map(p => (
            <div key={p.id} style={{ textAlign: 'center' }}>
              {p.is_research_model
                ? <span className="badge badge-orange" style={{ fontSize: '10px' }}>연구모델</span>
                : <span className="badge badge-green" style={{ fontSize: '10px' }}>서비스 중</span>
              }
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
