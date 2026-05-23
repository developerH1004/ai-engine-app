'use client'
import { useRef, useEffect } from 'react'
import { useLang } from '@/lib/LangContext'

export default function PaywallModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLang()
  const ko = lang === 'ko'
  const modalRef = useRef<HTMLDivElement>(null)

  // 팝업 위치로 자동 스크롤
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  return (
    <>
      {/* 오버레이 */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 800, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* 팝업 */}
      <div
        ref={modalRef}
        style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 801,
        width: '360px', maxWidth: 'calc(100vw - 32px)',
        background: '#0d1117',
        border: '1px solid rgba(0,255,136,0.25)',
        borderRadius: '16px',
        padding: '28px 24px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,136,0.05)',
      }}>
        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '16px',
            background: 'none', border: 'none', color: '#555',
            fontSize: '20px', cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>

        {/* 아이콘 */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', marginBottom: '16px',
        }}>🔑</div>

        {/* 제목 */}
        <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          {ko ? '라이선스 구매자 전용 기능' : 'Licensed Users Only'}
        </div>

        {/* 설명 */}
        <div style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.65, marginBottom: '20px' }}>
          {ko
            ? '상세 팝업, 공식 사이트 링크, AI 비교 기능은\n라이선스 구매자에게만 제공됩니다.'
            : 'Detailed view, official site links, and AI comparison\nare available to licensed users only.'}
        </div>

        {/* 기능 목록 */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '12px 14px',
          marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '7px',
        }}>
          {[
            { icon: '📋', ko: '카드 상세 정보 팝업',   en: 'Card detail popup' },
            { icon: '🔗', ko: '공식 사이트 링크',       en: 'Official site links' },
            { icon: '⚖️', ko: 'AI 비교 기능',           en: 'AI comparison tool' },
            { icon: '🖨️', ko: '프린트 · 다운로드',      en: 'Print & download' },
          ].map(item => (
            <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6e7681' }}>
              <span style={{ fontSize: '13px' }}>{item.icon}</span>
              <span>{ko ? item.ko : item.en}</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#00cc6a' }}>✓ {ko ? '유료' : 'Licensed'}</span>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href="https://developerh.gumroad.com/l/fzuwzj"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center',
              padding: '12px', borderRadius: '8px',
              background: 'var(--accent)', color: '#000',
              fontSize: '13px', fontWeight: 800,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,136,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            {ko ? '📚 Gumroad에서 구매하기' : '📚 Buy on Gumroad'}
          </a>

          <a
            href="/auth"
            style={{
              display: 'block', textAlign: 'center',
              padding: '10px', borderRadius: '8px',
              background: 'rgba(0,255,136,0.07)',
              border: '1px solid rgba(0,255,136,0.2)',
              color: '#00cc6a', fontSize: '12px', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            🔑 {ko ? '이미 구매했어요 — 시리얼 인증' : 'Already purchased — Enter serial'}
          </a>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#555',
              fontSize: '12px', cursor: 'pointer', padding: '6px',
            }}
          >
            {ko ? '나중에 하기' : 'Maybe later'}
          </button>
        </div>
      </div>
    </>
  )
}
