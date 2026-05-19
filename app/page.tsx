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
  const [isFiltered, setIsFiltered]       = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('ai_products')
        .select('*', { count: 'exact' })

      if (selectedMain) query = query.eq('category_main', selectedMain)
      if (selectedSub) query = query.eq('category_sub', selectedSub)

      if (searchQuery.trim()) {
        const terms = expandSearchTerms(searchQuery.trim())
        const orConditions = terms.map(term => 
          `name.ilike.%${term}%,manufacturer.ilike.%${term}%,description_kr.ilike.%${term}%,description_en.ilike.%${term}%`
        ).join(',')
        query = query.or(orConditions)
      }

      const { data, count, error } = await query
        .order('name', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) throw error

      setProducts(data || [])
      if (count !== null) {
        setFilteredCount(count)
        setIsFiltered(!!(selectedMain || selectedSub || searchQuery.trim()))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedMain, selectedSub, searchQuery, page, pageSize])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleToggleCompare = (product: AIProduct) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev.filter(p => p.id !== product.id)
      if (prev.length >= MAX_COMPARE) { alert(tx('compareLimitAlert')); return prev }
      return [...prev, product]
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: '#fff' }}>
      <Header />
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px', color: 'var(--accent)' }}>GAIT 69 Master Database</h1>
          <p style={{ fontSize: '1rem', color: '#8b949e', maxWidth: '600px', margin: '0 auto 10px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {tx('subTitleDescription')}
          </p>
        </div>

        <SearchBar value={searchQuery} onChange={v => { setSearchQuery(v); setPage(0); }} placeholder={tx('searchPlaceholder')} />

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', alignItems: 'start', marginTop: '24px' }}>
          <aside style={{ position: 'sticky', top: '80px' }}>
            <CategoryNav selectedMain={selectedMain} selectedSub={selectedSub} onSelect={(m, s) => { setSelectedMain(m); setSelectedSub(s); setPage(0); }} />
          </aside>

          <section>
            {loading ? <div>{tx('loading')}</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {products.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onCompare={handleToggleCompare} 
                    isComparing={!!compareList.find(p => p.id === product.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {compareList.length > 0 && (
          <button onClick={() => setShowCompare(true)} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50, padding: '12px 24px', borderRadius: '30px' }} className="btn-primary">
            🔄 {tx('compareLabel')} ({compareList.length})
          </button>
        )}

        {showCompare && <ComparePanel products={compareList} onClose={() => setShowCompare(false)} />}
      </main>
    </div>
  )
}