'use client'
// app/admin/page.tsx

import { useState, useEffect } from 'react'

const SECTIONS = ['대시보드', '비AI 탐지', '중복 탐지', '날짜 검색', '로그'] as const
type Section = typeof SECTIONS[number]

interface Product {
  id: number
  product_name: string
  manufacturer: string
  official_url: string
  verification_status: string
  parent_platform: string
  created_at: string
  _reason?: string
  _duplicate_of_id?: number
}

export default function AdminPage() {
  const [auth, setAuth]               = useState(false)
  const [pw, setPw]                   = useState('')
  const [pwError, setPwError]         = useState('')
  const [section, setSection]         = useState<Section>('대시보드')
  const [loading, setLoading]         = useState(false)
  const [results, setResults]         = useState<Product[]>([])
  const [selected, setSelected]       = useState<Set<number>>(new Set())
  const [message, setMessage]         = useState('')
  const [stats, setStats]             = useState<any>(null)
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [dateResults, setDateResults] = useState<any[]>([])
  const [dateSummary, setDateSummary] = useState<any>(null)
  const [logs, setLogs]               = useState<any[]>([])

  async function callAPI(action: string, extra: any = {}) {
    const res = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, password: pw, ...extra })
    })
    return res.json()
  }

  function handleLogin() {
    if (!pw.trim()) { setPwError('비밀번호를 입력하세요'); return }
    setAuth(true)
    loadStats()
  }

  async function loadStats() {
    const data = await callAPI('stats')
    if (!data.error) setStats(data)
  }

  async function findInvalid() {
    setLoading(true); setResults([]); setSelected(new Set()); setMessage('')
    const data = await callAPI('find_invalid')
    setLoading(false)
    if (data.error) { setMessage('❌ ' + data.error); return }
    setResults(data.results || [])
    setMessage(`비AI/폰트 항목 ${data.count}개 발견`)
  }

  async function findDuplicates() {
    setLoading(true); setResults([]); setSelected(new Set()); setMessage('')
    const data = await callAPI('find_duplicates')
    setLoading(false)
    if (data.error) { setMessage('❌ ' + data.error); return }
    setResults(data.results || [])
    setMessage(`중복 항목 ${data.count}개 발견`)
  }

  async function deleteSelected() {
    if (selected.size === 0) { setMessage('삭제할 항목을 선택하세요'); return }
    if (!confirm(`${selected.size}개를 삭제하시겠습니까? 복구 불가합니다.`)) return
    setLoading(true)
    const data = await callAPI('delete_items', { ids: Array.from(selected) })
    setLoading(false)
    if (data.error) { setMessage('❌ ' + data.error); return }
    setMessage(`✅ ${data.deleted}개 삭제 완료`)
    setResults(prev => prev.filter(p => !selected.has(p.id)))
    setSelected(new Set())
    loadStats()
  }

  async function searchByDate() {
    if (!dateFrom) { setMessage('시작 날짜를 입력하세요'); return }
    setLoading(true); setDateResults([]); setDateSummary(null); setMessage('')
    const data = await callAPI('date_search', { dateFrom, dateTo })
    setLoading(false)
    if (data.error) { setMessage('❌ ' + data.error); return }
    setDateResults(data.results || [])
    setDateSummary({ newCount: data.newCount, updatedCount: data.updatedCount, from: data.from, to: data.to })
    setMessage(`${data.from} ~ ${data.to} : 신규 ${data.newCount}개 / 수정 ${data.updatedCount}개`)
  }

  async function loadLogs() {
    setLoading(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/update_logs?select=*&order=created_at.desc&limit=50`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    })
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set())
    else setSelected(new Set(results.map(r => r.id)))
  }

  // ── 로그인 화면 ─────────────────────────────────────────
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#161b22', border: '1px solid rgba(184,150,64,0.3)', borderRadius: '16px', padding: '40px', width: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
            <h1 style={{ color: '#b89640', fontSize: '20px', fontWeight: 700 }}>AI MAP 관리자</h1>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Admin Back Office</p>
          </div>
          <input
            type="password"
            placeholder="관리자 비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
          {pwError && <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '6px' }}>{pwError}</p>}
          <button onClick={handleLogin}
            style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace' }}>
      {/* 네비 */}
      <div style={{ background: '#161b22', borderBottom: '1px solid rgba(184,150,64,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '0', height: '52px' }}>
        <span style={{ color: '#b89640', fontWeight: 700, fontSize: '15px', marginRight: '32px' }}>🛡️ AI MAP Admin</span>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => { setSection(s); setResults([]); setMessage(''); setDateResults([]); setDateSummary(null) }}
            style={{ padding: '0 16px', height: '52px', background: 'none', border: 'none', color: section === s ? '#b89640' : '#666', fontSize: '13px', cursor: 'pointer', borderBottom: section === s ? '2px solid #b89640' : '2px solid transparent', fontWeight: section === s ? 700 : 400 }}>
            {s}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {stats && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              총 {stats.total?.toLocaleString()}개 · 오늘 {stats.today}개 신규
            </span>
          )}
          <button onClick={() => { setAuth(false); setPw('') }}
            style={{ padding: '4px 12px', borderRadius: '6px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '12px', cursor: 'pointer' }}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        {/* 메시지 */}
        {message && (
          <div style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', background: message.startsWith('❌') ? 'rgba(255,68,68,0.1)' : 'rgba(0,255,136,0.07)', border: `1px solid ${message.startsWith('❌') ? 'rgba(255,68,68,0.3)' : 'rgba(0,255,136,0.2)'}`, color: message.startsWith('❌') ? '#ff4444' : '#00ff88', fontSize: '13px' }}>
            {message}
          </div>
        )}

        {/* ── 대시보드 ── */}
        {section === '대시보드' && (
          <div>
            <h2 style={{ color: '#b89640', marginBottom: '24px' }}>📊 대시보드</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: '전체 AI 엔진', value: stats?.total?.toLocaleString() || '-', color: '#00ff88' },
                { label: '오늘 신규', value: stats?.today || '0', color: '#4a8adf' },
                { label: '글로서리 용어', value: stats?.glossary?.toLocaleString() || '-', color: '#b89640' },
              ].map(card => (
                <div key={card.label} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>{card.label}</div>
                  <div style={{ color: card.color, fontSize: '28px', fontWeight: 700 }}>{card.value}</div>
                </div>
              ))}
            </div>
            <h3 style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>빠른 실행</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { label: '🔍 비AI 항목 탐지', action: () => { setSection('비AI 탐지'); setTimeout(findInvalid, 100) } },
                { label: '🔄 중복 탐지', action: () => { setSection('중복 탐지'); setTimeout(findDuplicates, 100) } },
                { label: '📅 날짜 검색', action: () => setSection('날짜 검색') },
                { label: '📋 로그 보기', action: () => { setSection('로그'); setTimeout(loadLogs, 100) } },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(184,150,64,0.1)', border: '1px solid rgba(184,150,64,0.3)', color: '#b89640', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 비AI 탐지 ── */}
        {section === '비AI 탐지' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>🔍 비AI/폰트 항목 탐지</h2>
              <button onClick={findInvalid} disabled={loading}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '탐지 중...' : '탐지 실행'}
              </button>
              {results.length > 0 && <>
                <button onClick={toggleAll}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: '13px', cursor: 'pointer' }}>
                  {selected.size === results.length ? '전체 해제' : '전체 선택'}
                </button>
                <button onClick={deleteSelected} disabled={selected.size === 0 || loading}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: selected.size > 0 ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected.size > 0 ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, color: selected.size > 0 ? '#ff6666' : '#444', fontSize: '13px', cursor: selected.size > 0 ? 'pointer' : 'default' }}>
                  선택 삭제 ({selected.size})
                </button>
              </>}
            </div>
            <ResultTable results={results} selected={selected} onToggle={toggleSelect} />
          </div>
        )}

        {/* ── 중복 탐지 ── */}
        {section === '중복 탐지' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>🔄 중복 항목 탐지</h2>
              <button onClick={findDuplicates} disabled={loading}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '탐지 중...' : '탐지 실행'}
              </button>
              {results.length > 0 && <>
                <button onClick={toggleAll}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: '13px', cursor: 'pointer' }}>
                  {selected.size === results.length ? '전체 해제' : '전체 선택'}
                </button>
                <button onClick={deleteSelected} disabled={selected.size === 0 || loading}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: selected.size > 0 ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected.size > 0 ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, color: selected.size > 0 ? '#ff6666' : '#444', fontSize: '13px', cursor: selected.size > 0 ? 'pointer' : 'default' }}>
                  선택 삭제 ({selected.size})
                </button>
              </>}
            </div>
            <ResultTable results={results} selected={selected} onToggle={toggleSelect} showDupeOf />
          </div>
        )}

        {/* ── 날짜 검색 ── */}
        {section === '날짜 검색' && (
          <div>
            <h2 style={{ color: '#b89640', marginBottom: '24px' }}>📅 날짜 범위 검색</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>시작일 (260520 또는 2026-05-20)</label>
                <input value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  placeholder="260520"
                  style={{ padding: '10px 14px', borderRadius: '8px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', width: '200px' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>종료일 (비우면 시작일과 동일)</label>
                <input value={dateTo} onChange={e => setDateTo(e.target.value)}
                  placeholder="260524"
                  style={{ padding: '10px 14px', borderRadius: '8px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', width: '200px' }} />
              </div>
              <button onClick={searchByDate} disabled={loading}
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>

            {dateSummary && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '12px', fontWeight: 600 }}>🆕 신규 {dateSummary.newCount}개</span>
                <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(74,138,223,0.1)', border: '1px solid rgba(74,138,223,0.3)', color: '#4a8adf', fontSize: '12px', fontWeight: 600 }}>🔄 수정 {dateSummary.updatedCount}개</span>
                <span style={{ padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', fontSize: '12px' }}>총 {dateResults.length}개</span>
              </div>
            )}

            {dateResults.length > 0 && (
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#161b22' }}>
                      {['구분','AI 엔진명','제조사','카테고리','날짜','출처'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dateResults.map((r, i) => {
                      const isNew = r._type === '신규'
                      const date = isNew ? (r.created_at || '').slice(0, 10) : (r.updated_at || '').slice(0, 10)
                      return (
                        <tr key={r.id ?? i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: isNew ? 'rgba(0,255,136,0.1)' : 'rgba(74,138,223,0.1)', border: `1px solid ${isNew ? 'rgba(0,255,136,0.3)' : 'rgba(74,138,223,0.3)'}`, color: isNew ? '#00ff88' : '#4a8adf', whiteSpace: 'nowrap' }}>
                              {isNew ? '🆕 신규' : '🔄 수정'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px', color: '#e6edf3', fontWeight: 500 }}>
                            {r.official_url
                              ? <a href={r.official_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e6edf3', textDecoration: 'none' }}>{r.product_name}</a>
                              : r.product_name}
                          </td>
                          <td style={{ padding: '8px 14px', color: '#aaa' }}>{r.manufacturer || '-'}</td>
                          <td style={{ padding: '8px 14px', color: '#888', fontSize: '12px' }}>{(r.category_main || '-').replace(/^\d+\.\s/, '')}</td>
                          <td style={{ padding: '8px 14px', color: '#888', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{date}</td>
                          <td style={{ padding: '8px 14px', color: '#666', fontSize: '11px' }}>{r.parent_platform || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 로그 ── */}
        {section === '로그' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>📋 업데이트 로그</h2>
              <button onClick={loadLogs} disabled={loading}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '로딩 중...' : '로그 불러오기'}
              </button>
            </div>
            {logs.length > 0 && (
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#161b22' }}>
                      {['날짜','액션','상세','출처'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 14px', color: '#888', whiteSpace: 'nowrap' }}>{(log.created_at || '').slice(0, 16)}</td>
                        <td style={{ padding: '8px 14px', color: '#00ff88' }}>{log.action}</td>
                        <td style={{ padding: '8px 14px', color: '#ccc' }}>{log.detail}</td>
                        <td style={{ padding: '8px 14px', color: '#666' }}>{log.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── 공통 결과 테이블 ─────────────────────────────────────────
function ResultTable({ results, selected, onToggle, showDupeOf }: {
  results: Product[]
  selected: Set<number>
  onToggle: (id: number) => void
  showDupeOf?: boolean
}) {
  if (results.length === 0) return null
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#161b22' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)', width: '40px' }}>✓</th>
            {['AI 엔진명','제조사','사유','등록일','URL'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
            {showDupeOf && <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)' }}>원본 ID</th>}
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id} onClick={() => onToggle(r.id)}
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selected.has(r.id) ? 'rgba(255,68,68,0.07)' : 'transparent' }}>
              <td style={{ padding: '8px 14px' }}>
                <input type="checkbox" readOnly checked={selected.has(r.id)} style={{ accentColor: '#ff4444', width: '14px', height: '14px' }} />
              </td>
              <td style={{ padding: '8px 14px', color: '#e6edf3', fontWeight: 500 }}>{r.product_name}</td>
              <td style={{ padding: '8px 14px', color: '#aaa' }}>{r.manufacturer || '-'}</td>
              <td style={{ padding: '8px 14px', color: '#ff8888', fontSize: '12px' }}>{r._reason || '-'}</td>
              <td style={{ padding: '8px 14px', color: '#888', fontSize: '12px', whiteSpace: 'nowrap' }}>{(r.created_at || '').slice(0, 10)}</td>
              <td style={{ padding: '8px 14px', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.official_url
                  ? <a href={r.official_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#4a8adf' }}>{r.official_url}</a>
                  : '-'}
              </td>
              {showDupeOf && <td style={{ padding: '8px 14px', color: '#666', fontSize: '12px' }}>{(r as any)._duplicate_of_id || '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
