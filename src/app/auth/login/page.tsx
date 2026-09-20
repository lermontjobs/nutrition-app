'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) router.push('/')
    else { setError('אימייל או סיסמא שגויים'); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.imgur.com/3JKAWOe.png"
          alt="NutriMe"
          style={{ width: '9rem', height: '9rem', objectFit: 'contain', margin: '0 auto 0.75rem', display: 'block', filter: 'drop-shadow(0 8px 28px rgba(108,76,241,0.28))' }}
        />
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--coral))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>NutriMe</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9375rem', marginTop: '0.375rem' }}>{'חזקה. בריאה. בשליטה. 💪'}</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.375rem' }}>{'ברוכה הבאה'}</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>{'התחברי לחשבון שלך והמשיכי במסע'}</p>

        {error && (
          <div style={{ background: '#FFF0F2', border: '1.5px solid #FFD0D8', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#C0002A', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{'אימייל'}</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{'סיסמא'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder={'••••••••'}
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '3rem' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 0 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> {'מתחברת...'}</> : 'כניסה 🚀'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-sub)' }}>
          {'אין לך חשבון? '}
          <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            {'הירשמי כאן'}
          </Link>
        </p>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-sub)', textAlign: 'center', maxWidth: '320px', lineHeight: 1.5 }}>
        {'⚕️ המערכת אינה מחליפה ייעוץ תזונאי מקצועי'}
      </p>
    </div>
  )
}
