'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import LinkHub from '@/components/LinkHub'

export default function Header() {
  const [hubOpen, setHubOpen] = useState(false)
  const { lang, setLang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(8,10,15,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* 상단 액센트 라인 */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.5) 50%, transparent 100%)',
        }} />

        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: '0 20px', height: '52px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          {/* 로고 */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'var(--accent)', letterSpacing: '2px' }}>AI</span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: '#e6edf3', letterSpacing: '2px' }}>MAP</span>
            </div>
            <span style={{
              fontSize: '9px', fontFamily: 'monospace', fontWeight: 700,
              color: 'var(--accent)', letterSpacing: '1px',
              padding: '1px 5px', borderRadius: '3px',
              border: '1px solid rgba(0,255,136,0.3)',
              background: 'rgba(0,255,136,0.08)',
              animation: 'pulse-glow 2.5s ease-in-out infinite',
            }}>LIVE</span>
          </Link>

          {/* DOI 배지 (데스크탑) */}
          <a
            href="https://zenodo.org/records/20248631"
            target="_blank" rel="noopener noreferrer"
            className="hidden md:inline-flex"
            style={{
              alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '99px',
              background: 'rgba(0,255,136,0.05)',
              border: '1px solid rgba(0,255,136,0.12)',
              color: '#00cc6a', fontSize: '11px',
              fontFamily: 'monospace', textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ opacity: 0.5, fontSize: '10px' }}>📄 DOI</span>
            10.5281/zenodo.20248631
          </a>

          {/* 우측 네비 (데스크탑) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
            <Link href="/" style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
              color: '#8b949e', textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >{tx('navExplore')}</Link>

            <Link href="/request" style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
              color: '#8b949e', textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >{tx('navRequest')}</Link>

            {/* 시리얼 인증 버튼 — 원래대로 유지 */}
            <Link href="/auth" style={{
              padding: '5px 14px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 700, color: '#000',
              background: 'var(--accent)',
              textDecoration: 'none', transition: 'all 0.15s',
              marginLeft: '4px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#00ff99'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(0,255,136,0.4)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
            >{tx('navAuth')}</Link>

            {/* 언어 전환 */}
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                fontFamily: 'monospace', fontWeight: 700,
                color: 'var(--accent)',
                background: 'rgba(0,255,136,0.07)',
                border: '1px solid rgba(0,255,136,0.2)',
                cursor: 'pointer', marginLeft: '4px',
              }}
            >{lang === 'ko' ? 'EN' : 'KO'}</button>

            {/* ☰ 메뉴 아이콘 → 링크 허브 드로어 */}
            <button
              onClick={() => setHubOpen(true)}
              title={lang === 'ko' ? '링크 허브' : 'Link Hub'}
              style={{
                padding: '5px 8px', borderRadius: '6px', fontSize: '16px',
                color: '#8b949e', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', marginLeft: '4px',
                transition: 'all 0.15s', lineHeight: 1,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.3)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#8b949e'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >☰</button>
          </nav>

          {/* 모바일 우측 */}
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                fontFamily: 'monospace', fontWeight: 700,
                color: 'var(--accent)',
                background: 'rgba(0,255,136,0.07)',
                border: '1px solid rgba(0,255,136,0.2)',
                cursor: 'pointer',
              }}
            >{lang === 'ko' ? 'EN' : 'KO'}</button>

            {/* 모바일 ☰ → 링크 허브 */}
            <button
              onClick={() => setHubOpen(true)}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '14px',
                color: '#8b949e', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              }}
            >☰</button>
          </div>
        </div>
      </header>

      {/* 링크 허브 드로어 */}
      {hubOpen && <LinkHub onClose={() => setHubOpen(false)} />}
    </>
  )
}
