'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function AuthPage() {
  const [code, setCode]     = useState('')
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ok:boolean,msg:string}|null>(null)

  async function handleAuth() {
    if (!code.trim() || !email.trim()) { setResult({ok:false,msg:'ì½”ë“œ?€ ?´ë©”?¼ì„ ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.'}); return }
    setLoading(true)
    try {
      const { data: serial, error } = await supabase.from('serial_codes').select('*').eq('code', code.trim().toUpperCase()).single()
      if (error || !serial) { setResult({ok:false,msg:'? íš¨?˜ì? ?Šì? ?œë¦¬??ì½”ë“œ?…ë‹ˆ??'}); return }
      if (serial.is_used) { setResult({ok:false,msg:'?´ë? ?¬ìš©??ì½”ë“œ?…ë‹ˆ??'}); return }
      const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { data: { serial_code: code.trim().toUpperCase() } } })
      if (authError) throw authError
      setResult({ok:true,msg:`${email}ë¡??¸ì¦ ë§í¬ë¥?ë°œì†¡?ˆìŠµ?ˆë‹¤!`})
    } catch(e:any) { setResult({ok:false,msg:e.message||'?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'}) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card p-8">
          <h1 className="font-display text-3xl mb-2" style={{color:'var(--accent)'}}>?œë¦¬??ì½”ë“œ ?¸ì¦</h1>
          <p className="text-gray-500 text-sm mb-8">ì±??´ë? ?œë¦¬??ì½”ë“œë¡?ë¬´ì œ???´ìš©ê¶Œì„ ?œì„±?”í•˜?¸ìš”.</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-mono mb-1 block">?œë¦¬??ì½”ë“œ</label>
              <input className="input-field font-mono tracking-widest uppercase" value={code} onChange={e=>setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" maxLength={20}/>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-mono mb-1 block">?´ë©”??/label>
              <input className="input-field" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/>
            </div>
            <button className="btn-primary w-full" onClick={handleAuth} disabled={loading}>{loading ? 'ì²˜ë¦¬ ì¤?..' : '?¸ì¦?˜ê¸°'}</button>
            {result && (
              <div className={`p-4 rounded-lg text-sm fade-in ${result.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {result.msg}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-8 text-center">?œë¦¬??ì½”ë“œ??1?Œë§Œ ?¬ìš© ê°€?¥í•©?ˆë‹¤.</p>
        </div>
      </div>
    </div>
  )
}
