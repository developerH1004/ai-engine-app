// lib/useGlossary.ts
// 전문가 분석 텍스트에서 용어를 자동 감지하고 링크를 생성하는 훅

import { useMemo } from 'react'
import { GLOSSARY_DATA, GlossaryTerm } from './glossaryData'

// 용어를 길이 내림차순으로 정렬 (긴 용어 먼저 매칭)
const SORTED_TERMS = [...GLOSSARY_DATA].sort((a, b) => {
  const aLen = Math.max(a.en.length, a.kr.length)
  const bLen = Math.max(b.en.length, b.kr.length)
  return bLen - aLen
})

export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'term'; content: string; term: GlossaryTerm }

/**
 * 텍스트를 파싱해서 일반 텍스트 세그먼트와 용어 세그먼트로 분리
 */
export function parseTextWithGlossary(text: string, lang: 'ko' | 'en'): TextSegment[] {
  if (!text || !text.trim()) return []

  const segments: TextSegment[] = [{ type: 'text', content: text }]

  for (const term of SORTED_TERMS) {
    // 매칭할 단어 목록 (영문 + 한글 기본형)
    const patterns: { pattern: string; flags: string }[] = [
      { pattern: escapeRegex(term.en), flags: 'gi' },
    ]
    // 한글 괄호 앞 기본형도 추가
    const krBase = term.kr.split('(')[0].trim()
    if (krBase && krBase.length > 1) {
      patterns.push({ pattern: escapeRegex(krBase), flags: 'g' })
    }

    for (const { pattern, flags } of patterns) {
      const regex = new RegExp(`(?<![\\w가-힣>])(${pattern})(?![\\w가-힣<])`, flags)
      const newSegments: TextSegment[] = []

      for (const seg of segments) {
        if (seg.type !== 'text') { newSegments.push(seg); continue }

        const parts = seg.content.split(regex)
        if (parts.length === 1) { newSegments.push(seg); continue }

        for (let i = 0; i < parts.length; i++) {
          if (!parts[i]) continue
          if (i % 2 === 0) {
            newSegments.push({ type: 'text', content: parts[i] })
          } else {
            newSegments.push({ type: 'term', content: parts[i], term })
          }
        }
      }

      segments.splice(0, segments.length, ...newSegments)
    }
  }

  return segments.filter(s => s.content.length > 0)
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function useGlossary() {
  const terms = useMemo(() => GLOSSARY_DATA, [])
  const findTerm = (id: string) => terms.find(t => t.id === id)
  return { terms, findTerm, parseTextWithGlossary }
}
