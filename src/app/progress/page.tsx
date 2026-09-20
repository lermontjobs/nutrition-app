'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { TrendingDown, Award, Calendar, Flame, Loader2 } from 'lucide-react'

interface ProgressData {
  weightHistory: { date: string; weight: number | null }[]
  calorieHistory: { date: string; calories: number; target: number }[]
  goals: { dailyCalories: number; dailyProtein: number; targetWeight: number; currentWeight: number } | null
  weeklyStats: { avgCalories: number; avgProtein: number; weightChange: number; adherence: number; workouts: number; avgSteps: number; daysToGoal: number | null }
  currentWeight: number
  targetWeight: number
}

export default function ProgressPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/progress')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  if (status === 'loading' || loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}><Loader2 size={32} className="animate-spin" style={{ color: '#22c55e' }} /></div>
  if (!session) { redirect('/auth/login'); return null }

  const stats = data?.weeklyStats
  const currentWeight = data?.currentWeight || 0
  const targetWeight = data?.targetWeight || 0
  const startWeight = data?.goals?.currentWeight || currentWeight
  const progressPct = startWeight && targetWeight && startWeight !== targetWeight
    ? Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100))
    : 0

  const hasData = (data?.weightHistory?.length || 0) > 0

  return (
    <div className="space-y-4">
      <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>דשבורד התקדמות</h1>

      {!hasData ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</p>
          <p style={{ fontWeight: 600, color: '#15803d', marginBottom: '0.5rem' }}>עדיין אין נתונים</p>
          <p style={{ fontSize: '0.875rem', color: '#16a34a' }}>התחל לרשום מדדים ויומן אכילה כדי לראות את ההתקדמות שלך</p>
        </div>
      ) : (
        <>
          {/* Main card */}
          {currentWeight > 0 && targetWeight > 0 && (
            <div style={{ background: 'linear-gradient(to bottom right, #22c55e, #16a34a)', borderRadius: '1rem', padding: '1rem', color: 'white' }}>
              <p style={{ color: '#dcfce7', fontSize: '0.875rem', marginBottom: '0.25rem' }}>התקדמות לעבר היעד</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0 }}>{currentWeight}<span style={{ fontSize: '1.25rem', fontWeight: 400, marginRight: '0.25rem' }}>ק"ג</span></p>
                  <p style={{ color: '#dcfce7', fontSize: '0.875rem', margin: 0 }}>יעד: {targetWeight} ק"ג</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#dcfce7', fontSize: '0.875rem', margin: 0 }}>ירדת</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{Math.max(0, startWeight - currentWeight).toFixed(1)} ק"ג</p>
                  <p style={{ color: '#dcfce7', fontSize: '0.75rem', margin: 0 }}>{Math.round(progressPct)}% מהדרך ✓</p>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', height: '0.625rem' }}>
                <div style={{ background: 'white', height: '100%', borderRadius: '9999px', width: `${progressPct}%`, transition: 'width 0.7s' }} />
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'ירידה', value: stats.weightChange < 0 ? Math.abs(stats.weightChange).toFixed(1) : '0', unit: 'ק"ג', color: '#16a34a', icon: <TrendingDown size={16} style={{ color: '#22c55e' }} /> },
                { label: 'עמידה', value: stats.adherence, unit: '%', color: '#2563eb', icon: <Award size={16} style={{ color: '#3b82f6' }} /> },
                { label: 'אימונים', value: stats.workouts, unit: 'בשבוע', color: '#9333ea', icon: <Flame size={16} style={{ color: '#a855f7' }} /> },
                { label: 'ימים ליעד', value: stats.daysToGoal || '?', unit: 'יום', color: '#ea580c', icon: <Calendar size={16} style={{ color: '#f97316' }} /> },
              ].map(({ label, value, unit, color, icon }) => (
                <div key={label} style={{ background: 'white', borderRadius: '1rem', padding: '0.75rem', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>{icon}</div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color, margin: 0 }}>{value}</p>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>{unit}</p>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.125rem 0 0' }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Weight graph */}
          {(data?.weightHistory?.length || 0) > 1 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>מגמת משקל</h2>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data!.weightHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }} formatter={(v: number) => [`${v} ק"ג`]} />
                  {targetWeight > 0 && <ReferenceLine y={targetWeight} stroke="#22c55e" strokeDasharray="5 5" />}
                  <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Calorie graph */}
          {(data?.calorieHistory?.length || 0) > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>קלוריות – השבוע</h2>
              {stats && <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>ממוצע: {stats.avgCalories} קק"ל | יעד: {data?.goals?.dailyCalories}</p>}
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={data!.calorieHistory}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }} formatter={(v: number) => [v, 'קלוריות']} />
                  <ReferenceLine y={data?.goals?.dailyCalories || 2000} stroke="#94a3b8" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly summary */}
          {stats && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>סיכום שבועי</h2>
              <div>
                {[
                  { label: 'ממוצע קלוריות', value: `${stats.avgCalories} קק"ל`, ok: data?.goals?.dailyCalories ? Math.abs(stats.avgCalories - data.goals.dailyCalories) < 200 : true },
                  { label: 'ממוצע חלבון', value: `${stats.avgProtein}ג`, ok: stats.avgProtein >= (data?.goals?.dailyProtein || 0) * 0.85 },
                  { label: 'עמידה בתפריט', value: `${stats.adherence}%`, ok: stats.adherence >= 80 },
                ].map(({ label, value, ok }, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 2 ? '1px solid #f8fafc' : undefined }}>
                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{value}</span>
                      <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: ok ? '#4ade80' : '#fbbf24' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '1rem', padding: '1rem', fontSize: '0.875rem', color: '#1d4ed8' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>⚠️ הערה</p>
        <p style={{ margin: 0, color: '#2563eb', fontSize: '0.8125rem' }}>המלצות המערכת אינן מחליפות ייעוץ של רופא או תזונאי מוסמך</p>
      </div>
    </div>
  )
}
