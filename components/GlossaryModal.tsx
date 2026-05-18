// components/GlossaryModal.tsx
// 용어 설명 팝업 컴포넌트

'use client'
import { GlossaryTerm } from '@/lib/glossaryData'
import { useLang } from '@/lib/LangContext'

export default function GlossaryModal({
  term,
  onClose,
}: {
  term: GlossaryTerm | null
  onClose: () => void
}) {
  const { lang } = useLang()
  if (!term) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111318',
          border: '1px solid rgba(0,255,136,0.2)',
          borderRadius: '14px',
          width: '100%', maxWidth: '520px',
          maxHeight: '80vh', overflowY: 'auto',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '14px', right: '16px',
            background: 'none', border: 'none',
            color: '#555', fontSize: '20px', cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>

        {/* 배지 */}
        <div style={{
          display: 'inline-block', marginBottom: '10px',
          padding: '3px 8px', borderRadius: '5px',
          background: 'rgba(0,255,136,0.1)',
          border: '1px solid rgba(0,255,136,0.2)',
          fontSize: '10px', fontFamily: 'monospace', color: '#00ff88',
        }}>
          📖 AI 용어 해설 · {term.id}
        </div>

        {/* 용어명 */}
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '3px' }}>
          {term.en}
        </div>
        <div style={{ fontSize: '14px', color: '#00cc6a', marginBottom: '16px' }}>
          {term.kr}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }} />

        {/* 정의 — 현재 언어 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, color: '#555',
            textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px',
            fontFamily: 'monospace',
          }}>
            {lang === 'ko' ? '정의' : 'Definition'}
          </div>
          <div style={{
            fontSize: '13px', color: '#ccc', lineHeight: 1.7,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px', padding: '12px',
          }}>
            {lang === 'ko' ? term.def_kr : term.def_en}
          </div>
        </div>

        {/* 반대 언어 정의 */}
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 700, color: '#444',
            textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px',
            fontFamily: 'monospace',
          }}>
            {lang === 'ko' ? 'English' : '한국어'}
          </div>
          <div style={{
            fontSize: '12px', color: '#666', lineHeight: 1.65,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px', padding: '10px',
          }}>
            {lang === 'ko' ? term.def_en : term.def_kr}
          </div>
        </div>

        {/* 세분류 코드 */}
        <div style={{ marginTop: '14px', fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>
          Category: {term.code}
        </div>
      </div>
    </div>
  )
}
