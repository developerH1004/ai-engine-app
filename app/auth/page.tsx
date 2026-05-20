'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/LangContext'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function AuthPage() {
  const router = useRouter()
  const { lang } = useLang()
  const isKorean = lang === 'ko'
  
  const [code, setCode]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ok: boolean, msg: string} | null>(null)

  // 다국어 텍스트 객체 매핑
  const t = {
    subtitle: "The Complete AI Atlas",
    title: "WAIT, THEY ARE ALL HERE?!",
    desc: isKorean 
      ? "검로드(Gumroad)에서 발급받은 라이선스 키(License Key) 또는\n도서 구매 시 동봉된 시리얼 번호(Serial Number)를 입력해 주십시오."
      : "Please enter the License Key issued from Gumroad or\nthe Serial Number included with your book purchase.",
    labelCode: "GUMROAD LICENSE KEY / BOOK SERIAL NUMBER",
    labelEmail: "BUYER EMAIL ADDRESS",
    placeholderCode: "XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX",
    placeholderEmail: "your@email.com",
    btnText: isKorean ? (loading ? '인증 중...' : '인증하기') : (loading ? 'Verifying...' : 'Verify License'),
    errEmpty: isKorean ? '시리얼 코드를 입력해주세요.' : 'Please enter your serial code.',
    msgMaster: isKorean ? '관리자 인증 완료! 메인 화면으로 이동합니다.' : 'Master authentication complete! Redirecting...',
    msgSuccess: isKorean ? '라이선스 인증 성공! 프리미 연 권한이 활성화되었습니다.' : 'License verified successfully! Premium access granted.',
    msgFailServer: isKorean ? '인증 서버와 통신 중 에러가 발생했습니다.' : 'An error occurred communicating with the server.'
  }

  async function handleAuth() {
    if (!code.trim()) {
      setResult({ok: false, msg: t.errEmpty})
      return
    }
    
    setLoading(true)
    setResult(null)

    try {
      let actualUserId = '00000000-0000-0000-0000-000000000000';
      
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          actualUserId = session.user.id;
        }
      }

      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: code.trim(),
          userId: actualUserId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        document.cookie = 'ai_map_verified=true; path=/; max-age=2592000'
        
        if (data.isMaster) {
          setResult({ok: true, msg: t.msgMaster})
        } else {
          setResult({ok: true, msg: t.msgSuccess})
        }

        setTimeout(() => router.push('/'), 1000)
      } else {
        setResult({ok: false, msg: data.message || (isKorean ? '인증에 실패했습니다.' : 'Authentication failed.')})
      }
    } catch (err) {
      setResult({ok: false, msg: t.msgFailServer})
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
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          {/* 타이틀부 좌측 정렬 블록 보존 */}
          <div style={{ textAlign: 'left', width: 'fit-content' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', marginBottom: '2px', letterSpacing: '0.5px', textTransform: 'uppercase', fontStyle: 'italic' }}>
              {t.subtitle}
            </h2>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
              {t.title}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: '#8b949e', lineHeight: 1.5, textAlign: 'center', whiteSpace: 'pre-line' }}>
            {t.desc}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px', fontFamily: 'monospace' }}>
              {t.labelCode}
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
              placeholder={t.placeholderCode}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b949e', marginBottom: '6px', fontFamily: 'monospace' }}>
              {t.labelEmail}
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
              placeholder={t.placeholderEmail}
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
          {t.btnText}
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