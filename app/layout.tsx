import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '이거봐! AI가 모두 모였어',
  description: '전 세계 실존하는 모든 AI를 한눈에.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  )
}
