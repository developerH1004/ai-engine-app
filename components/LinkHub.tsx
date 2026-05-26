'use client'
import { useState, useEffect, useRef } from 'react'
import { useLang } from '@/lib/LangContext'

type LinkItem = {
  id: number
  category: string
  name: string
  url: string
  description: string | null
  description_ko: string | null
  sort_order: number
}

const CATEGORIES = [
  { key: 'books',     labelKo: '📚 책 구매',   labelEn: '📚 Books'     },
  { key: 'devtools',  labelKo: '⚙️ 개발 도구', labelEn: '⚙️ Dev Tools' },
  { key: 'community', labelKo: '📣 커뮤니티',  labelEn: '📣 Community' },
]

export default function LinkHub({ onClose, anchorRef }: {
  onClose: () => void
  anchorRef?: React.RefObject<HTMLButtonElement>
}) {
  const { lang } = useLang()
  const ko = lang === 'ko'
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('books')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) { setLoading(false); return }
    fetch(`${url}/rest/v1/links?is_visible=eq.true&order=sort_order.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.json())
      .then((data: LinkItem[]) => { setLinks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // 바깥 클릭 / ESC 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        !(anchorRef?.current?.contains(e.target as Node))
      ) onClose()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, anchorRef])

  const filtered = links.filter(l => l.category === activeTab)

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: '42px',
        right: 0,
        zIndex: 200,
        width: '300px',
        maxWidth: '90vw',
        background: 'rgba(10,14,20,0.98)',
        border: '1px solid rgba(0,255,136,0.15)',
        borderRadius: '12px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '70vh',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#00cc6a', letterSpacing: '1.5px' }}>
          GAIT69 · LINK HUB
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#555',
            fontSize: '14px', cursor: 'pointer', padding: '2px 4px',
            borderRadius: '4px', lineHeight: 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >✕</button>
      </div>

      {/* 시리얼 인증 */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <a
          href="/auth"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 12px', borderRadius: '7px',
            background: 'rgba(0,255,136,0.07)',
            border: '1px solid rgba(0,255,136,0.18)',
            color: '#00ff88', textDecoration: 'none', fontSize: '12px', fontWeight: 700,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.13)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.07)')}
        >
          <span>🔑</span>
          <div>
            <div>{ko ? '시리얼 번호 인증' : 'Serial / License Auth'}</div>
            <div style={{ fontSize: '10px', fontWeight: 400, color: '#00cc6a', marginTop: '1px' }}>
              {ko ? '프리미엄 기능 잠금 해제' : 'Unlock premium features'}
            </div>
          </div>
        </a>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex', gap: '4px', padding: '8px 12px 0',
        flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            style={{
              flexShrink: 0, padding: '4px 9px', borderRadius: '5px',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              border: activeTab === cat.key ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(255,255,255,0.07)',
              background: activeTab === cat.key ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeTab === cat.key ? '#00ff88' : '#8b949e',
              transition: 'all 0.15s',
            }}
          >
            {ko ? cat.labelKo : cat.labelEn}
            {links.filter(l => l.category === cat.key).length > 0 && (
              <span style={{ marginLeft: '3px', fontSize: '9px', color: activeTab === cat.key ? '#00cc6a' : '#555' }}>
                {links.filter(l => l.category === cat.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 링크 목록 */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 12px',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,255,136,0.15) transparent',
      }}>
        {loading ? (
          <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
            {ko ? '불러오는 중...' : 'Loading...'}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
            {ko ? '링크가 없습니다.' : 'No links yet.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {filtered.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textDecoration: 'none', transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(0,255,136,0.06)'
                  el.style.borderColor = 'rgba(0,255,136,0.18)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.02)'
                  el.style.borderColor = 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.name}
                  </div>
                  {(ko ? link.description_ko : link.description) && (
                    <div style={{ fontSize: '10px', color: '#6e7681', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ko ? link.description_ko : link.description}
                    </div>
                  )}
                </div>
                <span style={{ color: '#444', fontSize: '11px', flexShrink: 0 }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* DOI */}
      <div style={{ padding: '8px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 10px', borderRadius: '5px',
          background: 'rgba(0,204,106,0.05)',
          border: '1px solid rgba(0,204,106,0.1)',
        }}>
          <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>📄 DOI</span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00cc6a' }}>
            10.5281/zenodo.20248631
          </span>
        </div>
      </div>
    </div>
  )
}
