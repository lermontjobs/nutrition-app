'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Bell, Lock, Download, LogOut, ChevronLeft, Target, Leaf, Loader2, Save, Check, Users } from 'lucide-react'
import Link from 'next/link'
import { GOAL_TYPE_LABELS, ACTIVITY_LABELS } from '@/types'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<'main' | 'goals' | 'dietary' | 'notifications'>('main')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [goals, setGoals] = useState<Record<string, unknown>>({})
  const [prefs, setPrefs] = useState<Record<string, unknown>>({})

  const [notifications, setNotifications] = useState({
    weight: true, meals: true, water: false, weekly: true, protein: true, calories: false,
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const d = await res.json()
        if (d.goals) setGoals(d.goals)
        if (d.prefs) setPrefs(d.prefs)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  if (status === 'loading' || loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}><Loader2 size={32} className="animate-spin" style={{ color: '#22c55e' }} /></div>
  if (!session) { redirect('/auth/login'); return null }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (tab === 'goals') body.goals = goals
      if (tab === 'dietary') body.prefs = prefs
      const res = await fetch('/api/goals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 0.75rem', color: '#1e293b', outline: 'none', direction: 'rtl' as const, fontFamily: 'inherit', fontSize: '0.875rem' }
  const labelStyle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.375rem' }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{ position: 'relative', width: '3rem', height: '1.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: on ? '#22c55e' : '#e2e8f0', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: '0.125rem', width: '1.25rem', height: '1.25rem', background: 'white', borderRadius: '9999px', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'transform 0.2s', transform: on ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }} />
    </button>
  )

  return (
    <div className="space-y-4">
      <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>הגדרות</h1>

      {/* Profile card */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
        <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', fontWeight: 700 }}>
          {session.user?.name?.[0] || '?'}
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{session.user?.name}</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.125rem 0 0' }}>{session.user?.email}</p>
        </div>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#15803d' }}>
          <Check size={16} /> נשמר בהצלחה!
        </div>
      )}

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {[
          { key: 'main', label: 'ראשי' },
          { key: 'goals', label: 'יעדים' },
          { key: 'dietary', label: 'תזונה' },
          { key: 'notifications', label: 'התראות' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', background: tab === key ? '#22c55e' : '#f1f5f9', color: tab === key ? 'white' : '#475569', transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Main tab */}
      {tab === 'main' && (
        <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
          {[
            { icon: <Target size={18} style={{ color: '#22c55e' }} />, label: 'יעדים תזונתיים', desc: 'קלוריות, חלבון, פחמימות, שומן', key: 'goals' },
            { icon: <Leaf size={18} style={{ color: '#10b981' }} />, label: 'העדפות תזונה', desc: 'אלרגיות, מגבלות, אהבות', key: 'dietary' },
            { icon: <Bell size={18} style={{ color: '#f59e0b' }} />, label: 'התראות', desc: 'תזכורות ועדכונים', key: 'notifications' },
          ].map(({ icon, label, desc, key }, i) => (
            <button key={key} onClick={() => setTab(key as typeof tab)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'none', border: 'none', borderBottom: i < 2 ? '1px solid #f1f5f9' : undefined, cursor: 'pointer', textAlign: 'right' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', background: '#f8fafc', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, color: '#334155', margin: 0, fontSize: '0.875rem' }}>{label}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{desc}</p>
              </div>
              <ChevronLeft size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {/* Goals tab */}
      {tab === 'goals' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
          <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>יעדים תזונתיים</h2>
          <div className="space-y-3">
            <div>
              <label style={labelStyle}>מטרה</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setGoals(g => ({ ...g, goalType: k }))}
                    style={{ padding: '0.625rem 1rem', borderRadius: '0.75rem', border: `2px solid ${goals.goalType === k ? '#22c55e' : '#e2e8f0'}`, background: goals.goalType === k ? '#f0fdf4' : 'white', color: goals.goalType === k ? '#15803d' : '#475569', cursor: 'pointer', textAlign: 'right', fontWeight: goals.goalType === k ? 600 : 400, fontSize: '0.875rem' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {[
                ['currentWeight', 'משקל נוכחי (ק"ג)'],
                ['targetWeight', 'משקל יעד (ק"ג)'],
                ['dailyCalories', 'קלוריות יומיות'],
                ['dailyProtein', 'חלבון (ג\')'],
                ['dailyCarbs', 'פחמימות (ג\')'],
                ['dailyFat', 'שומן (ג\')'],
                ['dailyWater', 'מים (ל\')'],
                ['mealsPerDay', 'ארוחות ביום'],
              ].map(([k, l]) => (
                <div key={k}>
                  <label style={labelStyle}>{l}</label>
                  <input type="number" value={(goals[k] as number) || ''} onChange={e => setGoals(g => ({ ...g, [k]: Number(e.target.value) || null }))} style={inputStyle} />
                </div>
              ))}
            </div>
            <div>
              <label style={labelStyle}>רמת פעילות</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setGoals(g => ({ ...g, activityLevel: k }))}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '0.75rem', border: `2px solid ${goals.activityLevel === k ? '#22c55e' : '#e2e8f0'}`, background: goals.activityLevel === k ? '#f0fdf4' : 'white', color: goals.activityLevel === k ? '#15803d' : '#475569', cursor: 'pointer', textAlign: 'right', fontSize: '0.8125rem' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dietary tab */}
      {tab === 'dietary' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
          <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>העדפות תזונה</h2>
          <div className="space-y-3">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[['isKosher', 'כשר'], ['isVegetarian', 'צמחוני'], ['isVegan', 'טבעוני']].map(([k, l]) => (
                <button key={k} onClick={() => setPrefs(p => ({ ...p, [k]: !p[k] }))}
                  style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: `2px solid ${prefs[k] ? '#22c55e' : '#e2e8f0'}`, background: prefs[k] ? '#f0fdf4' : 'white', color: prefs[k] ? '#15803d' : '#475569', cursor: 'pointer', fontSize: '0.875rem', fontWeight: prefs[k] ? 600 : 400 }}>
                  {l}
                </button>
              ))}
            </div>
            {[['allergies', 'אלרגיות (הפרד בפסיק)'], ['dislikes', 'מאכלים שלא אוהב'], ['favorites', 'מאכלים אהובים']].map(([k, l]) => (
              <div key={k}>
                <label style={labelStyle}>{l}</label>
                <input type="text" value={(prefs[k] as string) || ''} onChange={e => setPrefs(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} placeholder="לדוגמה: בוטנים, חלב..." />
              </div>
            ))}
            <div>
              <label style={labelStyle}>זמן הכנה מקסימלי (דקות): {String(prefs.maxPrepTime || 30)}</label>
              <input type="range" min={5} max={120} step={5} value={(prefs.maxPrepTime as number) || 30} onChange={e => setPrefs(p => ({ ...p, maxPrepTime: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#22c55e' }} />
            </div>
            <div>
              <label style={labelStyle}>הערות רפואיות</label>
              <textarea value={(prefs.medicalNotes as string) || ''} onChange={e => setPrefs(p => ({ ...p, medicalNotes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="סוכרת, לחץ דם..." />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>⚠️ המערכת אינה מחליפה ייעוץ מקצועי</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
          <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>התראות ותזכורות</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>ניסוח עדין ומעודד — לא ביקורתי</p>
          <div className="space-y-3">
            {[
              { key: 'weight', label: 'תזכורת שקילה', desc: 'כל בוקר' },
              { key: 'meals', label: 'תזכורת ארוחות', desc: 'לפני שעת הארוחה' },
              { key: 'water', label: 'שתיית מים', desc: 'כל שעתיים' },
              { key: 'weekly', label: 'סיכום שבועי', desc: 'כל ראשון' },
              { key: 'protein', label: 'חוסר חלבון', desc: 'סוף יום' },
              { key: 'calories', label: 'חריגה קלורית', desc: 'בזמן אמת' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{desc}</p>
                </div>
                <Toggle on={notifications[key as keyof typeof notifications]} onToggle={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof notifications] }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      {(tab === 'goals' || tab === 'dietary') && (
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      )}

      {/* Danger zone */}
      {tab === 'main' && (
        <div className="space-y-2">
          {session.user.isAdmin && (
            <Link href="/admin" style={{ textDecoration: 'none', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '0.75rem', cursor: 'pointer' }}>
              <Users size={16} style={{ color: '#b45309' }} />
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#92400e', margin: 0 }}>ניהול משתמשים 👑</p>
                <p style={{ fontSize: '0.75rem', color: '#a16207', margin: 0 }}>הוסף, ערוך ומחק משתמשים</p>
              </div>
              <ChevronLeft size={16} style={{ color: '#b45309', marginRight: 'auto' }} />
            </Link>
          )}
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer' }}>
            <Download size={16} style={{ color: '#2563eb' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', margin: 0 }}>ייצוא נתונים</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>הורדת כל המידע כ-JSON</p>
            </div>
          </button>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', cursor: 'pointer' }}>
            <LogOut size={16} style={{ color: '#ef4444' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#dc2626', margin: 0 }}>יציאה מהמערכת</p>
            </div>
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>⚠️ המערכת אינה מחליפה ייעוץ רפואי</p>
        </div>
      )}
    </div>
  )
}
