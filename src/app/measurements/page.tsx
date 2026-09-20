'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Plus, Save, TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react'

interface Measurement {
  id?: string
  date: string
  weight?: number | null
  bodyFat?: number | null
  muscleMass?: number | null
  waist?: number | null
  belly?: number | null
  chest?: number | null
  hip?: number | null
  arm?: number | null
  steps?: number | null
  sleepHours?: number | null
  water?: number | null
  hungerLevel?: number | null
  energyLevel?: number | null
  mood?: number | null
  adherencePct?: number | null
  notes?: string | null
}

const metricConfig: Record<string, { label: string; unit: string; emoji: string }> = {
  weight: { label: 'משקל', unit: 'ק"ג', emoji: '⚖️' },
  bodyFat: { label: 'אחוז שומן', unit: '%', emoji: '📊' },
  muscleMass: { label: 'מסת שריר', unit: 'ק"ג', emoji: '💪' },
  waist: { label: 'מותניים', unit: 'ס"מ', emoji: '📏' },
  belly: { label: 'בטן', unit: 'ס"מ', emoji: '📏' },
  chest: { label: 'חזה', unit: 'ס"מ', emoji: '📏' },
  hip: { label: 'ירך', unit: 'ס"מ', emoji: '📏' },
  arm: { label: 'זרוע', unit: 'ס"מ', emoji: '📏' },
  steps: { label: 'צעדים', unit: '', emoji: '👟' },
  sleepHours: { label: 'שינה', unit: "שע'", emoji: '😴' },
  water: { label: 'מים', unit: "ל'", emoji: '💧' },
  hungerLevel: { label: 'רעב', unit: '/5', emoji: '🍽️' },
  energyLevel: { label: 'אנרגיה', unit: '/5', emoji: '⚡' },
  mood: { label: 'מצב רוח', unit: '/5', emoji: '😊' },
}

const moodEmojis = ['', '😞', '😕', '😐', '🙂', '😊']

