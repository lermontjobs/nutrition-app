import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

export const metadata: Metadata = {
  title: 'NutriMe - \u05DE\u05E2\u05E7\u05D1 \u05EA\u05D6\u05D5\u05E0\u05D4 \u05D7\u05DB\u05DE\u05D4',
  description: '\u05E0\u05D9\u05D4\u05D5\u05DC \u05EA\u05D6\u05D5\u05E0\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA, \u05DE\u05E2\u05E7\u05D1 \u05DE\u05D3\u05D9\u05D3\u05D5\u05EA \u05D2\u05D5\u05E3 \u05D5\u05E2\u05D6\u05E8\u05EA AI',
  charset: 'utf-8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ background: 'var(--cream)', minHeight: '100vh' }}>
        <Providers>
          <TopBar />
          <main style={{ maxWidth: '480px', margin: '0 auto', padding: '4.5rem 1rem 0' }}>
            {children}
            <div className="bottom-spacer" />
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
