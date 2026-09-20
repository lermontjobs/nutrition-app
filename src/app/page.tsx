'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Plus, Droplets, ChevronLeft } from 'lucide-react'
import { MealCamera } from '@/components/MealCamera'
import { useRouter } from 'next/navigation'

interface DashboardData {
  goals: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number; dailyWater: number; currentWeight: number; targetWeight: number } | null
  eatenTotals: { calories: number; protein: number; carbs: number; fat: number }
  waterToday: number
  streak: number
  weightHistory: { date: string; weight: number | null }[]
  latestWeight: number | null
}

function CalorieRingNew({ eaten, target }: { eaten: number; target: number }) {
  const pct = Math.min(1, eaten / Math.max(target, 1))
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const color = pct > 1.05 ? 'var(--coral)' : pct > 0.95 ? 'var(--lime)' : 'var(--primary)'

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#F0EEF9" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s' }} />
    </svg>
  )
}

function MacroRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, (value / Math.max(target, 1)) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
        <span style={{ color: 'var(--text-sub)' }}>{Math.round(value)}<span style={{ color: '#C4BFD8' }}>/{target}ג׳</span></span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function WaterDroplets({ count, target, onAdd }: { count: number; target: number; onAdd: () => void }) {
  const glasses = Math.round(target / 0.25)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
      {Array.from({ length: glasses }).map((_, i) => (
        <button key={i} onClick={i === count ? onAdd : undefined}
          style={{ width: '1.75rem', height: '1.75rem', borderRadius: '8px', border: 'none', cursor: i === count ? 'pointer' : 'default', fontSize: '1rem', background: i < count ? 'var(--teal-light)' : '#F0EEF9', transition: 'all 0.2s', transform: i === count ? 'scale(1.1)' : 'scale(1)' }}>
          {i < count ? '💧' : '○'}
        </button>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCamera, setShowCamera] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setWaterGlasses(Math.round((d.waterToday || 0) / 0.25))
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (session) fetchData()
  }, [session, status, fetchData, router])

  const addWater = async () => {
    await fetch('/api/water', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 0.25 }) })
    setWaterGlasses(w => w + 1)
  }

  if (status === 'loading' || loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: i === 1 ? '12rem' : '6rem', borderRadius: '22px', background: 'linear-gradient(90deg, #F0EEF9 0%, #EDE9FE 50%, #F0EEF9 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      ))}
    </div>
  )
  if (!session) return null

  const goals = data?.goals
  const eaten = data?.eatenTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const target = goals?.dailyCalories || 2000
  const remaining = Math.max(0, target - eaten.calories)
  const dailyWater = goals?.dailyWater || 2.5
  const waterTarget = Math.round(dailyWater / 0.25)
  const currentWeight = data?.latestWeight || goals?.currentWeight || 0
  const targetWeight = goals?.targetWeight || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', paddingTop: '0.25rem' }}>
      {showCamera && <MealCamera onClose={() => setShowCamera(false)} onAddToLog={() => fetchData()} />}

      {/* Main calorie card */}
      <div className="card animate-fade-up" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #9747FF 100%)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <CalorieRingNew eaten={eaten.calories} target={target} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.625rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{Math.round(eaten.calories)}</span>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem' }}>מתוך {target}</span>
            </div>
          </div>
          {/* Right side */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', margin: '0 0 0.25rem', fontWeight: 500 }}>ההתקדמות שלך היום</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', margin: '0 0 1rem' }}>
              {remaining === 0 ? '🎉 עמדת ביעד!' : `נותרו לך ${remaining} קק"ל`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.9)' }}>
                <span>💪 חלבון</span>
                <span style={{ fontWeight: 700 }}>{Math.round(eaten.protein)}/{goals?.dailyProtein || 150}ג׳</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--lime)', borderRadius: '100px', width: `${Math.min(100, (eaten.protein / (goals?.dailyProtein || 150)) * 100)}%`, transition: 'width 1s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.9)' }}>
                <span>🌾 פחמימות</span>
                <span style={{ fontWeight: 700 }}>{Math.round(eaten.carbs)}/{goals?.dailyCarbs || 200}ג׳</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--orange)', borderRadius: '100px', width: `${Math.min(100, (eaten.carbs / (goals?.dailyCarbs || 200)) * 100)}%`, transition: 'width 1s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }} className="animate-fade-up">
        {[
          { href: '/diary', icon: '🍽️', label: 'הוסיפי ארוחה', bg: 'var(--primary-light)', color: 'var(--primary)' },
          { href: '/measurements', icon: '⚖️', label: 'עדכני משקל', bg: 'var(--coral-light)', color: 'var(--coral)' },
          { href: '/chat', icon: '✨', label: 'שאלי AI', bg: '#F0FAD6', color: '#5C8A00' },
          { href: '/diary', icon: '🏃‍♀️', label: 'אימון', bg: 'var(--teal-light)', color: '#0E7B7C' },
        ].map(({ href, icon, label, bg, color }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', borderRadius: '18px', padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', boxShadow: 'var(--card-shadow)', cursor: 'pointer' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{icon}</div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
            </div>
          </Link>
        ))}
        {/* Camera scan button */}
        <button onClick={() => setShowCamera(true)} style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, #9747FF, var(--primary))', color: 'white', border: 'none', borderRadius: '18px', padding: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9375rem', boxShadow: '0 4px 16px rgba(108,76,241,0.25)' }}>
          <span style={{ fontSize: '1.25rem' }}>📸</span> צלמי ארוחה לניתוח AI
        </button>
      </div>

      {/* Water tracker */}
      <div className="card animate-fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '2rem', height: '2rem', background: 'var(--teal-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={16} style={{ color: 'var(--teal)' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>שתיית מים</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--teal)' }}>{(waterGlasses * 0.25).toFixed(2)}L</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-sub)' }}>/ {dailyWater}L</span>
          </div>
        </div>
        <WaterDroplets count={waterGlasses} target={dailyWater} onAdd={addWater} />
        {waterGlasses >= waterTarget && (
          <div style={{ marginTop: '0.75rem', background: 'var(--teal-light)', borderRadius: '10px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#0E7B7C', fontWeight: 600, textAlign: 'center' }}>
            💧 עמדת ביעד המים שלך!
          </div>
        )}
      </div>

      {/* AI strip */}
      <Link href="/chat" style={{ textDecoration: 'none' }}>
        <div className="animate-fade-up" style={{ background: 'linear-gradient(135deg, var(--coral-light) 0%, #FFE0E3 100%)', borderRadius: '22px', padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1.5px solid rgba(255,92,108,0.15)' }}>
          <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, var(--coral), #FF8C97)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(255,92,108,0.3)', fontSize: '1.375rem' }}>✨</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, color: '#C0002A', margin: '0 0 0.25rem', fontSize: '0.9375rem' }}>מה מתחשק לאכול?</p>
            <p style={{ fontSize: '0.8125rem', color: '#E06080', margin: 0 }}>כתבי לי מה יש בבית ואציע לך ארוחה מותאמת...</p>
          </div>
          <ChevronLeft size={20} style={{ color: 'var(--coral)', flexShrink: 0 }} />
        </div>
      </Link>

      {/* Weight progress */}
      {currentWeight > 0 && targetWeight > 0 && (
        <div className="card animate-fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>המסע שלך ⚡</span>
            <Link href="/progress" style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>הצגי הכל</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>{currentWeight}</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-sub)', margin: '0.25rem 0 0' }}>היום</p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '0.375rem' }}>
                <span>התחלה</span>
                <span>{Math.max(0, currentWeight - targetWeight).toFixed(1)} ק"ג לסיום</span>
                <span>יעד</span>
              </div>
              <div className="progress-track" style={{ height: '10px' }}>
                <div className="progress-fill" style={{
                  background: 'linear-gradient(90deg, var(--primary), var(--coral))',
                  width: `${Math.min(100, Math.max(5, ((goals?.currentWeight || currentWeight) - currentWeight) / Math.max(0.1, (goals?.currentWeight || currentWeight) - targetWeight) * 100))}%`
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--lime)', margin: 0, lineHeight: 1 }}>{targetWeight}</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-sub)', margin: '0.25rem 0 0' }}>יעד</p>
            </div>
          </div>
        </div>
      )}

      {/* Streak */}
      {(data?.streak || 0) > 0 && (
        <div className="card animate-fade-up" style={{ background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', border: '1.5px solid #FFD699' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ fontSize: '2.5rem' }}>🔥</div>
            <div>
              <p style={{ fontWeight: 900, fontSize: '1.25rem', color: '#E65100', margin: 0 }}>{data?.streak} ימים ברצף!</p>
              <p style={{ fontSize: '0.8125rem', color: '#BF360C', margin: '0.125rem 0 0' }}>יום פחות מדויק לא מוחק את ההתקדמות שלך</p>
            </div>
          </div>
        </div>
      )}

      {/* No goals CTA */}
      {!goals && (
        <div style={{ background: 'var(--primary-light)', borderRadius: '22px', padding: '1.5rem', textAlign: 'center', border: '1.5px solid rgba(108,76,241,0.2)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</p>
          <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.0625rem' }}>ברוכה הבאה! בואי נתחיל</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>הגדירי את היעדים שלך כדי לקבל מעקב מותאם אישית</p>
          <Link href="/settings">
            <button className="btn-primary" style={{ width: '100%' }}>הגדרת יעדים ←</button>
          </Link>
        </div>
      )}
    </div>
  )
}
