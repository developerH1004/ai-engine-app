'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LangContext'
import Header from '@/components/Header'

const TYPES = [
  { value: 'new',    ko: '신규 등록', en: 'New Registration' },
  { value: 'update', ko: '정보 수정', en: 'Update Info' },
  { value: 'delete', ko: '삭제 요청', en: 'Delete Request' },
] as const

export default function RequestPage() {
  const [type, setType]       = useState<'update'|'new'|'delete'>('new')
  const [name, setName]       = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const { lang } = useLang()
  const ko = lang === 'ko'

  async function handleSubmit() {
    if (!content.trim()) return
    setLoading(true)
    try {
      await supabase.from('update_requests').insert({
        request_type: type,
        product_name: name.trim() || null,
        content: content.trim(),
        status: 'pending',
      })
      setDone(true)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 16px' }}>
        <div className="card" style={{ padding: '32px' }}>

          {/* 타이틀 */}
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '6px' }}>
            {ko ? '업데이트 요청' : 'Submit Request'}
          </h1>
          <p style={{ fontSize: '12px', color: '#6e7681', marginBottom: '28px', lineHeight: 1.6 }}>
            {ko
              ? '누락된 AI, 잘못된 정보, 새 버전 출시 등을 알려주세요.'
              : 'Let us know about missing AIs, incorrect info, or new releases.'}
          </p>

          {done ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }} className="fade-in">
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>
                {ko ? '요청이 접수되었습니다!' : 'Request submitted!'}
              </p>
              <p style={{ fontSize: '12px', color: '#6e7681', marginBottom: '24px' }}>
                {ko ? '검토 후 반영하겠습니다.' : 'We\'ll review and update accordingly.'}
              </p>
              <button className="btn-ghost" onClick={() => { setDone(false); setContent(''); setName('') }}>
                {ko ? '추가 요청' : 'Submit another'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* 요청 유형 */}
              <div>
                <label style={{ fontSize: '11px', color: '#6e7681', fontFamily: 'monospace', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  {ko ? '요청 유형' : 'Request Type'}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TYPES.map(t => {
                    const active = type === t.value
                    return (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        style={{
                          flex: 1, padding: '8px 4px',
                          borderRadius: '8px', fontSize: '12px', fontWeight: active ? 700 : 500,
                          cursor: 'pointer', transition: 'all 0.15s',
                          border: active ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          color: active ? '#00ff88' : '#6e7681',
                          background: active ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                          boxShadow: active ? '0 0 12px rgba(0,255,136,0.15)' : 'none',
                        }}
                      >
                        {ko ? t.ko : t.en}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* AI 제품명 */}
              <div>
                <label style={{ fontSize: '11px', color: '#6e7681', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                  {ko ? 'AI 제품명' : 'AI Product Name'}
                </label>
                <input
                  className="input-field"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={ko ? '예: GPT-5, Claude 4...' : 'e.g. GPT-5, Claude 4...'}
                />
              </div>

              {/* 요청 내용 */}
              <div>
                <label style={{ fontSize: '11px', color: '#6e7681', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                  {ko ? '요청 내용 *' : 'Details *'}
                </label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '120px', resize: 'none' }}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={ko
                    ? '공식 URL, 버전 정보 등 포함하면 더 빠릅니다'
                    : 'Include official URL, version info, etc. for faster processing'}
                />
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
              >
                {loading
                  ? (ko ? '제출 중...' : 'Submitting...')
                  : (ko ? '요청 제출' : 'Submit Request')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
