'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MASTER_CODE = 'MASTER-DEVEL-OPER-H004'

export default function AuthPage() {
  const router = useRouter()
  const [code, setCode]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ok: boolean, msg: string} | null>(null)

  async function handleAuth() {
    if (!code.trim()) {
      setResult({ok: false, msg: '시리얼 코드를 입력해주세요.'})
      return
    }
    setLoading(true)
    const upperCode = code.trim().toUpperCase()

    try {
      // 마스터 코드 (관리자)
      if (upperCode === MASTER_CODE) {
        document.cookie = 'ai_map_verified=true; path=/; max-age=2592000'
        setResult({ok: true, msg: '관리자 인증 완료!'})
        setTimeout(() => router.push('/'), 800)
        return
      }

      // 이메일 확인
      if (!email.trim()) {
        setResult({ok: false, msg: '이메일을 입력해주세요.'})
        setLoading(false)
        return
      }

      // 시리얼 코드 확인
      const { data: serial, error } = await supabase
        .from('serial_codes')
        .select('*')
        .eq('code', upperCode)
        .single()

      if (error || !serial) {
        setResult({ok: false, msg: '유효하지 않은 시리얼 코드입니다.'})
        setLoading(false)
        return
      }

      if (serial.is_used && serial.user_id) {
        setResult({ok: false, msg: '이미 다른 기기에서 사용된 코드입니다.'})
        setLoading(false)
        return
      }

      // 사용 처리
      await supabase.from('serial_codes').update({
        is_used: true,
        used_at: new Date().toISOString(),
      }).eq('code', upperCode)

      // 쿠키 설정
      document.cookie = 'ai_map_verified=true; path=/; max-age=2592000'
      document.cookie = `ai_map_code=${upperCode}; path=/; max-age=2592000`

      setResult({ok: true, msg: '인증 완료!'})
      setTimeout(() => router.push('/'), 800)

    } catch(e: any) {
      setResult({ok: false, msg: e.message || '오류가 발생했습니다.'})
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080a0f',
      backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#111318',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '40px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '36px', color: '#00ff88', fontWeight: 900, lineHeight: 1 }}>
            AI MAP
          </div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', fontFamily: 'monospace' }}>
            이거봐! AI가 모두 모였어
          </div>
        </div>

        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center' }}>
          시리얼 코드 인증
        </h1>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '28px', textAlign: 'center', lineHeight: 1.6 }}>
          책 내부에 수록된 시리얼 코드로<br/>무제한 이용권을 활성화하세요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
              시리얼 코드 *
            </label>
            <input
              style={{
                width: '100%', height: '44px',
                background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: '#fff', padding: '0 16px',
                fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.05em',
                outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box',
              }}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={30}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
              이메일
            </label>
            <input
              style={{
                width: '100%', height: '44px',
                background: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: '#fff', padding: '0 16px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <button
            onClick={handleAuth}
            disabled={loading || !code.trim()}
            style={{
              width: '100%', height: '48px',
              background: loading || !code.trim() ? '#1a4d35' : '#00ff88',
              color: loading || !code.trim() ? '#555' : '#000',
              border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: 700,
              cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '인증 중...' : '인증하기'}
          </button>

          {result && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', fontSize: '13px',
              background: result.ok ? 'rgba(0,255,136,0.1)' : 'rgba(255,80,80,0.1)',
              border: `1px solid ${result.ok ? 'rgba(0,255,136,0.3)' : 'rgba(255,80,80,0.3)'}`,
              color: result.ok ? '#00ff88' : '#ff5050',
              textAlign: 'center',
            }}>
              {result.msg}
            </div>
          )}
        </div>

        <p style={{ fontSize: '11px', color: '#444', marginTop: '24px', textAlign: 'center', lineHeight: 1.6 }}>
          시리얼 코드는 책 1권당 1개, 1회만 사용 가능합니다.<br/>
          분실 시 구매처에 문의하세요.
        </p>
      </div>
    </div>
  )
}
