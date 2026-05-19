'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    setResult(null)

    try {
      // 우리가 생성한 하이브리드 백엔드 검증 엔드포인트 호출
      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: code.trim(),
          userId: email.trim() || 'anonymous-user', // 기존 이메일 입력값 연동 (또는 고유 ID)
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 인증 성공 시 브라우저 쿠키 주입하여 프리미엄 권한 개방
        document.cookie = 'ai_map_verified=true; path=/; max-age=2592000'
        
        if (data.isMaster) {
          setResult({ok: true, msg: '관리자 인증 완료! 메인 화면으로 이동합니다.'})
        } else {
          setResult({ok: true, msg: '검로드 라이선스 인증 성공! 프리미엄 권한이 활성화되었습니다.'})
        }

        setTimeout(() => router.push('/'), 1000)
      } else {
        // 백엔드가 반환한 구체적인 실패 사유 매핑
        setResult({ok: false, msg: data.message || '인증에 실패했습니다. 코드를 다시 확인해주세요.'})
      }
    } catch (err) {
      setResult({ok: false, msg: '인증 서버와 통신 중 에러가 발생했습니다.'})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080a0f', padding: '20px', color: '#fff', fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#111318', border: '1px solid rgba(0,255,136,0.15)',
        borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#00ff88', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            GAIT 69 Premium Access
          </h1>
          <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.4 }}>
            라이선스 시리얼 코드를 입력하여<br />
            6,494개 마스터 데이터베이스 권한을 활성화하십시오.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px', fontFamily: 'monospace' }}>
              SERIAL NUMBER / LICENSE KEY
            </label>
            <input
              type="text"
              style={{
                width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px',
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'monospace'
              }}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px', fontFamily: 'monospace' }}>
              BUYER EMAIL ADDRESS
            </label>
            <input
              type="email"
              style={{
                width: '100%', height: '44px', padding: '0 12px', borderRadius: '8px',
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>
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
            transition: 'all 0.2s'
          }}
        >
          {loading ? '인증 중...' : '인증하기'}
        </button>

        {result && (
          <div style={{
            marginTop: '20px', padding: '12px 16px', borderRadius: '8px', fontSize: '13px',
            background: result.ok ? 'rgba(0,255,136,0.1)' : 'rgba(255,80,80,0.1)',
            border: `1px solid ${result.ok ? 'rgba(0,255,136,0.3)' : 'rgba(255,80,80,0.3)'}`,
            color: result.ok ? '#00ff88' : '#ff5050',
            textAlign: 'center', lineHeight: 1.4
          }}>
            {result.msg}
          </div>
        )}
      </div>
    </div>
  )
}