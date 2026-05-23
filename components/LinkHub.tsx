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

type Category = {
  key: string
  labelKo: string
  labelEn: string
  icon: string
}

const CATEGORIES: Category[] = [
  { key: 'books',     labelKo: '책 구매',    labelEn: 'Books',       icon: '📚' },
  { key: 'research',  labelKo: '연구·학술',  labelEn: 'Research',    icon: '🔬' },
  { key: 'devtools',  labelKo: '개발 도구',  labelEn: 'Dev Tools',   icon: '⚙️' },
  { key: 'community', labelKo: '커뮤니티',   labelEn: 'Community',   icon: '📣' },
]

export default function LinkHub({ onClose }: { onClose: () => void }) {
  const { lang } = useLang()
  const ko = lang === 'ko'
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('books')
  const drawerRef = useRef<HTMLDivElement>(null)

  // Supabase 직접 fetch (클라이언트 환경변수 사용)
  useEffect(() => {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) { setLoading(false); return }

    fetch(`${url}/rest/v1/links?is_visible=eq.true&order=sort_order.asc`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
      .then(r => r.json())
      .then((data: LinkItem[]) => { setLinks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // 바깥 클릭 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // ESC 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = links.filter(l => l.category === activeTab)
  const activeCat = CATEGORIES.find(c => c.key === activeTab)!

  return (
    <>
      {/* 오버레이 */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 49,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      }} />

      {/* 드로어 */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          width: '340px', maxWidth: '92vw',
          background: '#0d1117',
          borderLeft: '1px solid rgba(0,255,136,0.15)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          animation: 'slideInRight 0.22s ease-out',
        }}
      >
        {/* 상단 헤더 */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00cc6a', letterSpacing: '1px', marginBottom: '2px' }}>
              GAIT69 · LINK HUB
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>
              {ko ? '바로가기 링크 모음' : 'Quick Links'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', color: '#8b949e', fontSize: '16px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8b949e' }}
          >✕</button>
        </div>

        {/* 시리얼 인증 버튼 */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <a
            href="/auth"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.2)',
              color: '#00ff88', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.14)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.08)' }}
          >
            <span style={{ fontSize: '16px' }}>🔑</span>
            <div>
              <div>{ko ? '시리얼 번호 인증' : 'Serial / License Auth'}</div>
              <div style={{ fontSize: '10px', fontWeight: 400, color: '#00cc6a', marginTop: '1px' }}>
                {ko ? '프리미엄 기능 잠금 해제' : 'Unlock premium features'}
              </div>
            </div>
          </a>
        </div>

        {/* 카테고리 탭 */}
        <div style={{
          display: 'flex', gap: '4px', padding: '12px 20px 0',
          overflowX: 'auto',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                flexShrink: 0,
                padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                border: activeTab === cat.key
                  ? '1px solid rgba(0,255,136,0.5)'
                  : '1px solid rgba(255,255,255,0.07)',
                background: activeTab === cat.key
                  ? 'rgba(0,255,136,0.12)'
                  : 'rgba(255,255,255,0.03)',
                color: activeTab === cat.key ? '#00ff88' : '#8b949e',
              }}
            >
              {cat.icon} {ko ? cat.labelKo : cat.labelEn}
            </button>
          ))}
        </div>

        {/* 링크 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
          {loading ? (
            <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', paddingTop: '40px' }}>
              {ko ? '불러오는 중...' : 'Loading...'}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', paddingTop: '40px' }}>
              {ko ? '링크가 없습니다.' : 'No links yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(0,255,136,0.06)'
                    el.style.borderColor = 'rgba(0,255,136,0.2)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(255,255,255,0.03)'
                    el.style.borderColor = 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e6edf3', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {link.name}
                    </div>
                    {(ko ? link.description_ko : link.description) && (
                      <div style={{ fontSize: '11px', color: '#6e7681', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ko ? link.description_ko : link.description}
                      </div>
                    )}
                  </div>
                  <span style={{ color: '#444', fontSize: '12px', flexShrink: 0 }}>↗</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* DOI 배지 하단 고정 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <a
            href="https://zenodo.org/records/20248631"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '6px',
              background: 'rgba(0,204,106,0.05)',
              border: '1px solid rgba(0,204,106,0.12)',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace' }}>📄 DOI</span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00cc6a' }}>10.5281/zenodo.20248631</span>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
