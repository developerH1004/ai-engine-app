// components/GlossaryText.tsx
// 텍스트에서 용어를 자동 감지해 파란 링크로 렌더링

'use client'
import { parseTextWithGlossary } from '@/lib/useGlossary'
import { GlossaryTerm } from '@/lib/glossaryData'
import { useLang } from '@/lib/LangContext'

export default function GlossaryText({
  text,
  onTermClick,
  style,
}: {
  text: string
  onTermClick: (term: GlossaryTerm) => void
  style?: React.CSSProperties
}) {
  const { lang } = useLang()
  const segments = parseTextWithGlossary(text, lang as 'ko' | 'en')

  return (
    <span style={style}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.content}</span>
        ) : (
          <span
            key={i}
            onClick={e => { e.stopPropagation(); onTermClick(seg.term) }}
            title={lang === 'ko' ? seg.term.kr : seg.term.en}
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {seg.content}
          </span>
        )
      )}
    </span>
  )
}
