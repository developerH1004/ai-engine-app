"""
UI 수정 스크립트 — fix_ui.py
C:\dogfish\ai-engine-app 폴더에서 실행
"""
import os

# ── components/ProductCard.tsx ────────────────────────────────
card = """'use client'
import { AIProduct } from '@/lib/supabase'
import { useState } from 'react'

export default function ProductCard({ product, isComparing, onCompare }: {
  product: AIProduct; isComparing: boolean; onCompare: (p: AIProduct) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const active = product.versions?.filter(v => v.is_active) || []
  const depr   = product.versions?.filter(v => !v.is_active) || []

  return (
    <div className="card p-4 flex flex-col gap-2"
      style={isComparing ? {borderColor:'var(--accent)',background:'rgba(0,255,136,0.05)'} : {}}>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm leading-tight">{product.product_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{product.manufacturer} · {product.country}</p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {product.is_research_model && <span className="badge badge-orange" style={{fontSize:'10px'}}>연구모델</span>}
          <span className="badge badge-gray" style={{fontSize:'10px',maxWidth:'90px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {product.category_sub?.replace(/^\\d+-\\d+\\.\\s/,'')}
          </span>
        </div>
      </div>

      {/* 설명 */}
      {product.description && product.description !== 'nan' && (
        <div>
          <p className={`text-xs text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {product.description}
          </p>
          {product.description.length > 80 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs mt-1" style={{color:'var(--accent-dim)'}}>
              {expanded ? '접기 ▲' : '더보기 ▼'}
            </button>
          )}
        </div>
      )}

      {/* 운영버전 */}
      {active.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {active.slice(0,3).map(v => (
            <span key={v.id} className="badge badge-green" style={{fontSize:'10px'}}>{v.version_name}</span>
          ))}
          {active.length > 3 && <span className="badge badge-gray" style={{fontSize:'10px'}}>+{active.length-3}</span>}
        </div>
      )}

      {/* 구버전 */}
      {depr.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {depr.slice(0,2).map(v => (
            <span key={v.id} className="badge badge-gray line-through opacity-50" style={{fontSize:'10px'}}>{v.version_name}</span>
          ))}
          {depr.length > 2 && <span className="badge badge-gray" style={{fontSize:'10px'}}>+{depr.length-2}</span>}
        </div>
      )}

      {/* 액션 */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-auto">
        {product.official_url && (
          <a href={product.official_url} target="_blank" rel="noopener noreferrer"
            className="text-xs flex-1 text-center py-1.5 rounded-lg border border-white/10 text-gray-500 hover:text-green-400 hover:border-green-500/30 transition-all"
            onClick={e => e.stopPropagation()}>
            🔗 공식 사이트
          </a>
        )}
        <button onClick={() => onCompare(product)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
            isComparing
              ? 'border-green-500 text-green-400 bg-green-500/10'
              : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
          }`}>
          {isComparing ? '✓ 비교중' : '+ 비교'}
        </button>
      </div>
    </div>
  )
}
"""

# ── components/SearchBar.tsx ──────────────────────────────────
search = """'use client'
export default function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
      <input
        className="w-full h-12 pl-10 pr-10 rounded-xl text-sm text-white outline-none transition-all"
        style={{background:'var(--surface)', border:'1px solid var(--border)'}}
        onFocus={e => e.currentTarget.style.borderColor='var(--accent-dim)'}
        onBlur={e => e.currentTarget.style.borderColor='var(--border)'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '검색...'}
      />
      {value && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm w-6 h-6 flex items-center justify-center"
          onClick={() => onChange('')}>✕</button>
      )}
    </div>
  )
}
"""

files = {
  'components/ProductCard.tsx': card,
  'components/SearchBar.tsx': search,
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.lstrip('\n'))
    print(f'✅ {path}')

print('\n완료! 브라우저 새로고침하세요.')
