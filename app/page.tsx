'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, AIProduct } from '@/lib/supabase'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import CategoryNav from '@/components/CategoryNav'
import ProductCard from '@/components/ProductCard'
import ComparePanel from '@/components/ComparePanel'

const PAGE_SIZE = 48

export default function Home() {
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

  useEffect(() => {
    supabase.from('ai_products').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalCount(count || 0))
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let countQ = supabase.from('ai_products').select('id', { count: 'exact', head: true })
      if (selectedMain) countQ = countQ.eq('category_main', selectedMain)
      if (selectedSub)  countQ = countQ.eq('category_sub', selectedSub)
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`
        countQ = countQ.or(`product_name.ilike.${q},manufacturer.ilike.${q},description.ilike.${q}`)
      }
      const { count } = await countQ
      setFilteredCount(count || 0)

      let dataQ = supabase.from('ai_products').select('*')
        .order('category_main').order('product_name')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (selectedMain) dataQ = dataQ.eq('category_main', selectedMain)
      if (selectedSub)  dataQ = dataQ.eq('category_sub', selectedSub)
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`
        dataQ = dataQ.or(`product_name.ilike.${q},manufacturer.ilike.${q},description.ilike.${q}`)
      }
      const { data, error } = await dataQ
      if (error) throw error
      if (data && data.length > 0) {
        const ids = data.map((p: any) => p.id)
        const { data: versions } = await supabase.from('ai_versions').select('*').in('product_id', ids).order('sort_order')
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
  }, [selectedMain, selectedSub, searchQuery, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function handleSearch(val: string) { setSearchQuery(val); setPage(0) }
  function handleCategory(main: string, sub: string) {
    setSelectedMain(main); setSelectedSub(sub); setPage(0); setSearchQuery('')
  }
  function toggleCompare(product: AIProduct) {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id)
      if (prev.length >= 5) { alert('최대 5개까지 비교 가능합니다.'); return prev }
      return [...prev, product]
    })
  }
  function resetCompare() {
    setCompareList([])
    setShowCompare(false)
  }

  const displayCount = (selectedMain || selectedSub || searchQuery) ? filteredCount : totalCount
  const displayLabel = searchQuery
    ? `"${searchQuery}"`
    : selectedSub ? selectedSub.replace(/^\d+-\d+\.\s/, '')
    : selectedMain ? selectedMain.replace(/^\d+\.\s/, '')
    : '전체'

  return (
    <div className="min-h-screen grid-bg">
      <Header />

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
            <span style={{ fontSize: '12px', color: '#00ff88', fontFamily: 'monospace' }}>⚖️ 비교 선택:</span>
            {compareList.map(p => (
              <span key={p.id} style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88', display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                {p.product_name}
                <button
                  onClick={() => toggleCompare(p)}
                  style={{ background: 'none', border: 'none', color: '#00cc6a', cursor: 'pointer', padding: 0, fontSize: '11px' }}
                >✕</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCompare(true)}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '12px' }}
            >
              비교하기 ({compareList.length}개)
            </button>
            <button
              onClick={resetCompare}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              초기화
            </button>
          </div>
        </div>
      )}

      <main className="max-w-screen-xl mx-auto px-4 pb-20">
        <section className="py-10 text-center">
          <p className="font-mono text-xs text-green-400 tracking-widest mb-3 pulse">
            LIVE DATABASE · 매일 자정 자동 업데이트
          </p>
          <h1 className="font-display text-6xl md:text-7xl text-white leading-none mb-2">이거봐!</h1>
          <h2 className="font-display text-4xl md:text-5xl glow-text mb-4" style={{ color: 'var(--accent)' }}>
            AI가 모두 모였어
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed mb-6">
            전 세계 실존하는 모든 AI를 한눈에.<br />
            대분류·세분류별 탐색, 전문가 분석, 실시간 업데이트.
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
                {displayLabel} · {(selectedMain || selectedSub || searchQuery) ? '검색 결과' : '개 AI 등록됨'}
              </span>
            </div>
          </div>
        </section>

        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={handleSearch} placeholder="AI 이름, 제조사, 기능으로 검색... (전체 DB 검색)" />
        </div>

        <CategoryNav selectedMain={selectedMain} selectedSub={selectedSub} onSelect={handleCategory} />

        <div className="flex items-center justify-between mt-6 mb-4">
          <div className="flex items-center gap-3">
            {(selectedMain || searchQuery) && (
              <button
                onClick={() => { setSelectedMain(''); setSelectedSub(''); setSearchQuery(''); setPage(0) }}
                className="btn-ghost text-xs"
              >
                ✕ 초기화
              </button>
            )}
            <span className="text-gray-500 text-sm font-mono">
              {displayCount.toLocaleString()}개 중 {products.length}개 표시
              {page > 0 && ` · 페이지 ${page + 1}`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
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
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isComparing={!!compareList.find(c => c.id === p.id)}
                onCompare={toggleCompare}
              />
            ))}
          </div>
        )}

        {filteredCount > PAGE_SIZE && (
          <div className="flex justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost disabled:opacity-30"
            >← 이전</button>
            <span className="flex items-center text-gray-500 font-mono text-sm">
              {page + 1} / {Math.ceil(filteredCount / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= filteredCount}
              className="btn-ghost disabled:opacity-30"
            >다음 →</button>
          </div>
        )}
      </main>

      {showCompare && compareList.length > 0 && (
        <ComparePanel products={compareList} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}
