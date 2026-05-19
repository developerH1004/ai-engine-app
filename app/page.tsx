'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, AIProduct } from '@/lib/supabase'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import { expandSearchTerms } from '@/lib/searchDict'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import CategoryNav from '@/components/CategoryNav'
import ProductCard from '@/components/ProductCard'
import ComparePanel from '@/components/ComparePanel'

const DEFAULT_PAGE_SIZE = 20
const MAX_COMPARE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]

export default function Home() {
  const { lang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key
  const ko = lang === 'ko'

  const [products, setProducts]           = useState<AIProduct[]>([])
  const [loading, setLoading]             = useState(true)
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedMain, setSelectedMain]   = useState('')
  const [selectedSub, setSelectedSub]     = useState('')
  const [compareList, setCompareList]     = useState<AIProduct[]>([])
  const [showCompare, setShowCompare]     = useState(false)
  const [totalCount, setTotalCount]       = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [page, setPage]                   = useState(0)
  const [pageSize, setPageSize]           = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    supabase.from('ai_products').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalCount(count || 0))
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

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function handleSearch(val: string) { setSearchQuery(val); setPage(0) }
  function handleCategory(main: string, sub: string) {
    setSelectedMain(main); setSelectedSub(sub); setPage(0); setSearchQuery('')
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

  const expandedTerms = searchQuery ? expandSearchTerms(searchQuery).filter(t => t !== searchQuery.toLowerCase()) : []

  return (
    <div className="min-h-screen grid-bg">
      {/* DOI 최상단 배너 */}
      <div style={{
        background: 'rgba(0,255,136,0.06)',
        borderBottom: '1px solid rgba(0,255,136,0.15)',
        padding: '5px 16px',
        textAlign: 'center',
      }}>
        <a href="https://zenodo.org/records/20248631" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '11px', color: '#00cc6a', fontFamily: 'monospace', textDecoration: 'none' }}>
          📄 GAIT 69: Global AI Index Taxonomy &nbsp;·&nbsp;
          DOI: 10.5281/zenodo.20248631 &nbsp;·&nbsp;
          Author: DO HUN, KIM &nbsp;·&nbsp;
          <span style={{ textDecoration: 'underline' }}>zenodo.org/records/20248631</span>
        </a>
      </div>

      <Header />

      {/* 비교 선택 바 */}
      {compareList.length > 0 && (
        <div style={{
          position: 'sticky', top: '56px', zIndex: 39,
          background: 'rgba(0,20,10,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,255,136,0.3)',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#00ff88', fontFamily: 'monospace' }}>
              {tx('compareSelected')}
            </span>
            {compareList.map(p => (
              <span key={p.id} style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88', display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                {p.product_name}
                <button onClick={() => toggleCompare(p)}
                  style={{ background: 'none', border: 'none', color: '#00cc6a', cursor: 'pointer', padding: 0, fontSize: '11px' }}>✕</button>
              </span>
            ))}
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>
              {compareList.length}/{MAX_COMPARE}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCompare(true)} className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '12px' }}>
              {tx('compareBtn')} ({compareList.length})
            </button>
            <button onClick={resetCompare} className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px' }}>
              {tx('compareReset')}
            </button>
          </div>
        </div>
      )}

      <main className="max-w-screen-xl mx-auto px-4 pb-20">
        {/* ── 히어로 (새 타이틀) ── */}
        <section className="py-10 text-center" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* 배경 글로우 효과 */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px', height: '300px',
            background: 'radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <p className="font-mono text-xs text-green-400 tracking-widest mb-3 pulse" style={{ position: 'relative', zIndex: 1 }}>
            {tx('liveUpdate')}
          </p>

          {ko ? (
            /* 한국어 타이틀 */
            <div style={{ display: 'inline-block', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace', marginBottom: '2px', lineHeight: 1 }}>
                AI 지도 완전판
              </p>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 80px)', color: '#ffffff', lineHeight: 1, marginBottom: '16px', letterSpacing: '1px' }}>
                이거봐!!! AI가 다 모였어
              </h1>
            </div>
          ) : (
            /* 영문 타이틀 */
            <div style={{ display: 'inline-block', textAlign: 'left' }}>
              <p style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace', marginBottom: '2px', lineHeight: 1 }}>
                The Complete AI Atlas
              </p>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 80px)', color: '#ffffff', lineHeight: 1, marginBottom: '16px', letterSpacing: '1px' }}>
                WAIT, THEY&apos;RE ALL HERE?!
              </h1>
            </div>
          )}

          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed mb-6" style={{ whiteSpace: 'pre-line' }}>
            {tx('heroDesc')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 24px', borderRadius: '99px',
              background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
            }}>
              <span className="font-display" style={{ color: 'var(--accent)', fontSize: '28px', lineHeight: 1 }}>
                {displayCount.toLocaleString()}
              </span>
              <span className="font-mono" style={{ color: '#888', fontSize: '13px' }}>
                {displayLabel} · {isFiltered ? tx('searchResult') : tx('totalRegistered')}
              </span>
            </div>
          </div>
        </section>

        {/* 검색 */}
        <div className="mb-2">
          <SearchBar value={searchQuery} onChange={handleSearch} placeholder={tx('searchPlaceholder')} />
        </div>

        {searchQuery && expandedTerms.length > 0 && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>🔄 also searching:</span>
            {expandedTerms.map(term => (
              <span key={term} className="badge badge-gray" style={{ fontSize: '10px' }}>{term}</span>
            ))}
          </div>
        )}

        <div className="mb-6">
          <CategoryNav selectedMain={selectedMain} selectedSub={selectedSub} onSelect={handleCategory} />
        </div>

        <div className="flex items-center justify-between mt-2 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {(selectedMain || searchQuery) && (
              <button onClick={() => { setSelectedMain(''); setSelectedSub(''); setSearchQuery(''); setPage(0) }}
                className="btn-ghost text-xs">{tx('resetFilter')}</button>
            )}
            <span className="text-gray-500 text-sm font-mono">
              {displayCount.toLocaleString()} {tx('showing')} {products.length} {tx('shown')}
              {page > 0 && ` · ${tx('page')} ${page + 1}`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>
              {ko ? '페이지당' : 'Per page'}:
            </span>
            {PAGE_SIZE_OPTIONS.map(n => (
              <button key={n} onClick={() => handlePageSize(n)}
                className={`badge cursor-pointer text-xs ${pageSize === n ? 'badge-green' : 'badge-gray'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 그리드 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
              <div key={i} className="card p-4 h-44 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-800 rounded w-full mb-2" />
                <div className="h-3 bg-gray-800 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">🔍</div>
            <p>{tx('noResult')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
            {products.map(p => (
              <ProductCard key={p.id} product={p}
                isComparing={!!compareList.find(c => c.id === p.id)}
                onCompare={toggleCompare} />
            ))}
          </div>
        )}

        {filteredCount > pageSize && (
          <div className="flex justify-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="btn-ghost disabled:opacity-30">{tx('prevPage')}</button>
            <span className="flex items-center text-gray-500 font-mono text-sm">
              {page + 1} / {Math.ceil((isFiltered ? filteredCount : totalCount) / pageSize)}
            </span>
            <button onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * pageSize >= (isFiltered ? filteredCount : totalCount)}
              className="btn-ghost disabled:opacity-30">{tx('nextPage')}</button>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-8 text-center" style={{ background: 'rgba(8,10,15,0.8)' }}>
        <div className="max-w-screen-xl mx-auto px-4 space-y-2">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="https://zenodo.org/records/20248631" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#00cc6a', fontFamily: 'monospace', textDecoration: 'none' }}>
              📄 {tx('doiName')}
            </a>
            <span style={{ color: '#333', fontSize: '12px' }}>|</span>
            <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
              {tx('zenodoLabel')}: 10.5281/zenodo.20248631
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>{tx('copyright')}</p>
        </div>
      </footer>

      {showCompare && compareList.length > 0 && (
        <ComparePanel products={compareList} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}
