import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

export const metadata: Metadata = {
  title: 'NutriMe – מעקב תזונה אישי',
  description: 'מערכת אישית לניהול תזונה, מעקב מדדים והכוונת AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
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
