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
    else { setError('אימייל או סיסמה שגויים'); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ width: '5rem', height: '5rem', background: 'linear-gradient(135deg, var(--primary), var(--coral))', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 32px rgba(108,76,241,0.3)', fontSize: '2.5rem' }}>⚡</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--coral))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>NutriMe</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9375rem', marginTop: '0.375rem' }}>Strong. Healthy. In control.</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.375rem' }}>כניסה למערכת</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>ברוכה השבה! בואי נמשיך מאיפה שהפסקנו ✨</p>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1.5px solid #FFD0D5', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#C0002A', fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>אימייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="your@email.com" required />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>סיסמה</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" required style={{ paddingLeft: '3rem' }} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> נכנסת...</> : 'כניסה →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-sub)' }}>
          עדיין לא רשומה?{' '}
          <Link href="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>הרשמי עכשיו</Link>
        </div>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-sub)', textAlign: 'center', maxWidth: '320px' }}>
        ⚠️ המערכת אינה מחליפה ייעוץ של רופא או תזונאית מוסמכת
      </p>
    </div>
  )
}
