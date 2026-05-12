'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl" style={{background:'rgba(8,10,15,0.85)'}}>
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl" style={{color:'var(--accent)'}}>AI</span>
          <span className="font-display text-2xl text-white">MAP</span>
          <span className="badge badge-green font-mono text-xs ml-1 pulse">LIVE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="btn-ghost text-sm">탐색</Link>
          <Link href="/request" className="btn-ghost text-sm">등록 요청</Link>
          <Link href="/auth" className="btn-primary text-sm ml-2">시리얼 인증</Link>
        </nav>
        <button className="md:hidden btn-ghost text-sm" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 flex flex-col gap-2" style={{background:'rgba(8,10,15,0.95)'}}>
          <Link href="/" className="btn-ghost text-sm text-left">탐색</Link>
          <Link href="/request" className="btn-ghost text-sm text-left">등록 요청</Link>
          <Link href="/auth" className="btn-primary text-sm text-center">시리얼 인증</Link>
        </div>
      )}
    </header>
  )
}
