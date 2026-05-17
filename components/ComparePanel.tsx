'use client'
import { useRef } from 'react'
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
      return vs.length ? `${vs.length}개: ${vs.map(v => v.version_name).join(', ')}` : '-'
    }
    if (key === '__depr_versions__') {
      const vs = p.versions?.filter(v => !v.is_active) || []
      return vs.length ? `${vs.length}개: ${vs.map(v => v.version_name).join(', ')}` : '-'
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
    // 제품 수에 따라 레이아웃 결정
    const isLandscape = n >= 4
    const colWidth = n <= 2 ? '220px'
                   : n <= 4 ? '160px'
                   : n <= 6 ? '120px'
                   : n <= 8 ? '100px'
                   : '85px'
    const fontSize  = n <= 4 ? '9pt' : n <= 7 ? '8pt' : '7pt'
    const labelW    = n >= 8 ? '80px' : '110px'

    const win = window.open('', '_blank', 'width=1200,height=900')
    if (!win) return

    const headerRow = products.map(p => `
      <th>
        <div style="font-weight:700">${p.product_name}</div>
        <div style="font-weight:400;font-size:${fontSize};opacity:0.7">${p.manufacturer}</div>
        ${p.official_url ? `<div style="font-size:7pt"><a href="${p.official_url}">${p.official_url}</a></div>` : ''}
      </th>
    `).join('')

    const dataRows = fields.map(f => `
      <tr>
        <td style="width:${labelW};font-weight:600;background:#f5f5f5;white-space:${f.key==='__description__'?'normal':'nowrap'}">${f.label}</td>
        ${products.map(p => `
          <td style="text-align:center;vertical-align:${f.key==='__description__'?'top':'middle'};max-width:${colWidth}">${getCellValue(p, f.key)}</td>
        `).join('')}
      </tr>
    `).join('')

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI MAP — Compare Report</title>
  <style>
    @page {
      size: A4 ${isLandscape ? 'landscape' : 'portrait'};
      margin: 10mm 8mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: ${fontSize};
      color: #111;
      background: #fff;
    }
    h2 { font-size: 14pt; color: #007744; margin-bottom: 3px; }
    .subtitle { font-size: 7pt; color: #888; margin-bottom: 10px; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th {
      background: #1a3a2a;
      color: #fff;
      font-size: ${fontSize};
      padding: 5px 6px;
      border: 1px solid #ccc;
      text-align: center;
      word-break: break-word;
    }
    td {
      font-size: ${fontSize};
      padding: 4px 5px;
      border: 1px solid #e0e0e0;
      vertical-align: middle;
      word-break: break-word;
    }
    tr:nth-child(even) td { background: #fafafa; }
    tr:nth-child(even) td:first-child { background: #eeeeee; }
    .footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #ddd;
      font-size: 7pt;
      color: #aaa;
      text-align: center;
    }
    a { color: #0055aa; }
  </style>
</head>
<body>
  <h2>AI MAP — ${tx('compareTitle')} (${n})</h2>
  <div class="subtitle">
    GAIT 69: Global AI Index Taxonomy &nbsp;·&nbsp;
    DOI: 10.5281/zenodo.20248631 &nbsp;·&nbsp;
    © 2025 DO HUN, KIM &nbsp;·&nbsp;
    ${new Date().toLocaleDateString()}
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:${labelW};background:#2a4a3a"></th>
        ${headerRow}
      </tr>
    </thead>
    <tbody>
      ${dataRows}
    </tbody>
  </table>
  <div class="footer">ai-engine-app.vercel.app</div>
</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 600)
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
          <div style={{ display: 'flex', gap: '8px' }}>
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
        {fields.map(f => (
          <div key={f.key} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'flex', alignItems: f.key === '__description__' ? 'flex-start' : 'center' }}>
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
                <div key={p.id} style={{ fontSize: '11px', color: f.key === '__description__' ? '#aaa' : '#ccc', textAlign: f.key === '__description__' ? 'left' : 'center', lineHeight: 1.5 }}>
                  {val}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
