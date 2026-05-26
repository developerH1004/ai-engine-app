import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '@/lib/LangContext'
import { Analytics } from '@vercel/analytics/react'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'AI MAP — GAIT 69 | 이거봐! AI가 모두 모였어',
  description: 'Every real-world AI on the planet, at a glance. Based on GAIT 69: Global AI Index Taxonomy (DOI: 10.5281/zenodo.20248631)',
  openGraph: {
    title: 'AI MAP — GAIT 69',
    description: 'Every real-world AI on the planet, at a glance.',
    url: 'https://ai-engine-app.vercel.app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-950 text-gray-100 antialiased" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <LangProvider>
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </LangProvider>
        <Analytics />
      </body>
    </html>
  )
}
