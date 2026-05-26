'use client'
// app/admin/page.tsx

import { useState, useEffect, useRef } from 'react'

const SECTIONS = ['대시보드', '비AI 탐지', '중복 탐지', '날짜 검색', 'Links 관리', 'URL 무결성', '모니터링', '로그'] as const
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

interface LinkItem {
  id: number
  category: string
  name: string
  url: string
  description: string | null
  description_ko: string | null
  sort_order: number
  is_visible: boolean
}

interface UrlCheckResult {
  id: number
  product_name: string
  manufacturer: string
  official_url: string
  status: 'ok' | 'dead' | 'error'
  statusCode?: number
  error?: string
}

interface MonitorData {
  supabase: {
    totalRows: number
    glossaryRows: number
    linksRows: number
    logsRows: number
  }
  github: {
    lastRun: string
    lastStatus: string
    lastConclusion: string
  } | null
  vercel: {
    lastDeploy: string
    lastStatus: string
  } | null
}

const LINK_CATEGORIES = ['books', 'devtools', 'community', 'research']

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

  // Links 관리 상태
  const [links, setLinks]             = useState<LinkItem[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const editFormRef = useRef<HTMLDivElement>(null)
  const [linksMsg, setLinksMsg]       = useState('')
  const [editLink, setEditLink]       = useState<LinkItem | null>(null)
  const [newLink, setNewLink]         = useState<Partial<LinkItem>>({ category: 'community', is_visible: true })
  const [showNewForm, setShowNewForm] = useState(false)

  // URL 무결성 상태
  const [urlResults, setUrlResults]   = useState<UrlCheckResult[]>([])
  const [urlChecking, setUrlChecking] = useState(false)
  const [urlProgress, setUrlProgress] = useState(0)
  const [urlTotal, setUrlTotal]       = useState(0)
  const [urlMsg, setUrlMsg]           = useState('')
  const [urlFilter, setUrlFilter]     = useState<'all' | 'dead' | 'error'>('all')
  const [urlSelected, setUrlSelected] = useState<Set<number>>(new Set())
  // URL 인라인 편집
  const [editingUrlId, setEditingUrlId]   = useState<number | null>(null)
  const [editingUrlVal, setEditingUrlVal] = useState('')
  // URL 없는 항목 관리
  const [emptyUrlProducts, setEmptyUrlProducts] = useState<any[]>([])
  const [emptyUrlLoading, setEmptyUrlLoading]   = useState(false)
  const [emptyUrlMsg, setEmptyUrlMsg]           = useState('')
  const [emptyEditId, setEmptyEditId]           = useState<number | null>(null)
  const [emptyEditVal, setEmptyEditVal]         = useState('')
  // 자동 검색 후보
  const [searchingId, setSearchingId]           = useState<number | null>(null)
  const [urlCandidates, setUrlCandidates]       = useState<Record<number, {url:string;title:string;snippet:string}[]>>({})

  // 모니터링 상태
  const [monitor, setMonitor]         = useState<MonitorData | null>(null)
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [visitors, setVisitors]       = useState<any[]>([])
  const [visitorsLoading, setVisitorsLoading] = useState(false)

  const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
    const res = await fetch(`${SB_URL}/rest/v1/update_logs?select=*&order=created_at.desc&limit=50`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    })
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // ── Links 관리 ──────────────────────────────────────────
  async function loadLinks() {
    setLinksLoading(true)
    const res = await fetch(`${SB_URL}/rest/v1/links?order=category.asc,sort_order.asc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    })
    const data = await res.json()
    setLinks(Array.isArray(data) ? data : [])
    setLinksLoading(false)
  }

  async function saveLink(link: Partial<LinkItem>) {
    if (!link.name || !link.url || !link.category) { setLinksMsg('이름, URL, 카테고리는 필수입니다'); return }
    const body = {
      name: link.name, url: link.url, category: link.category,
      description: link.description || null, description_ko: link.description_ko || null,
      sort_order: link.sort_order || 99, is_visible: link.is_visible ?? true
    }
    let res
    if (link.id) {
      res = await fetch(`${SB_URL}/rest/v1/links?id=eq.${link.id}`, {
        method: 'PATCH',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body)
      })
    } else {
      res = await fetch(`${SB_URL}/rest/v1/links`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(body)
      })
    }
    if (res.ok || res.status === 204) {
      setLinksMsg(link.id ? '✅ 수정 완료' : '✅ 추가 완료')
      setEditLink(null); setShowNewForm(false)
      setNewLink({ category: 'community', is_visible: true })
      loadLinks()
    } else {
      setLinksMsg('❌ 저장 실패')
    }
  }

  async function deleteLink(id: number) {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return
    const res = await fetch(`${SB_URL}/rest/v1/links?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    })
    if (res.ok || res.status === 204) { setLinksMsg('✅ 삭제 완료'); loadLinks() }
    else setLinksMsg('❌ 삭제 실패')
  }

  // ── URL 무결성 검사 ──────────────────────────────────────
  async function startUrlCheck() {
    if (!confirm('전체 AI 엔진 URL을 검사합니다. 6,500개 이상이라 시간이 걸려요. 시작할까요?')) return
    setUrlChecking(true); setUrlResults([]); setUrlSelected(new Set()); setUrlMsg('')

    // Supabase 1000개 제한 → 페이지네이션으로 전체 수집
    let allProducts: any[] = []
    let offset = 0
    const PAGE = 1000

    setUrlMsg('데이터 불러오는 중...')
    while (true) {
      const res = await fetch(
        `${SB_URL}/rest/v1/ai_products?select=id,product_name,manufacturer,official_url&official_url=not.is.null&official_url=neq.&order=id.asc&limit=${PAGE}&offset=${offset}`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      )
      const batch = await res.json()
      if (!Array.isArray(batch) || batch.length === 0) break
      allProducts = allProducts.concat(batch)
      setUrlMsg(`데이터 로딩 중... ${allProducts.length}개`)
      if (batch.length < PAGE) break
      offset += PAGE
    }

    if (allProducts.length === 0) { setUrlMsg('❌ 데이터 로드 실패'); setUrlChecking(false); return }

    setUrlTotal(allProducts.length)
    setUrlMsg(`총 ${allProducts.length}개 URL 검사 시작...`)

    const allResults: UrlCheckResult[] = []
    const BATCH = 20

    for (let i = 0; i < allProducts.length; i += BATCH) {
      const batch = allProducts.slice(i, i + BATCH)
      const checks = await Promise.allSettled(
        batch.map(async (p: any) => {
          try {
            const r = await fetch(`/api/admin/url-check`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: p.official_url, password: pw })
            })
            const d = await r.json()
            return { id: p.id, product_name: p.product_name, manufacturer: p.manufacturer, official_url: p.official_url, status: d.status, statusCode: d.statusCode, error: d.error } as UrlCheckResult
          } catch {
            return { id: p.id, product_name: p.product_name, manufacturer: p.manufacturer, official_url: p.official_url, status: 'error' as const, error: 'fetch failed' }
          }
        })
      )
      checks.forEach(c => { if (c.status === 'fulfilled') allResults.push(c.value) })
      setUrlProgress(Math.min(i + BATCH, allProducts.length))
      setUrlResults([...allResults])
    }

    const dead = allResults.filter(r => r.status === 'dead').length
    const err = allResults.filter(r => r.status === 'error').length
    setUrlMsg(`✅ 검사 완료 — 정상: ${allResults.length - dead - err}개 / 불량: ${dead}개 / 오류: ${err}개`)
    setUrlChecking(false)
  }

  async function deleteUrlSelected() {
    if (urlSelected.size === 0) { setUrlMsg('삭제할 항목을 선택하세요'); return }
    if (!confirm(`${urlSelected.size}개를 삭제하시겠습니까?`)) return
    const data = await callAPI('delete_items', { ids: Array.from(urlSelected) })
    if (data.error) { setUrlMsg('❌ ' + data.error); return }
    setUrlMsg(`✅ ${data.deleted}개 삭제 완료`)
    setUrlResults(prev => prev.filter(r => !urlSelected.has(r.id)))
    setUrlSelected(new Set())
    loadStats()
  }

  // URL 인라인 수정 저장
  async function saveUrlEdit(id: number) {
    const trimmed = editingUrlVal.trim()
    if (!trimmed) { setUrlMsg('❌ URL을 입력해주세요'); return }
    const res = await fetch(`${SB_URL}/rest/v1/ai_products?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ official_url: trimmed })
    })
    if (res.ok) {
      setUrlResults(prev => prev.map(r => r.id === id ? { ...r, official_url: trimmed } : r))
      setEditingUrlId(null)
      setUrlMsg(`✅ URL 수정 완료`)
    } else {
      setUrlMsg('❌ 수정 실패')
    }
  }

  // URL 없는 항목 로드
  async function loadEmptyUrls() {
    setEmptyUrlLoading(true); setEmptyUrlMsg('')
    let all: any[] = []
    let offset = 0
    const PAGE = 1000
    while (true) {
      const res = await fetch(
        `${SB_URL}/rest/v1/ai_products?select=id,product_name,manufacturer,category_main&or=(official_url.is.null,official_url.eq.)&order=category_main.asc,product_name.asc&limit=${PAGE}&offset=${offset}`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      )
      const batch = await res.json()
      if (!Array.isArray(batch) || batch.length === 0) break
      all = all.concat(batch)
      if (batch.length < PAGE) break
      offset += PAGE
    }
    setEmptyUrlProducts(all)
    setEmptyUrlMsg(`URL 없는 항목 ${all.length}개`)
    setEmptyUrlLoading(false)
  }

  // 빈 URL 항목에 URL 저장
  async function saveEmptyUrl(id: number) {
    const trimmed = emptyEditVal.trim()
    if (!trimmed) return
    const res = await fetch(`${SB_URL}/rest/v1/ai_products?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ official_url: trimmed })
    })
    if (res.ok) {
      setEmptyUrlProducts(prev => prev.filter(p => p.id !== id))
      setEmptyEditId(null)
      setEmptyUrlMsg(`✅ 저장 완료 — 남은 항목: ${emptyUrlProducts.length - 1}개`)
    } else {
      setEmptyUrlMsg('❌ 저장 실패')
    }
  }

  // 후보 URL 선택 저장
  async function selectCandidateUrl(id: number, url: string) {
    const res = await fetch(`${SB_URL}/rest/v1/ai_products?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ official_url: url })
    })
    if (res.ok) {
      setEmptyUrlProducts(prev => prev.filter(p => p.id !== id))
      setUrlCandidates(prev => { const n = {...prev}; delete n[id]; return n })
      setEmptyUrlMsg(`✅ URL 저장 완료 — 남은 항목: ${emptyUrlProducts.length - 1}개`)
    }
  }

  // URL 자동 검색
  async function autoSearchUrl(p: any) {
    setSearchingId(p.id)
    try {
      const res = await fetch('/api/admin/url-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: p.product_name, manufacturer: p.manufacturer, password: pw })
      })
      const data = await res.json()
      setUrlCandidates(prev => ({ ...prev, [p.id]: data.candidates || [] }))
      if (data.note) setEmptyUrlMsg(`ℹ️ ${data.note}`)
    } catch {
      setEmptyUrlMsg('❌ 검색 실패')
    } finally {
      setSearchingId(null)
    }
  }

  // 전체 자동 검색 (배치)
  async function autoSearchAll() {
    if (!confirm(`URL 없는 ${emptyUrlProducts.length}개 항목을 자동 검색합니다. 시간이 걸릴 수 있어요.`)) return
    setEmptyUrlMsg('자동 검색 중...')
    for (let i = 0; i < emptyUrlProducts.length; i++) {
      const p = emptyUrlProducts[i]
      setEmptyUrlMsg(`자동 검색 중... (${i + 1}/${emptyUrlProducts.length}) — ${p.product_name}`)
      try {
        const res = await fetch('/api/admin/url-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_name: p.product_name, manufacturer: p.manufacturer, password: pw })
        })
        const data = await res.json()
        if (data.candidates?.length > 0) {
          setUrlCandidates(prev => ({ ...prev, [p.id]: data.candidates }))
        }
      } catch { /* skip */ }
      // rate limit 방지
      await new Promise(r => setTimeout(r, 300))
    }
    setEmptyUrlMsg(`✅ 자동 검색 완료 — 목록에서 후보를 선택하거나 직접 입력하세요`)
  }

  // ── 모니터링 ──────────────────────────────────────────────
  async function loadMonitor() {
    setMonitorLoading(true)
    try {
      // Supabase 각 테이블 row 수
      const [p1, p2, p3, p4, p5] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/ai_products?select=id`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }),
        fetch(`${SB_URL}/rest/v1/glossary?select=id`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }),
        fetch(`${SB_URL}/rest/v1/links?select=id`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }),
        fetch(`${SB_URL}/rest/v1/update_logs?select=id`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' } }),
        fetch(`${SB_URL}/rest/v1/update_logs?select=created_at,action&order=created_at.desc&limit=1`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }),
      ])

      const getCount = (res: Response) => {
        const range = res.headers.get('content-range')
        return range ? parseInt(range.split('/')[1] || '0') : 0
      }

      const lastLog = await p5.json()

      // GitHub Actions 최근 실행
      let github = null
      try {
        const ghRes = await fetch('https://api.github.com/repos/developerH1004/ai-engine-app/actions/runs?per_page=1')
        if (ghRes.ok) {
          const ghData = await ghRes.json()
          const run = ghData.workflow_runs?.[0]
          if (run) github = { lastRun: run.created_at, lastStatus: run.status, lastConclusion: run.conclusion || '-' }
        }
      } catch {}

      setMonitor({
        supabase: {
          totalRows: getCount(p1),
          glossaryRows: getCount(p2),
          linksRows: getCount(p3),
          logsRows: getCount(p4),
        },
        github,
        vercel: lastLog?.[0] ? { lastDeploy: lastLog[0].created_at, lastStatus: lastLog[0].action } : null
      })
    } catch (e) {
      console.error(e)
    }
    setMonitorLoading(false)
  }

  async function loadVisitors() {
    setVisitorsLoading(true)
    try {
      // update_logs에서 날짜별 집계로 방문 패턴 추정
      const res = await fetch(`${SB_URL}/rest/v1/update_logs?select=created_at,action,detail&order=created_at.desc&limit=100`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      })
      const data = await res.json()
      // 날짜별 그룹핑
      const byDate: Record<string, number> = {}
      if (Array.isArray(data)) {
        data.forEach((log: any) => {
          const date = (log.created_at || '').slice(0, 10)
          if (date) byDate[date] = (byDate[date] || 0) + 1
        })
      }
      const sorted = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14)
      setVisitors(sorted)
    } catch {}
    setVisitorsLoading(false)
  }

  const filteredUrlResults = urlResults.filter(r => urlFilter === 'all' ? r.status !== 'ok' : r.status === urlFilter)

  function toggleSelect(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set())
    else setSelected(new Set(results.map(r => r.id)))
  }
  function toggleUrlSelect(id: number) {
    setUrlSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── 로그인 화면 ──────────────────────────────────────────
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#161b22', border: '1px solid rgba(184,150,64,0.3)', borderRadius: '16px', padding: '40px', width: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
            <h1 style={{ color: '#b89640', fontSize: '20px', fontWeight: 700 }}>AI MAP 관리자</h1>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Admin Back Office</p>
          </div>
          <input type="password" placeholder="관리자 비밀번호" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
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
      <nav style={{ background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
        <span style={{ color: '#b89640', fontWeight: 700, fontSize: '14px', marginRight: '16px', whiteSpace: 'nowrap' }}>🛡️ AI MAP Admin</span>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => {
            setSection(s); setMessage('')
            if (s === 'Links 관리') loadLinks()
            if (s === '로그') loadLogs()
            if (s === '모니터링') { loadMonitor(); loadVisitors() }
          }}
            style={{ padding: '14px 14px', background: 'transparent', border: 'none', borderBottom: section === s ? '2px solid #b89640' : '2px solid transparent', color: section === s ? '#b89640' : '#666', fontSize: '12px', fontWeight: section === s ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {s}
          </button>
        ))}
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── 대시보드 ── */}
        {section === '대시보드' && (
          <div>
            <h2 style={{ color: '#b89640', marginBottom: '24px' }}>📊 대시보드</h2>
            {stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: '전체 AI 엔진', value: stats.total?.toLocaleString(), color: '#00ff88' },
                  { label: '오늘 신규', value: stats.todayNew || 0, color: '#4a8adf' },
                  { label: '글로서리 용어', value: stats.glossary?.toLocaleString(), color: '#b89640' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px 24px' }}>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ color: s.color, fontSize: '28px', fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: '#555', marginBottom: '24px' }}>로딩 중...</div>}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: '🔍 비AI 항목 탐지', action: () => { setSection('비AI 탐지'); findInvalid() } },
                { label: '🔄 중복 탐지', action: () => { setSection('중복 탐지'); findDuplicates() } },
                { label: '📅 날짜 검색', action: () => setSection('날짜 검색') },
                { label: '🔗 URL 무결성 검사', action: () => setSection('URL 무결성') },
                { label: '📡 모니터링', action: () => { setSection('모니터링'); loadMonitor(); loadVisitors() } },
              ].map(b => (
                <button key={b.label} onClick={b.action}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#161b22', border: '1px solid rgba(184,150,64,0.3)', color: '#b89640', fontSize: '13px', cursor: 'pointer' }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 비AI 탐지 ── */}
        {section === '비AI 탐지' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>🔍 비AI 항목 탐지</h2>
              <button onClick={findInvalid} disabled={loading}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '탐지 중...' : '탐지 실행'}
              </button>
              {results.length > 0 && <>
                <button onClick={toggleAll} style={{ padding: '8px 16px', borderRadius: '8px', background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '12px', cursor: 'pointer' }}>
                  {selected.size === results.length ? '전체 해제' : '전체 선택'}
                </button>
                <button onClick={deleteSelected} disabled={loading || selected.size === 0}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: selected.size > 0 ? '#ff4444' : '#333', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  선택 삭제 ({selected.size})
                </button>
              </>}
            </div>
            {message && <div style={{ marginBottom: '16px', color: '#b89640', fontSize: '13px' }}>{message}</div>}
            <ResultTable results={results} selected={selected} onToggle={toggleSelect} />
          </div>
        )}

        {/* ── 중복 탐지 ── */}
        {section === '중복 탐지' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>🔄 중복 탐지</h2>
              <button onClick={findDuplicates} disabled={loading}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '탐지 중...' : '탐지 실행'}
              </button>
              {results.length > 0 && <>
                <button onClick={toggleAll} style={{ padding: '8px 16px', borderRadius: '8px', background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '12px', cursor: 'pointer' }}>
                  {selected.size === results.length ? '전체 해제' : '전체 선택'}
                </button>
                <button onClick={deleteSelected} disabled={loading || selected.size === 0}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: selected.size > 0 ? '#ff4444' : '#333', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  선택 삭제 ({selected.size})
                </button>
              </>}
            </div>
            {message && <div style={{ marginBottom: '16px', color: '#b89640', fontSize: '13px' }}>{message}</div>}
            <ResultTable results={results} selected={selected} onToggle={toggleSelect} showDupeOf />
          </div>
        )}

        {/* ── 날짜 검색 ── */}
        {section === '날짜 검색' && (
          <div>
            <h2 style={{ color: '#b89640', marginBottom: '24px' }}>📅 날짜 범위 검색</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>시작일</label>
                <input value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="260520"
                  style={{ padding: '10px 14px', borderRadius: '8px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', width: '180px' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>종료일</label>
                <input value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="260524"
                  style={{ padding: '10px 14px', borderRadius: '8px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', width: '180px' }} />
              </div>
              <button onClick={searchByDate} disabled={loading}
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>
            {message && <div style={{ marginBottom: '16px', color: '#b89640', fontSize: '13px' }}>{message}</div>}
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
                            {r.official_url ? <a href={r.official_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e6edf3', textDecoration: 'none' }}>{r.product_name}</a> : r.product_name}
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

        {/* ── Links 관리 ── */}
        {section === 'Links 관리' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>🔗 Links 관리</h2>
              <button onClick={loadLinks} style={{ padding: '8px 16px', borderRadius: '8px', background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '12px', cursor: 'pointer' }}>새로고침</button>
              <button onClick={() => { setShowNewForm(true); setEditLink(null) }}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#00ff88', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                + 새 링크 추가
              </button>
            </div>
            {linksMsg && <div style={{ marginBottom: '16px', color: '#00ff88', fontSize: '13px' }}>{linksMsg}</div>}
            {showNewForm && (
              <LinkForm link={newLink} onChange={setNewLink} onSave={() => saveLink(newLink)} onCancel={() => setShowNewForm(false)} title="새 링크 추가" />
            )}
            {editLink && (
              <div ref={editFormRef}><LinkForm link={editLink} onChange={(v) => setEditLink(v as LinkItem)} onSave={() => saveLink(editLink)} onCancel={() => setEditLink(null)} title="링크 수정" /></div>
            )}
            {linksLoading ? (
              <div style={{ color: '#555', textAlign: 'center', padding: '40px' }}>로딩 중...</div>
            ) : (
              LINK_CATEGORIES.map(cat => {
                const catLinks = links.filter(l => l.category === cat)
                if (catLinks.length === 0) return null
                return (
                  <div key={cat} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', color: '#b89640', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>{cat} ({catLinks.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {catLinks.map(link => (
                        <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: '#161b22', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: link.is_visible ? '#e6edf3' : '#555' }}>{link.name}</div>
                            <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
                            {link.description && <div style={{ fontSize: '11px', color: '#666' }}>{link.description}</div>}
                          </div>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: link.is_visible ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)', color: link.is_visible ? '#00ff88' : '#555' }}>
                            {link.is_visible ? '노출' : '숨김'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#555' }}>#{link.sort_order}</span>
                          <button onClick={() => { setEditLink(link); setShowNewForm(false); setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}
                            style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(74,138,223,0.1)', border: '1px solid rgba(74,138,223,0.2)', color: '#4a8adf', fontSize: '11px', cursor: 'pointer' }}>수정</button>
                          <button onClick={() => deleteLink(link.id)}
                            style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── URL 무결성 ── */}
        {section === 'URL 무결성' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>🌐 URL 무결성 검사</h2>
              <button onClick={startUrlCheck} disabled={urlChecking}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#b89640', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {urlChecking ? `검사 중... (${urlProgress}/${urlTotal})` : '검사 시작'}
              </button>
              {urlResults.length > 0 && urlSelected.size > 0 && (
                <button onClick={deleteUrlSelected}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: '#ff4444', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  선택 삭제 ({urlSelected.size})
                </button>
              )}
            </div>
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '12px', color: '#888' }}>
              ℹ️ ai_products의 official_url 전체를 실제 접속 테스트합니다. 404/서비스종료 URL을 찾아 삭제 여부를 결정할 수 있어요.
            </div>
            {urlChecking && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${urlTotal ? (urlProgress / urlTotal) * 100 : 0}%`, background: '#00ff88', transition: 'width 0.3s', borderRadius: '99px' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{urlProgress} / {urlTotal} 검사 완료</div>
              </div>
            )}
            {urlMsg && <div style={{ marginBottom: '16px', color: '#b89640', fontSize: '13px' }}>{urlMsg}</div>}
            {urlResults.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: `전체 불량 (${urlResults.filter(r => r.status !== 'ok').length})` },
                    { key: 'dead', label: `💀 불량 (${urlResults.filter(r => r.status === 'dead').length})` },
                    { key: 'error', label: `⚠️ 오류 (${urlResults.filter(r => r.status === 'error').length})` },
                  ].map(f => (
                    <button key={f.key} onClick={() => setUrlFilter(f.key as any)}
                      style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: urlFilter === f.key ? 'rgba(184,150,64,0.15)' : 'rgba(255,255,255,0.04)', border: urlFilter === f.key ? '1px solid rgba(184,150,64,0.5)' : '1px solid rgba(255,255,255,0.08)', color: urlFilter === f.key ? '#b89640' : '#888' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {filteredUrlResults.length > 0 && (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#161b22' }}>
                          <th style={{ padding: '10px 14px', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)', width: '40px' }}>✓</th>
                          {['상태','AI 엔진명','제조사','URL','관리'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', borderBottom: '1px solid rgba(184,150,64,0.3)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUrlResults.map(r => (
                          <tr key={r.id}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: urlSelected.has(r.id) ? 'rgba(255,68,68,0.07)' : 'transparent' }}>
                            <td style={{ padding: '8px 14px' }} onClick={() => toggleUrlSelect(r.id)}>
                              <input type="checkbox" readOnly checked={urlSelected.has(r.id)} style={{ accentColor: '#ff4444', width: '14px', height: '14px', cursor: 'pointer' }} />
                            </td>
                            <td style={{ padding: '8px 14px' }} onClick={() => toggleUrlSelect(r.id)}>
                              <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: r.status === 'dead' ? 'rgba(255,68,68,0.1)' : 'rgba(255,150,50,0.1)', border: `1px solid ${r.status === 'dead' ? 'rgba(255,68,68,0.3)' : 'rgba(255,150,50,0.3)'}`, color: r.status === 'dead' ? '#ff4444' : '#ff9632', whiteSpace: 'nowrap' }}>
                                {r.status === 'dead' ? `💀 ${r.statusCode || 'Dead'}` : '⚠️ 오류'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 14px', color: '#e6edf3', fontWeight: 500 }} onClick={() => toggleUrlSelect(r.id)}>{r.product_name}</td>
                            <td style={{ padding: '8px 14px', color: '#aaa', fontSize: '12px' }} onClick={() => toggleUrlSelect(r.id)}>{r.manufacturer || '-'}</td>
                            <td style={{ padding: '8px 14px', fontSize: '11px', maxWidth: '220px' }}>
                              {editingUrlId === r.id ? (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  <input
                                    value={editingUrlVal}
                                    onChange={e => setEditingUrlVal(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveUrlEdit(r.id); if (e.key === 'Escape') setEditingUrlId(null) }}
                                    autoFocus
                                    style={{ flex: 1, padding: '3px 7px', borderRadius: '4px', background: '#0d1117', border: '1px solid rgba(0,255,136,0.3)', color: '#e6edf3', fontSize: '11px', minWidth: 0 }}
                                  />
                                  <button onClick={() => saveUrlEdit(r.id)} style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>저장</button>
                                  <button onClick={() => setEditingUrlId(null)} style={{ padding: '3px 8px', borderRadius: '4px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#666', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>취소</button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <a href={r.official_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4a8adf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px', display: 'block' }}>{r.official_url}</a>
                                  <button onClick={() => { setEditingUrlId(r.id); setEditingUrlVal(r.official_url) }} style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(74,138,223,0.1)', border: '1px solid rgba(74,138,223,0.2)', color: '#4a8adf', fontSize: '10px', cursor: 'pointer', flexShrink: 0 }}>수정</button>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 14px', color: '#666', fontSize: '11px' }}>{r.error || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── URL 없는 항목 관리 ── */}
            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ color: '#4a8adf', margin: 0 }}>🔗 URL 없는 항목 관리</h3>
                <button onClick={loadEmptyUrls} disabled={emptyUrlLoading}
                  style={{ padding: '7px 16px', borderRadius: '7px', background: 'rgba(74,138,223,0.12)', border: '1px solid rgba(74,138,223,0.3)', color: '#4a8adf', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {emptyUrlLoading ? '로딩 중...' : '목록 불러오기'}
                </button>
                {emptyUrlProducts.length > 0 && (
                  <button onClick={autoSearchAll} disabled={searchingId !== null}
                    style={{ padding: '7px 16px', borderRadius: '7px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    🤖 전체 자동 검색
                  </button>
                )}
              </div>

              <div style={{ background: '#161b22', border: '1px solid rgba(74,138,223,0.1)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '11px', color: '#666' }}>
                ℹ️ Google Search API 키(<code>GOOGLE_SEARCH_API_KEY</code>, <code>GOOGLE_SEARCH_CX</code>)가 Vercel 환경변수에 설정되면 실제 검색 결과를 가져와요. 미설정 시 도메인 추론 방식으로 동작해요.
              </div>

              {emptyUrlMsg && <div style={{ marginBottom: '12px', color: '#4a8adf', fontSize: '13px' }}>{emptyUrlMsg}</div>}
              {emptyUrlProducts.length > 0 && (
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(74,138,223,0.15)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(74,138,223,0.06)' }}>
                        {['AI 엔진명','제조사','카테고리','URL 관리'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#4a8adf', borderBottom: '1px solid rgba(74,138,223,0.2)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {emptyUrlProducts.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 14px', color: '#e6edf3', fontWeight: 500 }}>{p.product_name}</td>
                          <td style={{ padding: '8px 14px', color: '#aaa', fontSize: '12px' }}>{p.manufacturer || '-'}</td>
                          <td style={{ padding: '8px 14px', color: '#666', fontSize: '11px' }}>{(p.category_main || '-').replace(/^\d+\.\s/, '')}</td>
                          <td style={{ padding: '8px 14px', minWidth: '320px' }}>
                            {/* 자동 검색 후보 표시 */}
                            {urlCandidates[p.id] && urlCandidates[p.id].length > 0 && (
                              <div style={{ marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {urlCandidates[p.id].map((c, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '5px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '11px', color: '#4a8adf', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4a8adf' }}>{c.url}</a>
                                      </div>
                                      <div style={{ fontSize: '10px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                                    </div>
                                    <button onClick={() => selectCandidateUrl(p.id, c.url)}
                                      style={{ padding: '3px 9px', borderRadius: '4px', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '10px', cursor: 'pointer', flexShrink: 0 }}>
                                      선택
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 직접 입력 or 자동검색 버튼 */}
                            {emptyEditId === p.id ? (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <input
                                  value={emptyEditVal}
                                  onChange={e => setEmptyEditVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveEmptyUrl(p.id); if (e.key === 'Escape') setEmptyEditId(null) }}
                                  placeholder="https://..."
                                  autoFocus
                                  style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', background: '#0d1117', border: '1px solid rgba(0,255,136,0.3)', color: '#e6edf3', fontSize: '12px', minWidth: '180px' }}
                                />
                                <button onClick={() => saveEmptyUrl(p.id)} style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>저장</button>
                                <button onClick={() => setEmptyEditId(null)} style={{ padding: '4px 8px', borderRadius: '4px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#666', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>취소</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => autoSearchUrl(p)} disabled={searchingId === p.id}
                                  style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00cc6a', fontSize: '11px', cursor: 'pointer' }}>
                                  {searchingId === p.id ? '검색 중...' : '🤖 자동 검색'}
                                </button>
                                <button onClick={() => { setEmptyEditId(p.id); setEmptyEditVal('') }}
                                  style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(74,138,223,0.08)', border: '1px solid rgba(74,138,223,0.2)', color: '#4a8adf', fontSize: '11px', cursor: 'pointer' }}>
                                  ✏️ 직접 입력
                                </button>
                                <button onClick={async () => {
                                  if (!confirm('이 항목을 삭제하시겠습니까?')) return
                                  const res = await fetch(`${SB_URL}/rest/v1/ai_products?id=eq.${p.id}`, {
                                    method: 'DELETE',
                                    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
                                  })
                                  if (res.ok) setEmptyUrlProducts(prev => prev.filter(x => x.id !== p.id))
                                }} style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', fontSize: '11px', cursor: 'pointer' }}>
                                  🗑️ 삭제
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 모니터링 ── */}
        {section === '모니터링' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <h2 style={{ color: '#b89640', margin: 0 }}>📡 인프라 모니터링</h2>
              <button onClick={() => { loadMonitor(); loadVisitors() }} disabled={monitorLoading}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '12px', cursor: 'pointer' }}>
                {monitorLoading ? '로딩 중...' : '새로고침'}
              </button>
            </div>

            {/* Supabase 현황 */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', color: '#b89640', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>📦 SUPABASE DB 현황</div>
              {monitor ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'AI 엔진', value: monitor.supabase.totalRows.toLocaleString(), color: '#00ff88' },
                    { label: '글로서리', value: monitor.supabase.glossaryRows.toLocaleString(), color: '#b89640' },
                    { label: 'Links', value: monitor.supabase.linksRows, color: '#4a8adf' },
                    { label: '업데이트 로그', value: monitor.supabase.logsRows.toLocaleString(), color: '#888' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px 20px' }}>
                      <div style={{ color: '#555', fontSize: '11px', marginBottom: '6px' }}>{s.label}</div>
                      <div style={{ color: s.color, fontSize: '22px', fontWeight: 700 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: '#555', fontSize: '13px' }}>로딩 중...</div>}
            </div>

            {/* GitHub Actions */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', color: '#b89640', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>⚙️ GITHUB ACTIONS 최근 실행</div>
              {monitor?.github ? (
                <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>마지막 실행</div>
                    <div style={{ color: '#e6edf3', fontSize: '13px' }}>{monitor.github.lastRun.slice(0, 16).replace('T', ' ')}</div>
                  </div>
                  <div>
                    <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>상태</div>
                    <div style={{ color: monitor.github.lastStatus === 'completed' ? '#00ff88' : '#ff9632', fontSize: '13px', fontWeight: 600 }}>{monitor.github.lastStatus}</div>
                  </div>
                  <div>
                    <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>결과</div>
                    <div style={{ color: monitor.github.lastConclusion === 'success' ? '#00ff88' : '#ff4444', fontSize: '13px', fontWeight: 600 }}>{monitor.github.lastConclusion}</div>
                  </div>
                  <div>
                    <a href="https://github.com/developerH1004/ai-engine-app/actions" target="_blank" rel="noopener noreferrer"
                      style={{ padding: '6px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', fontSize: '12px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
                      GitHub Actions 열기 ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px 20px', color: '#555', fontSize: '13px' }}>
                  GitHub API 응답 없음 (공개 repo만 지원)
                </div>
              )}
            </div>

            {/* 업데이트 스케줄 안내 */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', color: '#b89640', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>🕐 자동 업데이트 스케줄</div>
              <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '11px', fontWeight: 600 }}>✅ 활성</span>
                  <span style={{ color: '#e6edf3', fontSize: '13px' }}>매일 09:00 UTC (필리핀 17:00, 한국 18:00)</span>
                </div>
                <div style={{ color: '#555', fontSize: '12px' }}>GitHub Actions → scripts/auto_update.py → Hugging Face 크롤링 → Supabase 업데이트</div>
              </div>
            </div>

            {/* 방문자 통계 (update_logs 기반) */}
            <div>
              <div style={{ fontSize: '11px', color: '#b89640', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>📊 업데이트 활동 (최근 14일)</div>
              <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px 20px' }}>
                {visitorsLoading ? (
                  <div style={{ color: '#555', fontSize: '13px' }}>로딩 중...</div>
                ) : visitors.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {visitors.map(([date, count]) => {
                        const maxCount = Math.max(...visitors.map(([, c]) => c))
                        const pct = Math.round((count / maxCount) * 100)
                        return (
                          <div key={date} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '80px', color: '#666', fontSize: '11px', fontFamily: 'monospace', flexShrink: 0 }}>{date}</div>
                            <div style={{ flex: 1, height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(0,255,136,0.4)', borderRadius: '4px', transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ width: '30px', color: '#888', fontSize: '11px', textAlign: 'right', flexShrink: 0 }}>{count}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ color: '#555', fontSize: '11px', marginTop: '12px' }}>* update_logs 기반 활동 집계</div>
                  </>
                ) : (
                  <div style={{ color: '#555', fontSize: '13px' }}>데이터 없음</div>
                )}
              </div>
            </div>
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

// ── 링크 폼 ──────────────────────────────────────────────────
function LinkForm({ link, onChange, onSave, onCancel, title }: {
  link: Partial<LinkItem>
  onChange: (v: Partial<LinkItem>) => void
  onSave: () => void
  onCancel: () => void
  title: string
}) {
  const inp = { width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block' as const, color: '#888', fontSize: '11px', marginBottom: '4px' }
  return (
    <div style={{ background: '#161b22', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
      <div style={{ color: '#00ff88', fontWeight: 700, fontSize: '13px', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={lbl}>이름 *</label>
          <input value={link.name || ''} onChange={e => onChange({ ...link, name: e.target.value })} style={inp} placeholder="Product Hunt" />
        </div>
        <div>
          <label style={lbl}>카테고리 *</label>
          <select value={link.category || 'community'} onChange={e => onChange({ ...link, category: e.target.value })} style={inp}>
            <option value="books">books</option>
            <option value="devtools">devtools</option>
            <option value="community">community</option>
            <option value="research">research</option>
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>URL *</label>
          <input value={link.url || ''} onChange={e => onChange({ ...link, url: e.target.value })} style={inp} placeholder="https://..." />
        </div>
        <div>
          <label style={lbl}>설명 (영문)</label>
          <input value={link.description || ''} onChange={e => onChange({ ...link, description: e.target.value })} style={inp} placeholder="English description" />
        </div>
        <div>
          <label style={lbl}>설명 (한글)</label>
          <input value={link.description_ko || ''} onChange={e => onChange({ ...link, description_ko: e.target.value })} style={inp} placeholder="한글 설명" />
        </div>
        <div>
          <label style={lbl}>정렬 순서</label>
          <input type="number" value={link.sort_order || 99} onChange={e => onChange({ ...link, sort_order: Number(e.target.value) })} style={inp} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
          <input type="checkbox" checked={link.is_visible ?? true} onChange={e => onChange({ ...link, is_visible: e.target.checked })} style={{ width: '14px', height: '14px', accentColor: '#00ff88' }} />
          <label style={{ color: '#888', fontSize: '12px' }}>노출</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} style={{ padding: '8px 20px', borderRadius: '6px', background: '#00ff88', border: 'none', color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>저장</button>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: '13px', cursor: 'pointer' }}>취소</button>
      </div>
    </div>
  )
}

// ── 공통 결과 테이블 ──────────────────────────────────────────
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
                {r.official_url ? <a href={r.official_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#4a8adf' }}>{r.official_url}</a> : '-'}
              </td>
              {showDupeOf && <td style={{ padding: '8px 14px', color: '#666', fontSize: '12px' }}>{(r as any)._duplicate_of_id || '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