export default function MeasurementsPage() {
  const { data: session, status } = useSession()
  const [history, setHistory] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newEntry, setNewEntry] = useState<Measurement>({ date: new Date().toISOString().split('T')[0] })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/measurements')
      if (res.ok) setHistory(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  if (status === 'loading' || loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}><Loader2 size={32} className="animate-spin" style={{ color: '#22c55e' }} /></div>
  if (!session) { redirect('/auth/login'); return null }

  const latest = history[0]
  const prev = history[1]

  const getDiff = (key: keyof Measurement) => {
    const l = latest?.[key] as number
    const p = prev?.[key] as number
    if (!l || !p) return null
    return l - p
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      })
      if (res.ok) {
        setSaved(true)
        setShowForm(false)
        await fetchData()
        setTimeout(() => setSaved(false), 3000)
        setNewEntry({ date: new Date().toISOString().split('T')[0] })
      }
    } finally {
      setSaving(false)
    }
  }

  const DiffBadge = ({ diff, inverse = false }: { diff: number | null; inverse?: boolean }) => {
    if (diff === null) return null
    const positive = inverse ? diff < 0 : diff > 0
    const neutral = Math.abs(diff) < 0.1
    if (neutral) return <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}><Minus size={12} style={{ display: 'inline' }} /></span>
    return (
      <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.125rem', color: positive ? '#16a34a' : '#ef4444' }}>
        {positive ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
        {Math.abs(diff).toFixed(1)}
      </span>
    )
  }

  const inputStyle = { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.625rem 0.75rem', color: '#1e293b', outline: 'none', direction: 'rtl' as const, fontFamily: 'inherit' }
  const labelStyle = { fontSize: '0.75rem', fontWeight: 500, color: '#334155', display: 'block', marginBottom: '0.25rem' }

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>מדדים גופניים</h1>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> הזן מדד
        </button>
      </div>

      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#15803d' }}>
          ✅ המדדים נשמרו בהצלחה!
        </div>
      )}

      {/* Latest */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ fontWeight: 600, color: '#334155', margin: 0 }}>מדידה אחרונה</h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {latest?.date ? new Date(latest.date).toLocaleDateString('he-IL') : 'אין נתונים'}
          </span>
        </div>

        {latest ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {(['weight', 'bodyFat', 'waist', 'steps'] as const).map(key => {
                const config = metricConfig[key]
                const val = latest[key] as number
                const diff = getDiff(key)
                const inverse = key !== 'steps'
                return (
                  <div key={key} style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{config.emoji} {config.label}</span>
                      <DiffBadge diff={diff} inverse={inverse} />
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      {val || '—'}<span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748b', marginRight: '0.25rem' }}>{val ? config.unit : ''}</span>
                    </p>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              {(['hungerLevel', 'energyLevel', 'mood'] as const).map(key => {
                const val = latest[key] as number
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', margin: '0 0 0.25rem' }}>{moodEmojis[val] || '—'}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{metricConfig[key].label}</p>
                    {val && <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', margin: 0 }}>{val}/5</p>}
                  </div>
                )
              })}
            </div>

            {latest.notes && (
              <div style={{ marginTop: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', padding: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                📝 {latest.notes}
              </div>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>אין מדדים עדיין. לחץ "הזן מדד" להתחיל.</p>
        )}
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 style={{ fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>היסטוריה</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <th style={{ textAlign: 'right', paddingBottom: '0.5rem', fontWeight: 500 }}>תאריך</th>
                  <th style={{ textAlign: 'center', paddingBottom: '0.5rem', fontWeight: 500 }}>משקל</th>
                  <th style={{ textAlign: 'center', paddingBottom: '0.5rem', fontWeight: 500 }}>שומן%</th>
                  <th style={{ textAlign: 'center', paddingBottom: '0.5rem', fontWeight: 500 }}>מותן</th>
                  <th style={{ textAlign: 'center', paddingBottom: '0.5rem', fontWeight: 500 }}>שינה</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.75rem', color: '#475569' }}>
                      {new Date(m.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{m.weight || '—'}</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'center', color: '#475569' }}>{m.bodyFat || '—'}</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'center', color: '#475569' }}>{m.waist || '—'}</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'center', color: '#475569' }}>{m.sleepHours || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem 1.5rem 0 0', width: '100%', maxWidth: '480px', padding: '1.25rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>הזנת מדדים</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label style={labelStyle}>תאריך</label>
                <input type="date" value={newEntry.date} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
              </div>

              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: '0.5rem' }}>מדדים גופניים</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {(['weight', 'bodyFat', 'waist', 'belly', 'chest', 'hip', 'arm'] as const).map(key => (
                  <div key={key}>
                    <label style={labelStyle}>{metricConfig[key].emoji} {metricConfig[key].label} ({metricConfig[key].unit})</label>
                    <input type="number" step="0.1"
                      value={(newEntry[key] as number) || ''}
                      onChange={e => setNewEntry(p => ({ ...p, [key]: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle} />
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: '0.5rem' }}>פעילות</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {(['steps', 'sleepHours', 'water'] as const).map(key => (
                  <div key={key}>
                    <label style={labelStyle}>{metricConfig[key].emoji} {metricConfig[key].label}</label>
                    <input type="number" step={key === 'steps' ? 100 : 0.1}
                      value={(newEntry[key] as number) || ''}
                      onChange={e => setNewEntry(p => ({ ...p, [key]: e.target.value ? Number(e.target.value) : null }))}
                      style={inputStyle} />
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: '0.5rem' }}>תחושות (1-5)</p>
              {(['hungerLevel', 'energyLevel', 'mood'] as const).map(key => {
                const val = (newEntry[key] as number) || 3
                return (
                  <div key={key}>
                    <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{metricConfig[key].emoji} {metricConfig[key].label}</span>
                      <span style={{ fontSize: '1rem' }}>{moodEmojis[val]}</span>
                    </label>
                    <input type="range" min={1} max={5}
                      value={val}
                      onChange={e => setNewEntry(p => ({ ...p, [key]: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#22c55e' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                      <span>נמוך</span><span>גבוה</span>
                    </div>
                  </div>
                )
              })}

              <div>
                <label style={labelStyle}>📝 הערה</label>
                <textarea value={newEntry.notes || ''} onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))} rows={2}
                  style={{ ...inputStyle, resize: 'none' }} placeholder="איך הרגשת היום?" />
              </div>

              <button onClick={handleSave} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'שומר...' : 'שמור מדדים'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
