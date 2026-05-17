'use client'
import { AIProduct } from '@/lib/supabase'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'

export default function ComparePanel({ products, onClose }: {
  products: AIProduct[]
  onClose: () => void
}) {
  const { lang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key
  const ko = lang === 'ko'

  const fields = [
    { label: tx('manufacturer'),   key: 'manufacturer' },
    { label: tx('country'),        key: ko ? 'country_ko' : 'country' },
    { label: tx('category'),       key: ko ? 'category_main_ko' : 'category_main' },
    { label: tx('subcategory'),    key: ko ? 'category_sub_ko' : 'category_sub' },
    { label: 'Service Type',       key: ko ? 'service_type_ko' : 'service_type' },
    { label: 'Modality',           key: ko ? 'modality_ko' : 'modality' },
    { label: 'Service Region',     key: ko ? 'service_region_ko' : 'service_region' },
    { label: 'Pricing',            key: ko ? 'pricing_type_ko' : 'pricing_type' },
    { label: 'Monthly Fee',        key: 'monthly_fee_usd' },
    { label: 'API Pricing',        key: ko ? 'api_pricing_ko' : 'api_pricing' },
    { label: 'Accessibility',      key: ko ? 'accessibility_ko' : 'service_accessibility' },
    { label: tx('verification'),   key: ko ? 'verification_ko' : 'verification_status' },
    { label: tx('activeVersions'), key: '__active_versions__' },
    { label: tx('deprVersions'),   key: '__depr_versions__' },
    { label: tx('expertAnalysis'), key: '__description__' },
    { label: tx('status'),         key: '__status__' },
  ]

  function getCellValue(p: AIProduct, key: string): string {
    if (key === '__active_versions__') {
      const vs = p.versions?.filter(v => v.is_active) || []
      return vs.length ? vs.map(v => v.version_name).join(', ') : '-'
    }
    if (key === '__depr_versions__') {
      const vs = p.versions?.filter(v => !v.is_active) || []
      return vs.length ? vs.map(v => v.version_name).join(', ') : '-'
    }
    if (key === '__description__') {
      return (ko ? (p.description_ko || p.description) : p.description) || '-'
    }
    if (key === '__status__') {
      return p.is_research_model ? (ko ? '연구모델' : 'Research') : (ko ? '서비스 중' : 'In Service')
    }
    if (key === 'monthly_fee_usd') {
      const v = (p as any)[key]
      return v && v > 0 ? `$${v}/mo` : 'Free'
    }
    const v = (p as any)[key]
    return String(v || '-').replace(/^\d+[-\.]\s*/, '').replace(/^\d+-\d+\.\s*/, '')
  }

  function handlePrint() {
    const n = products.length

    // ── 제품 수에 따라 레이아웃 파라미터 계산 ──────────
    // A4: 가로 297mm, 세로 210mm (landscape) / 가로 210mm, 세로 297mm (portrait)
    // 여백 8mm × 2 = 16mm 제외
    // 라벨열 고정폭
    const landscape  = n >= 4
    const pageW      = landscape ? 281 : 194   // mm (margin 제외)
    const labelMm    = landscape ? (n >= 8 ? 22 : 28) : 35
    const dataMm     = (pageW - labelMm) / n
    const fs         = n <= 3 ? 9 : n <= 6 ? 8 : 7   // pt
    const headerFs   = n <= 3 ? 9 : n <= 6 ? 8 : 7

    const headerRow = products.map(p => `
      <th style="width:${dataMm}mm;word-break:break-word;padding:4px 3px">
        <div style="font-weight:700;font-size:${headerFs}pt">${p.product_name}</div>
        <div style="font-weight:400;font-size:${Math.max(fs-1,6)}pt;opacity:0.8">${p.manufacturer}</div>
        ${p.official_url ? `<div style="font-size:6pt"><a href="${p.official_url}">${p.official_url}</a></div>` : ''}
      </th>
    `).join('')

    const dataRows = fields.map(f => {
      const isDesc = f.key === '__description__'
      return `
        <tr>
          <td style="width:${labelMm}mm;font-weight:600;background:#f0f0f0;font-size:${fs}pt;white-space:${isDesc?'normal':'nowrap'};vertical-align:middle">${f.label}</td>
          ${products.map(p => `
            <td style="font-size:${fs}pt;text-align:center;vertical-align:${isDesc?'top':'middle'};padding:3px 4px;word-break:break-word">${getCellValue(p, f.key)}</td>
          `).join('')}
        </tr>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>AI MAP — Compare Report</title>
<style>
  /* Chrome에서 @page landscape 강제 적용 */
  @page {
    size: A4 ${landscape ? 'landscape' : 'portrait'};
    margin: 8mm;
  }
  html, body {
    width: ${landscape ? '297mm' : '210mm'};
    height: ${landscape ? '210mm' : '297mm'};
    margin: 0;
    padding: 0;
  }
  body {
    font-family: Arial, sans-serif;
    font-size: ${fs}pt;
    color: #111;
    background: #fff;
    padding: 8mm;
    box-sizing: border-box;
  }
  h2 { font-size: 12pt; color: #007744; margin-bottom: 2px; }
  .subtitle { font-size: 6.5pt; color: #888; margin-bottom: 8px; }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; }
  th {
    background: #1a3a2a;
    color: #fff;
    border: 1px solid #999;
    text-align: center;
    vertical-align: top;
  }
  td {
    border: 1px solid #ddd;
    word-break: break-word;
  }
  tr:nth-child(even) td { background: #f9f9f9; }
  tr:nth-child(even) td:first-child { background: #ebebeb; }
  .footer { margin-top: 6px; font-size: 6pt; color: #bbb; text-align: center; border-top: 1px solid #ddd; padding-top: 4px; }
  a { color: #0055aa; }
</style>
</head>
<body>
<h2>AI MAP — ${tx('compareTitle')} (${n})</h2>
<div class="subtitle">GAIT 69: Global AI Index Taxonomy · DOI: 10.5281/zenodo.20248631 · © 2025 DO HUN, KIM · ${new Date().toLocaleDateString()}</div>
<table>
  <thead>
    <tr>
      <th style="width:${labelMm}mm;background:#2a4a3a"></th>
      ${headerRow}
    </tr>
  </thead>
  <tbody>${dataRows}</tbody>
</table>
<div class="footer">ai-engine-app.vercel.app</div>
</body>
</html>`

    const win = window.open('', '_blank', `width=${landscape?1122:794},height=${landscape?794:1122}`)
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    // Chrome이 @page를 인식할 시간을 충분히 줌
    setTimeout(() => {
      win.print()
      setTimeout(() => win.close(), 1000)
    }, 800)
  }

  const gridCols = `150px repeat(${products.length}, minmax(90px, 1fr))`

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '1280px', margin: '0 12px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 className="font-display text-2xl" style={{ color: 'var(--accent)' }}>
              {tx('compareTitle')} ({products.length}/10)
            </h2>
            <p style={{ fontSize: '11px', color: '#555', marginTop: '2px', fontFamily: 'monospace' }}>
              GAIT 69 · DOI: 10.5281/zenodo.20248631 · © 2025 DO HUN, KIM
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>
              {products.length >= 4 ? '📄 A4 가로 자동' : '📄 A4 세로 자동'}
            </span>
            <button onClick={handlePrint} className="btn-ghost"
              style={{ border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: '13px' }}>
              {tx('printBtn')}
            </button>
            <button onClick={onClose} className="btn-ghost">{tx('closeBtn')}</button>
          </div>
        </div>

        {/* 제품명 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div />
          {products.map(p => (
            <div key={p.id} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '12px', lineHeight: 1.3 }}>{p.product_name}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{p.manufacturer}</div>
              {p.official_url && (
                <a href={p.official_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                  🔗 {tx('officialSite')}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* 데이터 행 */}
        {fields.map(f => {
          const isDesc = f.key === '__description__'
          return (
            <div key={f.key} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: isDesc ? 'flex-start' : 'center' }}>
                {f.label}
              </div>
              {products.map(p => {
                const val = getCellValue(p, f.key)
                if (f.key === '__active_versions__') {
                  const vs = p.versions?.filter(v => v.is_active) || []
                  return (
                    <div key={p.id} style={{ textAlign: 'center' }}>
                      <span className="font-display" style={{ color: 'var(--accent)', fontSize: '18px' }}>{vs.length}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center', marginTop: '4px' }}>
                        {vs.slice(0, 2).map(v => <span key={v.id} className="badge badge-green" style={{ fontSize: '9px' }}>{v.version_name}</span>)}
                        {vs.length > 2 && <span className="badge badge-gray" style={{ fontSize: '9px' }}>+{vs.length - 2}</span>}
                      </div>
                    </div>
                  )
                }
                if (f.key === '__depr_versions__') {
                  const vs = p.versions?.filter(v => !v.is_active) || []
                  return <div key={p.id} style={{ textAlign: 'center', fontSize: '14px', color: '#555' }}>{vs.length}</div>
                }
                if (f.key === '__status__') {
                  return (
                    <div key={p.id} style={{ textAlign: 'center' }}>
                      {p.is_research_model
                        ? <span className="badge badge-orange" style={{ fontSize: '10px' }}>{tx('researchModel')}</span>
                        : <span className="badge badge-green" style={{ fontSize: '10px' }}>{tx('inService')}</span>}
                    </div>
                  )
                }
                return (
                  <div key={p.id} style={{ fontSize: '11px', color: isDesc ? '#aaa' : '#ccc', textAlign: isDesc ? 'left' : 'center', lineHeight: 1.5 }}>
                    {val}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
