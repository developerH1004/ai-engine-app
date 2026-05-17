'use client'
import { AIProduct } from '@/lib/supabase'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'

const MAX_COMPARE = 10

export default function ComparePanel({ products, onClose }: {
  products: AIProduct[]
  onClose: () => void
}) {
  const { lang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key

  const fields = [
    { label: tx('manufacturer'),  key: 'manufacturer' },
    { label: tx('country'),       key: 'country' },
    { label: tx('category'),      key: 'category_main' },
    { label: tx('subcategory'),   key: 'category_sub' },
    { label: tx('verification'),  key: 'verification_status' },
  ]

  // PDF 출력
  function handlePrint() {
    window.print()
  }

  const gridCols = `160px repeat(${products.length}, minmax(120px, 1fr))`

  return (
    <>
      {/* 인쇄 숨김 오버레이 */}
      <div
        className="no-print"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          id="compare-print-area"
          style={{
            width: '100%', maxWidth: '1200px', margin: '0 16px 16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '24px',
            maxHeight: '90vh', overflowY: 'auto',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 className="font-display text-2xl" style={{ color: 'var(--accent)' }}>
                {tx('compareTitle')} ({products.length}/{MAX_COMPARE})
              </h2>
              <p style={{ fontSize: '11px', color: '#555', marginTop: '2px', fontFamily: 'monospace' }}>
                GAIT 69 · DOI: 10.5281/zenodo.20248631 · © 2025 DO HUN, KIM
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrint}
                className="btn-ghost"
                style={{ border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: '13px' }}
              >
                {tx('printBtn')}
              </button>
              <button onClick={onClose} className="btn-ghost">{tx('closeBtn')}</button>
            </div>
          </div>

          {/* 제품명 헤더 행 */}
          <div style={{
            display: 'grid', gridTemplateColumns: gridCols,
            gap: '10px', marginBottom: '12px',
            paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div />
            {products.map(p => (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '12px', lineHeight: 1.3 }}>{p.product_name}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{p.manufacturer} · {p.country}</div>
                {p.official_url && (
                  <a href={p.official_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                    🔗 {tx('officialSite')}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* 기본 필드 */}
          {fields.map(f => (
            <div key={f.key} style={{
              display: 'grid', gridTemplateColumns: gridCols,
              gap: '10px', padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                {f.label}
              </div>
              {products.map(p => (
                <div key={p.id} style={{ fontSize: '11px', color: '#ccc', textAlign: 'center' }}>
                  {String((p as any)[f.key] || '-').replace(/^\d+[-\.]\s*/, '').replace(/^\d+-\d+\.\s*/, '')}
                </div>
              ))}
            </div>
          ))}

          {/* 운영버전 수 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{tx('activeVersions')}</div>
            {products.map(p => {
              const active = p.versions?.filter(v => v.is_active) || []
              return (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <span className="font-display" style={{ color: 'var(--accent)', fontSize: '18px' }}>{active.length}</span>
                </div>
              )
            })}
          </div>

          {/* 구버전 수 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{tx('deprVersions')}</div>
            {products.map(p => {
              const depr = p.versions?.filter(v => !v.is_active) || []
              return (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>{depr.length}</span>
                </div>
              )
            })}
          </div>

          {/* 최신 버전 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{tx('latestVersion')}</div>
            {products.map(p => {
              const v1 = p.versions?.find(v => v.is_active && v.sort_order === 1)
              return (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: '10px' }}>{v1?.version_name || '-'}</span>
                </div>
              )
            })}
          </div>

          {/* 전문가 분析 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>{tx('expertAnalysis')}</div>
            {products.map(p => (
              <div key={p.id} style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.6 }}>
                {p.description || '-'}
              </div>
            ))}
          </div>

          {/* 구분 */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '8px 0' }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{tx('status')}</div>
            {products.map(p => (
              <div key={p.id} style={{ textAlign: 'center' }}>
                {p.is_research_model
                  ? <span className="badge badge-orange" style={{ fontSize: '10px' }}>{tx('researchModel')}</span>
                  : <span className="badge badge-green" style={{ fontSize: '10px' }}>{tx('inService')}</span>
                }
              </div>
            ))}
          </div>

          {/* 인쇄용 푸터 */}
          <div className="print-only" style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #333', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#888' }}>
              GAIT 69: Global AI Index Taxonomy · DOI: 10.5281/zenodo.20248631 · © 2025 DO HUN, KIM · ai-engine-app.vercel.app
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
