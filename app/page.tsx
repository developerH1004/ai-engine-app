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
      <div style={{ background: 'rgba(0,255,136,0.06)', borderBottom: '1px solid rgba(0,255,136,0.15)', padding: '5px 16px', textAlign: 'center' }}>
        <a href="https://zenodo.org/records/20248631" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#00cc6a', fontFamily: 'monospace', textDecoration: 'none' }}>
          📄 GAIT 69: Global AI Index Taxonomy &nbsp;·&nbsp; DOI: 10.5281/zenodo.20248631 &nbsp;·&nbsp; Author: DO HUN, KIM
        </a>
      </div>

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
        <section style={{ padding: "16px 0 12px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <p className="font-mono text-xs text-green-400 tracking-widest mb-3 pulse" style={{ position: 'relative', zIndex: 1 }}>{tx('liveUpdate')}</p>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <p style={{ fontSize: '11px', color: 'rgba(230,237,243,0.5)', fontFamily: 'monospace', marginBottom: '2px', lineHeight: 1, letterSpacing: '0.08em' }}>{ko ? 'AI 지도 완전판' : 'The Complete AI Atlas'}</p>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(28px, 3.2vw, 40px)', color: '#e6edf3', lineHeight: 1.1, marginBottom: '10px', letterSpacing: '1.5px' }}>{ko ? '이거봐!!! AI가 다 모였어' : 'WAIT, THEY ARE ALL HERE?!'}</h1>
          </div>
          <p style={{ color: "#6e7681", fontSize: "12px", maxWidth: "520px", margin: "0 auto 10px", lineHeight: 1.6, whiteSpace: 'pre-line' }}>{tx('heroDesc')}</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 16px', borderRadius: '99px', background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <span className="font-display" style={{ color: 'var(--accent)', fontSize: '20px', lineHeight: 1 }}>{displayCount.toLocaleString()}</span>
              <span className="font-mono" style={{ color: '#888', fontSize: '13px' }}>{displayLabel} · {isFiltered ? tx('searchResult') : tx('totalRegistered')}</span>
            </div>
          </div>
        </section>

        <div className="mb-2">
          <SearchBar value={searchQuery} onChange={handleSearch} placeholder={tx('searchPlaceholder')} />
        </div>

        <div className="mb-6">
          <CategoryNav selectedMain={selectedMain} selectedSub={selectedSub} onSelect={handleCategory} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
          {products.map(p => (
            <ProductCard key={p.id} product={p} isComparing={!!compareList.find(c => c.id === p.id)} onCompare={toggleCompare} />
          ))}
        </div>
      </main>
      
      {showCompare && <ComparePanel products={compareList} onClose={() => setShowCompare(false)} />}
    </div>
  )
}