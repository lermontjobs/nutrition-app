'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, CalendarDays, TrendingUp, User, Sparkles } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'היום' },
  { href: '/diary', icon: CalendarDays, label: 'תפריט' },
  { href: '/chat', icon: Sparkles, label: 'AI', isCenter: true },
  { href: '/progress', icon: TrendingUp, label: 'התקדמות' },
  { href: '/settings', icon: User, label: 'פרופיל' },
]

export function BottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  if (!session) return null

  return (
    <nav style={{
      position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 40,
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(108,76,241,0.1)',
      boxShadow: '0 -4px 24px rgba(108,76,241,0.08)',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', padding: '0 0.5rem', height: '4.25rem' }}>
        {navItems.map(({ href, icon: Icon, label, isCenter }) => {
          const active = pathname === href
          if (isCenter) return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              <div style={{
                width: '3.375rem', height: '3.375rem', borderRadius: '18px',
                background: 'linear-gradient(135deg, var(--coral) 0%, #FF8C97 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(255,92,108,0.4)',
                transform: active ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.2s',
                marginBottom: '0.5rem',
              }} className={active ? '' : 'animate-pulse-coral'}>
                <Sparkles size={22} style={{ color: 'white' }} />
              </div>
            </Link>
          )
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', padding: '0.5rem 0' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '12px',
                background: active ? 'var(--primary-light)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <Icon size={20} style={{ color: active ? 'var(--primary)' : 'var(--text-sub)', transition: 'color 0.2s' }} />
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: active ? 700 : 400, color: active ? 'var(--primary)' : 'var(--text-sub)', transition: 'all 0.2s' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
