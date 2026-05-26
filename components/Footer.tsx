'use client'
import { useLang } from '@/lib/LangContext'

export default function Footer() {
  const { lang } = useLang()
  const ko = lang === 'ko'

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.1)',
      background: '#0a0d12',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#8b949e', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
          📄 DOI&nbsp;&nbsp;
          <span style={{ color: '#00cc6a', fontWeight: 700 }}>10.5281/zenodo.20248631</span>
          &nbsp;·&nbsp;
          <span style={{ color: '#6e7681' }}>GAIT 69: Global AI Index Taxonomy</span>
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: '#6e7681' }}>
          © {new Date().getFullYear()} DO HUN, KIM · AI MAP — GAIT 69 · All rights reserved
        </p>
      </div>
    </footer>
  )
}
