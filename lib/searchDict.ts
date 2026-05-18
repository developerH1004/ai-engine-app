// ── 한글 ↔ 영문 검색 사전 ─────────────────────────────────
export const KO_TO_EN: Record<string, string[]> = {
  // 제조사
  '구글': ['google', 'deepmind'],
  '오픈ai': ['openai', 'chatgpt'],
  '오픈AI': ['openai', 'chatgpt'],
  '마이크로소프트': ['microsoft', 'copilot', 'bing'],
  '메타': ['meta', 'llama', 'facebook'],
  '애플': ['apple', 'siri'],
  '아마존': ['amazon', 'aws', 'alexa'],
  '엔비디아': ['nvidia'],
  '앤스로픽': ['anthropic', 'claude'],
  '알리바바': ['alibaba', 'qwen'],
  '바이두': ['baidu', 'ernie'],
  '텐센트': ['tencent', 'hunyuan'],
  '바이트댄스': ['bytedance', 'doubao'],
  '화웨이': ['huawei'],
  '네이버': ['naver', 'clova', 'hyperclova'],
  '카카오': ['kakao'],
  '삼성': ['samsung', 'gauss'],
  '딥시크': ['deepseek'],
  '미스트랄': ['mistral'],
  '코히어': ['cohere'],
  '허깅페이스': ['huggingface', 'hugging face'],
  '업스테이지': ['upstage', 'solar'],
  '뤼튼': ['wrtn'],
  '퍼플렉시티': ['perplexity'],
  '문샷': ['moonshot', 'kimi'],
  '미니맥스': ['minimax'],
  '그로크': ['groq'],
  '런웨이': ['runway'],
  '미드저니': ['midjourney'],
  '스태빌리티': ['stability', 'stable diffusion'],
  '일레븐랩스': ['elevenlabs'],
  '수노': ['suno'],
  '웨이모': ['waymo'],
  '테슬라': ['tesla', 'optimus'],
  '피겨': ['figure'],
  '피카': ['pika'],
  // 제품명
  '챗지피티': ['chatgpt', 'gpt'],
  '챗GPT': ['chatgpt', 'gpt'],
  '제미나이': ['gemini'],
  '제미니': ['gemini'],
  '클로드': ['claude'],
  '코파일럿': ['copilot'],
  '달리': ['dall-e', 'dalle'],
  '소라': ['sora'],
  '라마': ['llama'],
  '클로바': ['clova', 'hyperclova'],
  '하이퍼클로바': ['hyperclova'],
  '이엑사원': ['exaone'],
  '솔라': ['solar'],
  '빙': ['bing'],
  '알파폴드': ['alphafold'],
  // 카테고리/기능
  '이미지생성': ['image generation', 'text to image'],
  '이미지 생성': ['image generation', 'text to image'],
  '영상생성': ['video generation', 'text to video'],
  '영상 생성': ['video generation', 'text to video'],
  '음성합성': ['speech synthesis', 'tts'],
  '음악생성': ['music generation'],
  '코딩': ['coding', 'code', 'programming'],
  '번역': ['translation', 'translate'],
  '검색': ['search'],
  '챗봇': ['chatbot', 'chat'],
  '에이전트': ['agent', 'automation'],
  '자율주행': ['autonomous driving', 'self-driving'],
  '로봇': ['robot', 'robotics'],
  '의료': ['medical', 'healthcare'],
  '법률': ['legal', 'law'],
  '금융': ['finance', 'fintech'],
  '교육': ['education', 'learning'],
  '보안': ['security', 'cybersecurity'],
}

export const EN_TO_KO: Record<string, string[]> = {
  'gemini': ['제미나이', '제미니'],
  'chatgpt': ['챗지피티'],
  'gpt': ['챗지피티'],
  'claude': ['클로드'],
  'copilot': ['코파일럿'],
  'llama': ['라마'],
  'midjourney': ['미드저니'],
  'stable diffusion': ['스테이블 디퓨전'],
  'sora': ['소라'],
  'dall-e': ['달리'],
  'dalle': ['달리'],
}

export function expandSearchTerms(query: string): string[] {
  if (!query.trim()) return []
  const q = query.trim().toLowerCase()
  const terms = new Set<string>([q])
  const hasKo = /[가-힣]/.test(q)
  if (hasKo) {
    for (const [ko, ens] of Object.entries(KO_TO_EN)) {
      if (q.includes(ko.toLowerCase())) ens.forEach(e => terms.add(e))
    }
  } else {
    for (const [en, kos] of Object.entries(EN_TO_KO)) {
      if (q.includes(en)) kos.forEach(k => terms.add(k))
    }
  }
  return Array.from(terms)
}
