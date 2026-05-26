'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, AIProduct } from '@/lib/supabase'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import { expandSearchTerms } from '@/lib/searchDict'
import { parseDateRangeQuery, fetchByDateRange, DateRangeResult, summarizeDateRangeResults } from '@/lib/date_range_search'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import CategoryNav from '@/components/CategoryNav'
import ProductCard from '@/components/ProductCard'
import ComparePanel from '@/components/ComparePanel'

const DEFAULT_PAGE_SIZE = 20
const MAX_COMPARE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function Home() {
  const { lang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key
  const ko = lang === 'ko'

  const [products, setProducts]               = useState<AIProduct[]>([])
  const [loading, setLoading]                 = useState(false)
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedMain, setSelectedMain]       = useState('')
  const [selectedSub, setSelectedSub]         = useState('')
  const [compareList, setCompareList]         = useState<AIProduct[]>([])
  const [showCompare, setShowCompare]         = useState(false)
  const [totalCount, setTotalCount]           = useState(0)
  const [filteredCount, setFilteredCount]     = useState(0)
  const [page, setPage]                       = useState(0)
  const [pageSize, setPageSize]               = useState(DEFAULT_PAGE_SIZE)

  // ── 날짜 범위 검색 상태 ──────────────────────────────────
  const [dateRangeResults, setDateRangeResults]   = useState<DateRangeResult[] | null>(null)
  const [dateRangeLoading, setDateRangeLoading]   = useState(false)
  const [dateRangeQuery, setDateRangeQuery]       = useState<{from:string, to:string} | null>(null)

  // ── 리스트 표시 여부: 카테고리 선택 or 검색 시에만 true ──
  const [listVisible, setListVisible] = useState(false)

  useEffect(() => {
    supabase.from('ai_products').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalCount(count || 0))
  }, [])

  // ── 헤더 햄버거 메뉴에서 카테고리 선택 이벤트 수신 ──────
  useEffect(() => {
    function onCategorySelect(e: Event) {
      const { main, sub } = (e as CustomEvent).detail
      setSelectedMain(main)
      setSelectedSub(sub)
      setPage(0)
      setSearchQuery('')
      setDateRangeResults(null)
      setDateRangeQuery(null)
      setListVisible(true)
    }
    window.addEventListener('aimap:categorySelect', onCategorySelect)
    return () => window.removeEventListener('aimap:categorySelect', onCategorySelect)
  }, [])

  function buildOrQuery(terms: string[]) {
    return terms.flatMap(term => {
      const q = `%${term}%`
      return [
        `product_name.ilike.${q}`,
        `manufacturer.ilike.${q}`,
        `description.ilike.${q}`,
        `description_ko.ilike.${q}`,
        `category_main.ilike.${q}`,
        `category_sub.ilike.${q}`,
      ]
    }).join(',')
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const terms = searchQuery.trim() ? expandSearchTerms(searchQuery) : []
      const orStr = terms.length ? buildOrQuery(terms) : ''

      let countQ = supabase.from('ai_products').select('id', { count: 'exact', head: true })
      if (selectedMain) countQ = countQ.eq('category_main', selectedMain)
      if (selectedSub)  countQ = countQ.eq('category_sub', selectedSub)
      if (orStr)        countQ = countQ.or(orStr)
      const { count } = await countQ
      setFilteredCount(count || 0)

      let dataQ = supabase.from('ai_products').select('*')
        .order('category_main').order('product_name')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      if (selectedMain) dataQ = dataQ.eq('category_main', selectedMain)
      if (selectedSub)  dataQ = dataQ.eq('category_sub', selectedSub)
      if (orStr)        dataQ = dataQ.or(orStr)

      const { data, error } = await dataQ
      if (error) throw error

      if (data && data.length > 0) {
        const ids = data.map((p: any) => p.id)
        const { data: versions } = await supabase
          .from('ai_versions').select('*').in('product_id', ids).order('sort_order')
        setProducts(data.map((p: any) => ({
          ...p,
          versions: versions?.filter((v: any) => v.product_id === p.id) || []
        })))
      } else {
        setProducts([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedMain, selectedSub, searchQuery, page, pageSize])

  useEffect(() => {
    if (!listVisible) return
    if (dateRangeResults !== null) return
    fetchProducts()
  }, [fetchProducts, dateRangeResults, listVisible])

  // ── 검색 핸들러 ─────────────────────────────────────────
  async function handleSearch(val: string) {
    setSearchQuery(val)
    setPage(0)

    if (val.trim()) {
      setListVisible(true)
    }

    const dateRange = parseDateRangeQuery(val)
    if (dateRange) {
      setDateRangeLoading(true)
      setDateRangeQuery(dateRange)
      try {
        const results = await fetchByDateRange(dateRange)
        setDateRangeResults(results)
      } catch (e) {
        console.error(e)
        setDateRangeResults([])
      } finally {
        setDateRangeLoading(false)
      }
      return
    }

    setDateRangeResults(null)
    setDateRangeQuery(null)
  }

  function handleCategory(main: string, sub: string) {
    setSelectedMain(main)
    setSelectedSub(sub)
    setPage(0)
    setSearchQuery('')
    setDateRangeResults(null)
    setDateRangeQuery(null)
    setListVisible(true)
  }

  function handlePageSize(n: number) { setPageSize(n); setPage(0) }

  function toggleCompare(product: AIProduct) {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id)
      if (prev.length >= MAX_COMPARE) { alert(tx('compareMax')); return prev }
      return [...prev, product]
    })
  }
  function resetCompare() { setCompareList([]); setShowCompare(false) }

  const isFiltered = !!(selectedMain || selectedSub || searchQuery)
  const displayCount = isFiltered ? filteredCount : totalCount
  const displayLabel = searchQuery
    ? `"${searchQuery}"`
    : selectedSub  ? selectedSub.replace(/^\d+-\d+\.\s/, '')
    : selectedMain ? selectedMain.replace(/^\d+\.\s/, '')
    : tx('allCategory')

  const dateRangeSummary = dateRangeResults ? summarizeDateRangeResults(dateRangeResults) : null
  const dateSearchHint = ko ? '날짜검색: 260520-260524' : 'Date search: 260520-260524'
  const searchPlaceholder = tx('searchPlaceholder') + ' | ' + dateSearchHint
  const totalPages = Math.max(1, Math.ceil((isFiltered ? filteredCount : totalCount) / pageSize))

  return (
    <div className="min-h-screen grid-bg">
      <Header />

      {compareList.length > 0 && (
        <div style={{ position: 'sticky', top: '56px', zIndex: 39, background: 'rgba(0,20,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,255,136,0.3)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#00ff88', fontFamily: 'monospace' }}>{tx('compareSelected')}</span>
            {compareList.map(p => (
              <span key={p.id} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {p.product_name}
                <button onClick={() => toggleCompare(p)} style={{ background: 'none', border: 'none', color: '#00cc6a', cursor: 'pointer', padding: 0, fontSize: '11px' }}>✕</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCompare(true)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>{tx('compareBtn')} ({compareList.length})</button>
            <button onClick={resetCompare} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>{tx('compareReset')}</button>
          </div>
        </div>
      )}

      <main className="max-w-screen-xl mx-auto px-4 pb-20">

        {/* ── 히어로 섹션 ── */}
        <section style={{ padding: "32px 0 12px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <p className="font-mono text-xs text-green-400 tracking-widest pulse" style={{ position: 'relative', zIndex: 1 }}>{tx('liveUpdate')}</p>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: '#00cc6a', fontFamily: "'Noto Sans KR', 'JetBrains Mono', monospace", fontWeight: 600, marginTop: '20px', marginBottom: '6px', lineHeight: 1, letterSpacing: '0.08em' }}>{ko ? 'AI 지도 완전판' : 'The Complete AI Atlas'}</p>
            <h1 style={{ fontFamily: ko ? "'Noto Sans KR', sans-serif" : "'Bebas Neue', sans-serif", fontWeight: ko ? 300 : 400, fontSize: ko ? 'clamp(24px, 2.8vw, 32px)' : 'clamp(22px, 2.6vw, 34px)', color: '#e6edf3', lineHeight: 1.2, marginBottom: '10px', letterSpacing: ko ? '-0.5px' : '1.5px' }}>{ko ? '이거봐!!! AI가 다 모였어' : 'WAIT, THEY ARE ALL HERE?!'}</h1>
          </div>
          <p style={{ color: "#6e7681", fontSize: "12px", maxWidth: "520px", margin: "0 auto 10px", lineHeight: 1.6, whiteSpace: 'pre-line' }}>{tx('heroDesc')}</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 16px', borderRadius: '99px', background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <span className="font-display" style={{ color: 'var(--accent)', fontSize: '20px', lineHeight: 1 }}>{displayCount.toLocaleString()}</span>
              <span className="font-mono" style={{ color: '#888', fontSize: '13px' }}>{displayLabel} · {isFiltered ? tx('searchResult') : tx('totalRegistered')}</span>
            </div>
          </div>

          {/* 첫 화면 힌트 — 리스트 미표시 상태일 때 */}
          {!listVisible && (
            <p style={{ marginTop: '16px', color: '#8b949e', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {ko ? '☰ 왼쪽 메뉴에서 카테고리를 선택하거나 검색해 보세요' : '☰ Select a category from the left menu or search above'}
            </p>
          )}
        </section>

        {/* ── 검색창 ── */}
        <div className="mb-2">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* ── 날짜 범위 로딩 ── */}
        {dateRangeLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#00ff88', fontFamily: 'monospace' }}>
            📅 {ko ? '날짜 범위 검색 중...' : 'Searching date range...'}
          </div>
        )}

        {/* ── 날짜 범위 결과 ── */}
        {dateRangeResults !== null && !dateRangeLoading && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ background: 'rgba(26,43,74,0.8)', border: '1px solid rgba(184,150,64,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ color: '#b89640', fontWeight: 700, fontSize: '14px' }}>
                    📅 {dateRangeQuery?.from} ~ {dateRangeQuery?.to} {ko ? '변경 내역' : 'Change Log'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '99px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontSize: '12px', fontWeight: 600 }}>
                    🆕 {ko ? '신규' : 'New'} {dateRangeSummary?.newCount}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '99px', background: 'rgba(74,138,223,0.1)', border: '1px solid rgba(74,138,223,0.3)', color: '#4a8adf', fontSize: '12px', fontWeight: 600 }}>
                    🔄 {ko ? '업데이트' : 'Updated'} {dateRangeSummary?.updatedCount}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', fontSize: '12px' }}>
                    {ko ? '총' : 'Total'} {dateRangeSummary?.total}
                  </span>
                  <button
                    onClick={() => { setDateRangeResults(null); setDateRangeQuery(null); setSearchQuery('') }}
                    style={{ padding: '3px 10px', borderRadius: '99px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#888', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ✕ {ko ? '닫기' : 'Close'}
                  </button>
                </div>
              </div>
            </div>

            {dateRangeResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#666', fontFamily: 'monospace' }}>
                {ko ? '해당 기간에 변경된 항목이 없습니다.' : 'No changes found in this date range.'}
              </div>
            )}

            {dateRangeResults.length > 0 && (
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(26,43,74,0.9)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', fontWeight: 600, borderBottom: '1px solid rgba(184,150,64,0.3)' }}>{ko ? '구분' : 'Type'}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', fontWeight: 600, borderBottom: '1px solid rgba(184,150,64,0.3)' }}>{ko ? 'AI 엔진명' : 'AI Engine'}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', fontWeight: 600, borderBottom: '1px solid rgba(184,150,64,0.3)' }}>{ko ? '제조사' : 'Maker'}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', fontWeight: 600, borderBottom: '1px solid rgba(184,150,64,0.3)', whiteSpace: 'nowrap' }}>{ko ? '카테고리' : 'Category'}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', fontWeight: 600, borderBottom: '1px solid rgba(184,150,64,0.3)' }}>{ko ? '날짜' : 'Date'}</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#b89640', fontWeight: 600, borderBottom: '1px solid rgba(184,150,64,0.3)' }}>{ko ? '출처' : 'Source'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateRangeResults.map((r, i) => {
                      const date = r._change_type === '신규 추가'
                        ? (r.created_at || '').slice(0, 10)
                        : (r.updated_at  || '').slice(0, 10)
                      const isNew = r._change_type === '신규 추가'
                      return (
                        <tr key={r.id ?? i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,43,74,0.4)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                              background: isNew ? 'rgba(0,255,136,0.1)' : 'rgba(74,138,223,0.1)',
                              border: `1px solid ${isNew ? 'rgba(0,255,136,0.3)' : 'rgba(74,138,223,0.3)'}`,
                              color: isNew ? '#00ff88' : '#4a8adf',
                              whiteSpace: 'nowrap'
                            }}>
                              {isNew ? (ko ? '🆕 신규' : '🆕 New') : (ko ? '🔄 수정' : '🔄 Updated')}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px', color: '#e6edf3', fontWeight: 500 }}>
                            {r.official_url ? (
                              <a href={r.official_url} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#e6edf3', textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#00ff88')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#e6edf3')}
                              >
                                {r.product_name}
                              </a>
                            ) : r.product_name}
                          </td>
                          <td style={{ padding: '8px 14px', color: '#aaa' }}>{r.manufacturer || '-'}</td>
                          <td style={{ padding: '8px 14px', color: '#888', fontSize: '12px' }}>
                            {(ko ? r.category_main_ko : r.category_main || '-')?.replace(/^\d+\.\s/, '')}
                          </td>
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

        {/* ── 일반 검색 결과 (listVisible일 때만 표시) ── */}
        {dateRangeResults === null && listVisible && (
          <>
            <div className="mb-6">
              <CategoryNav selectedMain={selectedMain} selectedSub={selectedSub} onSelect={handleCategory} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                {ko ? `페이지 ${page + 1} / ${totalPages}` : `Page ${page + 1} / ${totalPages}`}
                {' '}·{' '}
                {ko ? `총 ${(isFiltered ? filteredCount : totalCount).toLocaleString()}개` : `${(isFiltered ? filteredCount : totalCount).toLocaleString()} total`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>{ko ? '페이지당' : 'Per page'}</span>
                {PAGE_SIZE_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => handlePageSize(n)}
                    style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                      background: pageSize === n ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
                      border: pageSize === n ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      color: pageSize === n ? '#00ff88' : '#888',
                      fontFamily: 'monospace', transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#00ff88', fontFamily: 'monospace' }}>
                  {ko ? '로딩 중...' : 'Loading...'}
                </div>
              ) : products.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#666', fontFamily: 'monospace' }}>
                  {ko ? '검색 결과가 없습니다.' : 'No results found.'}
                </div>
              ) : (
                products.map(p => (
                  <ProductCard key={p.id} product={p} isComparing={!!compareList.find(c => c.id === p.id)} onCompare={toggleCompare} />
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
                <button onClick={() => setPage(0)} disabled={page === 0}
                  style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: page === 0 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#444' : '#888', fontFamily: 'monospace' }}>«</button>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: page === 0 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: page === 0 ? '#444' : '#888', fontFamily: 'monospace' }}>{ko ? '이전' : 'Prev'}</button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p: number
                  if (totalPages <= 7) { p = i }
                  else if (page < 4) { p = i }
                  else if (page > totalPages - 5) { p = totalPages - 7 + i }
                  else { p = page - 3 + i }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', minWidth: '36px', background: page === p ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)', border: page === p ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(255,255,255,0.1)', color: page === p ? '#00ff88' : '#888', fontFamily: 'monospace', fontWeight: page === p ? 700 : 400 }}>{p + 1}</button>
                  )
                })}

                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: page >= totalPages - 1 ? '#444' : '#888', fontFamily: 'monospace' }}>{ko ? '다음' : 'Next'}</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                  style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: page >= totalPages - 1 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: page >= totalPages - 1 ? '#444' : '#888', fontFamily: 'monospace' }}>»</button>
              </div>
            )}
          </>
        )}
      </main>

      {showCompare && <ComparePanel products={compareList} onClose={() => setShowCompare(false)} />}
    </div>
  )
}
