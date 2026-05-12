'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function RequestPage() {
  const [type, setType]       = useState<'update'|'new'|'delete'>('new')
  const [name, setName]       = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setLoading(true)
    try {
      await supabase.from('update_requests').insert({ request_type: type, product_name: name.trim()||null, content: content.trim(), status:'pending' })
      setDone(true)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="card p-8">
          <h1 className="font-display text-3xl mb-2" style={{color:'var(--accent)'}}>업데이트 요청</h1>
          <p className="text-gray-500 text-sm mb-8">누락된 AI, 잘못된 정보, 새 버전 출시 등을 알려주세요.</p>
          {done ? (
            <div className="text-center py-8 fade-in">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-green-400 font-bold mb-2">요청이 접수되었습니다!</p>
              <button className="btn-ghost mt-6" onClick={() => { setDone(false); setContent(''); setName('') }}>추가 요청</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 font-mono mb-2 block">요청 유형</label>
                <div className="flex gap-2">
                  {([{value:'new',label:'신규 등록'},{value:'update',label:'정보 수정'},{value:'delete',label:'삭제 요청'}] as const).map(t => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-all ${type===t.value ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-mono mb-1 block">AI 제품명</label>
                <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="예: GPT-5, Claude 4..."/>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-mono mb-1 block">요청 내용 *</label>
                <textarea className="input-field min-h-[120px] resize-none" value={content} onChange={e=>setContent(e.target.value)} placeholder="공식 URL, 버전 정보 등 포함하면 더 빠릅니다"/>
              </div>
              <button className="btn-primary w-full" onClick={handleSubmit} disabled={loading||!content.trim()}>{loading ? '제출 중...' : '요청 제출'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
