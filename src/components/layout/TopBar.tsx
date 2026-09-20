'use client'

import { useSession } from 'next-auth/react'
import { Bell, Flame } from 'lucide-react'

export function TopBar() {
  const { data: session } = useSession()
  if (!session) return null

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Ã—Å“Ã—â„¢Ã—Å“Ã—â€ Ã—ËœÃ—â€¢Ã—â€˜' : hour < 12 ? 'Ã—â€˜Ã—â€¢Ã—Â§Ã—Â¨ Ã—ËœÃ—â€¢Ã—â€˜' : hour < 17 ? 'Ã—Â¦Ã—â€Ã—Â¨Ã—â„¢Ã—â„¢Ã—Â Ã—ËœÃ—â€¢Ã—â€˜Ã—â„¢Ã—Â' : hour < 21 ? 'Ã—Â¢Ã—Â¨Ã—â€˜ Ã—ËœÃ—â€¢Ã—â€˜' : 'Ã—Å“Ã—â„¢Ã—Å“Ã—â€ Ã—ËœÃ—â€¢Ã—â€˜'
  const firstName = session.user?.name?.split(' ')[0] || ''

  return (
    <header style={{
      position: 'fixed', top: 0, right: 0, left: 0, zIndex: 40,
      background: 'rgba(255,249,245,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(108,76,241,0.08)',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Greeting */}
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', margin: 0, fontWeight: 500 }}>{greeting} Ã¢Å“Â¨</p>
          <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>{firstName}</p>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://i.imgur.com/3JKAWOe.png" alt="NutriMe" style={{ width: '2.75rem', height: '2.75rem', objectFit: 'contain', borderRadius: '12px' }} />
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', background: 'linear-gradient(135deg, var(--primary), var(--coral))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NutriMe</span>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button style={{ position: 'relative', width: '2.25rem', height: '2.25rem', background: 'var(--primary-light)', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={17} style={{ color: 'var(--primary)' }} />
            <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, background: 'var(--coral)', borderRadius: '50%', border: '2px solid white' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FFF3E0', borderRadius: '10px', padding: '0.25rem 0.625rem' }}>
            <Flame size={14} style={{ color: 'var(--orange)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E65100' }}>7</span>
          </div>
        </div>
      </div>
    </header>
  )
}
