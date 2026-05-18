// lib/useGlossary.ts  v2
// 개선사항:
// 1) 약어 자동 확장 (LLM, RAG, TTS 등)
// 2) 괄호 앞 메인 용어도 매칭
// 3) 한글 텍스트 내 영어 단어도 감지 → 한글 정의 표시

import { useMemo } from 'react'
import { GLOSSARY_DATA, GlossaryTerm } from './glossaryData'

// 너무 짧거나 일반적인 약어는 제외 (오탐 방지)
const EXCLUDE_ABBRS = new Set(['AI', 'ML', 'IT', 'UI', 'UX', 'OR', 'ID', 'AR', 'VR', 'PR'])

// 약어·별칭 확장: "Large Language Model (LLM)" → LLM, Large Language Model 도 추가
function buildExpandedTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
  const expanded: GlossaryTerm[] = [...terms]
  const seenEn = new Set(terms.map(t => t.en.toLowerCase()))

  for (const term of terms) {
    const en = term.en

    // 괄호 안 약어: "Retrieval-Augmented Generation (RAG)" → "RAG"
    const abbrMatch = en.match(/\(([A-Z][A-Z0-9\-\/]{1,9})\)/)
    if (abbrMatch) {
      const abbr = abbrMatch[1]
      if (!EXCLUDE_ABBRS.has(abbr) && abbr.length >= 3 && !seenEn.has(abbr.toLowerCase())) {
        expanded.push({ ...term, en: abbr })
        seenEn.add(abbr.toLowerCase())
      }
    }

    // 괄호 앞 메인 용어: "Chain-of-Thought (CoT)" → "Chain-of-Thought"
    if (en.includes('(')) {
      const main = en.split('(')[0].trim().replace(/[\s\-]+$/, '')
      if (main.length > 4 && !seenEn.has(main.toLowerCase())) {
        expanded.push({ ...term, en: main })
        seenEn.add(main.toLowerCase())
      }
    }
  }

  // 길이 내림차순 정렬 (긴 용어 먼저 매칭해야 LLM보다 Large Language Model이 먼저 걸림)
  return expanded.sort((a, b) => {
    const aLen = Math.max(a.en.length, (a.kr || '').split('(')[0].trim().length)
    const bLen = Math.max(b.en.length, (b.kr || '').split('(')[0].trim().length)
    return bLen - aLen
  })
}

const EXPANDED_TERMS = buildExpandedTerms(GLOSSARY_DATA)

export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'term'; content: string; term: GlossaryTerm }

export function parseTextWithGlossary(text: string): TextSegment[] {
  if (!text?.trim()) return []

  let segments: TextSegment[] = [{ type: 'text', content: text }]

  for (const term of EXPANDED_TERMS) {
    // 영어 용어 매칭 (대소문자 무시, 단어 경계)
    const enPat = escapeRegex(term.en)
    const enReg = new RegExp(`(?<![\\w])(${enPat})(?![\\w])`, 'gi')

    // 한국어 기본형 매칭 (괄호 앞 부분)
    const krBase = (term.kr || '').split('(')[0].trim()
    const krReg = krBase.length > 1
      ? new RegExp(`(${escapeRegex(krBase)})`, 'g')
      : null

    const nextSegments: TextSegment[] = []
    for (const seg of segments) {
      if (seg.type !== 'text') { nextSegments.push(seg); continue }

      // 영어 매칭
      const parts = seg.content.split(enReg)
      if (parts.length > 1) {
        for (let i = 0; i < parts.length; i++) {
          if (!parts[i]) continue
          // split with capture group: odd indices are the matched term
          if (i % 2 === 1) {
            nextSegments.push({ type: 'term', content: parts[i], term })
          } else {
            nextSegments.push({ type: 'text', content: parts[i] })
          }
        }
        continue
      }

      // 한국어 매칭
      if (krReg) {
        const krParts = seg.content.split(krReg)
        if (krParts.length > 1) {
          for (let i = 0; i < krParts.length; i++) {
            if (!krParts[i]) continue
            if (i % 2 === 1) {
              nextSegments.push({ type: 'term', content: krParts[i], term })
            } else {
              nextSegments.push({ type: 'text', content: krParts[i] })
            }
          }
          continue
        }
      }

      nextSegments.push(seg)
    }
    segments = nextSegments
  }

  return segments.filter(s => s.content.length > 0)
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function useGlossary() {
  const terms = useMemo(() => GLOSSARY_DATA, [])
  const findTerm = (id: string) => terms.find(t => t.id === id)
  return { terms, findTerm, parseTextWithGlossary }
}
