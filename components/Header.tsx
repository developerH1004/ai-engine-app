'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { lang, setLang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl"
      style={{ background: 'rgba(8,10,15,0.90)' }}
    >
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-2xl" style={{ color: 'var(--accent)' }}>AI</span>
          <span className="font-display text-2xl text-white">MAP</span>
          <span className="badge badge-green font-mono text-xs ml-1 pulse">LIVE</span>
        </Link>

        {/* DOI 배지 (중앙, 데스크탑만) */}
        <a
          href="https://zenodo.org/records/20248631"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono"
          style={{
            background: 'rgba(0,255,136,0.06)',
            border: '1px solid rgba(0,255,136,0.18)',
            color: '#00cc6a',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
          title="GAIT 69: Global AI Index Taxonomy"
        >
          <span style={{ opacity: 0.6 }}>DOI</span>
          10.5281/zenodo.20248631
        </a>

        {/* 네비 + 언어 전환 */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="btn-ghost text-sm">{tx('navExplore')}</Link>
          <Link href="/request" className="btn-ghost text-sm">{tx('navRequest')}</Link>

          {/* 언어 전환 버튼 */}
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="btn-ghost text-sm ml-1 font-mono"
            style={{
              border: '1px solid rgba(0,255,136,0.3)',
              color: 'var(--accent)',
              padding: '6px 12px',
              minWidth: '54px',
            }}
            title="Toggle language / 언어 전환"
          >
            {lang === 'ko' ? '🇺🇸 EN' : '🇰🇷 KO'}
          </button>

          <Link href="/auth" className="btn-primary text-sm ml-2">{tx('navAuth')}</Link>
        </nav>

        {/* 모바일: 언어 버튼 + 햄버거 */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="btn-ghost text-xs font-mono px-2"
            style={{ border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)' }}
          >
            {lang === 'ko' ? 'EN' : 'KO'}
          </button>
          <button className="btn-ghost text-sm" onClick={() => setOpen(!open)}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <div
          className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-2"
          style={{ background: 'rgba(8,10,15,0.97)' }}
        >
          <Link href="/" className="btn-ghost text-sm text-left">{tx('navExplore')}</Link>
          <Link href="/request" className="btn-ghost text-sm text-left">{tx('navRequest')}</Link>
          <a
            href="https://zenodo.org/records/20248631"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono px-2 py-1"
            style={{ color: '#00cc6a' }}
          >
            DOI: 10.5281/zenodo.20248631
          </a>
          <Link href="/auth" className="btn-primary text-sm text-center">{tx('navAuth')}</Link>
        </div>
      )}
    </header>
  )
}
