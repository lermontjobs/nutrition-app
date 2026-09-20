'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Plus, X, Camera, Sparkles, Loader2, Check, Trash2, AlertCircle } from 'lucide-react'

interface LogEntry {
  id: string
  foodName: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: string
  isEstimated?: boolean
}

interface DayLog {
  id: string
  date: string
  mealType: string
  logEntries: LogEntry[]
}

const MEAL_TYPES = [
  { key: 'breakfast', label: 'בוקר', emoji: '☀️' },
  { key: 'morning_snack', label: 'נשנש בוקר', emoji: '\u{1F34E}' },
  { key: 'lunch', label: 'צהריים', emoji: '\u{1F957}' },
  { key: 'afternoon_snack', label: 'נשנש אחה"צ', emoji: '\u{1F330}' },
  { key: 'dinner', label: 'ערב', emoji: '\u{1F319}' },
]

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'בוקר',
  morning_snack: 'נשנש בוקר',
  lunch: 'צהריים',
  afternoon_snack: 'נשנש אחה"צ',
  dinner: 'ערב',
}

export default function DiaryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [date, setDate] = useState(new Date())
  const [logs, setLogs] = useState<DayLog[]>([])
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState({ dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 })

  // Add meal modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addMealType, setAddMealType] = useState('breakfast')

  // Text input mode
  const [textInput, setTextInput] = useState('')
  const [textLoading, setTextLoading] = useState(false)
  const [textResult, setTextResult] = useState<any>(null)
  const [textError, setTextError] = useState('')

  // Photo mode
  const [photoMode, setPhotoMode] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoResult, setPhotoResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Saving
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (session) { fetchLogs(); fetchGoals() }
  }, [session, status, date])

  const dateStr = date.toISOString().split('T')[0]

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/diary?date=${dateStr}`)
      if (res.ok) {
        const d = await res.json()
        // API returns flat logs array; group by mealType into DayLog format
        const rawLogs: any[] = d.logs || []
        const grouped: Record<string, DayLog> = {}
        rawLogs.forEach((log: any) => {
          const mt = log.mealType || 'breakfast'
          if (!grouped[mt]) grouped[mt] = { id: mt, date: dateStr, mealType: mt, logEntries: [] }
          grouped[mt].logEntries.push({
            id: log.id,
            foodName: log.food?.name || log.foodName || 'אוכל',
            quantity: log.quantity || 0,
            unit: log.unit || 'ג',
            calories: log.calories || 0,
            protein: log.protein || 0,
            carbs: log.carbs || 0,
            fat: log.fat || 0,
            mealType: mt,
            isEstimated: !!(log.notes && log.notes.includes('AI')),
          })
        })
        setLogs(Object.values(grouped))
      }
    } finally { setLoading(false) }
  }

  const fetchGoals = async () => {
    const res = await fetch('/api/goals')
    if (res.ok) {
      const d = await res.json()
      if (d.goals) setGoals({
        dailyCalories: d.goals.dailyCalories || 2000,
        dailyProtein: d.goals.dailyProtein || 150,
        dailyCarbs: d.goals.dailyCarbs || 200,
        dailyFat: d.goals.dailyFat || 65,
      })
    }
  }

  const navigate = (d: number) => {
    const nd = new Date(date)
    nd.setDate(nd.getDate() + d)
    setDate(nd)
  }

  const isToday = date.toDateString() === new Date().toDateString()

  // Totals
  const allEntries = logs.flatMap(l => l.logEntries)
  const totalCals = Math.round(allEntries.reduce((s, e) => s + e.calories, 0))
  const totalProtein = Math.round(allEntries.reduce((s, e) => s + e.protein, 0))
  const totalCarbs = Math.round(allEntries.reduce((s, e) => s + e.carbs, 0))
  const totalFat = Math.round(allEntries.reduce((s, e) => s + e.fat, 0))

  // Group by meal type
  const grouped: Record<string, LogEntry[]> = {}
  logs.forEach(log => {
    if (!grouped[log.mealType]) grouped[log.mealType] = []
    grouped[log.mealType].push(...log.logEntries)
  })

  // Analyze free text via AI
  const analyzeText = async () => {
    if (!textInput.trim()) return
    setTextLoading(true)
    setTextError('')
    setTextResult(null)
    try {
      const res = await fetch('/api/ai/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      })
      const d = await res.json()
      if (d.items) setTextResult(d)
      else setTextError(d.error || 'שגיאה בניתוח')
    } catch { setTextError('שגיאה בחיבור') }
    finally { setTextLoading(false) }
  }

  // Analyze photo
  const analyzePhoto = async (file: File) => {
    setPhotoLoading(true)
    setPhotoResult(null)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await fetch('/api/ai/analyze-meal', { method: 'POST', body: formData })
      const d = await res.json()
      if (d.items || d.totals) setPhotoResult(d)
      else setTextError(d.error || 'שגיאה בניתוח תמונה')
    } catch { setTextError('שגיאה בחיבור') }
    finally { setPhotoLoading(false) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
    analyzePhoto(file)
  }

  // Save entries to diary
  const saveEntries = async (items: any[]) => {
    setSaving(true)
    try {
      for (const item of items) {
        await fetch('/api/diary/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            mealType: addMealType,
            foodName: item.name,
            quantity: item.quantity || 100,
            unit: item.unit || 'גרם',
            calories: Math.round(item.calories || 0),
            protein: Math.round(item.protein || 0),
            carbs: Math.round(item.carbs || 0),
            fat: Math.round(item.fat || 0),
            isEstimated: true,
          }),
        })
      }
      await fetchLogs()
      setShowAddModal(false)
      setTextInput('')
      setTextResult(null)
      setPhotoResult(null)
      setPhotoPreview(null)
      setPhotoMode(false)
    } finally { setSaving(false) }
  }

  const deleteEntry = async (logId: string) => {
    await fetch(`/api/diary/log?id=${logId}`, { method: 'DELETE' })
    fetchLogs()
  }

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
      <Loader2 size={32} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const resultItems = textResult?.items || photoResult?.items || []
  const activeResult = textResult || photoResult

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.25rem', paddingBottom: '2rem' }}>

      {/* Date Nav */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '10px', background: 'var(--primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={20} style={{ color: 'var(--primary)' }} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0, fontSize: '1rem' }}>
            {isToday ? 'היום' : date.toLocaleDateString('he-IL', { weekday: 'long' })}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', margin: 0 }}>
            {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate(1)} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '10px', background: 'var(--primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} style={{ color: 'var(--primary)' }} />
        </button>
      </div>

      {/* Daily summary */}
      <div className="card" style={{ padding: '1.125rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>סיכום יומי</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: totalCals > goals.dailyCalories ? 'var(--coral)' : 'var(--lime)', background: totalCals > goals.dailyCalories ? 'var(--coral-light)' : '#F0FAD6', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
            {Math.max(0, goals.dailyCalories - totalCals)} קק"ל נותרו
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.875rem' }}>
          {[
            { label: 'קלוריות', value: totalCals, target: goals.dailyCalories, color: 'var(--primary)' },
            { label: 'חלבון', value: totalProtein, target: goals.dailyProtein, color: '#3B82F6' },
            { label: 'פחמימות', value: totalCarbs, target: goals.dailyCarbs, color: 'var(--orange)' },
            { label: 'שומן', value: totalFat, target: goals.dailyFat, color: 'var(--teal)' },
          ].map(({ label, value, target, color }) => (
            <div key={label} style={{ textAlign: 'center', background: '#F8F7FF', borderRadius: '12px', padding: '0.625rem 0.375rem' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-sub)', margin: '0.2rem 0 0' }}>{label}</p>
              <div style={{ height: '3px', background: '#EDE9FE', borderRadius: '100px', marginTop: '0.375rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: color, width: `${Math.min(100, (value / target) * 100)}%`, borderRadius: '100px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals list */}
      {MEAL_TYPES.map(({ key, label, emoji }) => {
        const entries = grouped[key] || []
        const mealCals = Math.round(entries.reduce((s, e) => s + e.calories, 0))
        return (
          <div key={key} className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: entries.length > 0 ? '0.75rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>{label}</span>
                {mealCals > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', background: '#F0EEF9', padding: '0.125rem 0.5rem', borderRadius: '20px' }}>{mealCals} קק"ל</span>}
              </div>
              <button
                onClick={() => { setAddMealType(key); setShowAddModal(true); setTextInput(''); setTextResult(null); setPhotoResult(null); setPhotoPreview(null); setPhotoMode(false); setTextError('') }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--primary-light)', border: 'none', borderRadius: '10px', padding: '0.375rem 0.75rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit' }}>
                <Plus size={14} />
                הוסיפי
              </button>
            </div>

            {entries.length === 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', margin: 0, textAlign: 'center', padding: '0.5rem 0' }}>
                לא נרשם עדיין
              </p>
            )}

            {entries.map((entry, i) => (
              <div key={entry.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: i === 0 ? '1px solid #F0EEF9' : '1px solid #F8F7FF' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{entry.foodName}</span>
                    {entry.isEstimated && <span style={{ fontSize: '0.625rem', color: 'var(--orange)', background: '#FFF3E0', padding: '0.125rem 0.375rem', borderRadius: '8px' }}>~אימוד</span>}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{entry.quantity}{entry.unit} · {entry.calories} קק"ל · חלב {entry.protein}ג</span>
                </div>
                <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E0D8F0', padding: '0.25rem' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )
      })}

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '14px', padding: '0.875rem' }}>
        <AlertCircle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: '0.125rem' }} />
        <p style={{ fontSize: '0.75rem', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
          בלילות עידוי AI הם אימודים. המערכת אינה מחליפה ייעוץ תזונאי מקצועי.
        </p>
      </div>

      {/* ADD MEAL MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 1.25rem 2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-main)', margin: 0 }}>הוספי ארוחה</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', margin: 0 }}>לארוחת {MEAL_LABELS[addMealType]}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#F0EEF9', border: 'none', borderRadius: '10px', width: '2rem', height: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} style={{ color: 'var(--primary)' }} />
              </button>
            </div>

            {/* Meal type selector */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
              {MEAL_TYPES.map(({ key, label, emoji }) => (
                <button key={key} onClick={() => setAddMealType(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0, background: addMealType === key ? 'var(--primary)' : 'var(--primary-light)', color: addMealType === key ? 'white' : 'var(--primary)', transition: 'all 0.2s' }}>
                  {emoji} {label}
                </button>
              ))}
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <button onClick={() => { setPhotoMode(false); setPhotoResult(null); setPhotoPreview(null) }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '14px', border: `2px solid ${!photoMode ? 'var(--primary)' : '#EDE9FE'}`, background: !photoMode ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem', color: !photoMode ? 'var(--primary)' : 'var(--text-sub)' }}>
                <Sparkles size={16} />
                תיאור בטקסט
              </button>
              <button onClick={() => { setPhotoMode(true); setTextResult(null) }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '14px', border: `2px solid ${photoMode ? 'var(--primary)' : '#EDE9FE'}`, background: photoMode ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem', color: photoMode ? 'var(--primary)' : 'var(--text-sub)' }}>
                <Camera size={16} />
                צילום / תמונה
              </button>
            </div>

            {/* TEXT MODE */}
            {!photoMode && (
              <div>
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="לדוגמא: אכלתי שני חביתות עם גבינה לבנה, פרוסת לחם מחיטה מלאה וקפה"
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.875rem', borderRadius: '14px', border: '2px solid #EDE9FE', fontFamily: 'Heebo, sans-serif', fontSize: '0.9375rem', resize: 'none', outline: 'none', color: 'var(--text-main)', direction: 'rtl' }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#EDE9FE'}
                />
                <button
                  onClick={analyzeText}
                  disabled={textLoading || !textInput.trim()}
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.875rem', borderRadius: '14px', border: 'none', background: textLoading || !textInput.trim() ? '#D1CAF0' : 'var(--primary)', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9375rem', cursor: textLoading || !textInput.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {textLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> מנתח...</> : <><Sparkles size={16} /> נתחי עם AI</>}
                </button>
              </div>
            )}

            {/* PHOTO MODE */}
            {photoMode && (
              <div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                {!photoPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: '2px dashed #EDE9FE', borderRadius: '16px', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: 'var(--primary-light)' }}>
                    <Camera size={40} style={{ color: 'var(--primary)' }} />
                    <p style={{ fontWeight: 700, color: 'var(--primary)', margin: 0 }}>צלמי או בחרי תמונה</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', margin: 0, textAlign: 'center' }}>AI ינתח את הארוחה ויחשב ערכים תזונתיים</p>
                  </div>
                ) : (
                  <div>
                    <img src={photoPreview} alt="meal" style={{ width: '100%', borderRadius: '16px', maxHeight: '200px', objectFit: 'cover' }} />
                    {photoLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        מנתח תמונה...
                      </div>
                    )}
                    <button onClick={() => { setPhotoPreview(null); setPhotoResult(null) }}
                      style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      בחרי תמונה אחרת
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {textError && (
              <div style={{ marginTop: '0.75rem', background: '#FFF0F2', border: '1.5px solid #FFD0D8', borderRadius: '12px', padding: '0.75rem', fontSize: '0.875rem', color: '#C0002A' }}>
                {textError}
              </div>
            )}

            {/* RESULTS */}
            {(textResult || photoResult) && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>תוצאות הניתוח</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--orange)', background: '#FFF3E0', padding: '0.125rem 0.5rem', borderRadius: '8px' }}>~אימוד</span>
                </div>

                {(textResult?.items || photoResult?.items || []).map((item: any, i: number) => (
                  <div key={i} style={{ background: '#F8F7FF', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{Math.round(item.calories)} קק"ל</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                      {item.quantity && <span>{item.quantity}{item.unit || 'ג'}</span>}
                      <span>חלב {Math.round(item.protein || 0)}ג</span>
                      <span>פחמ {Math.round(item.carbs || 0)}ג</span>
                      <span>שומ {Math.round(item.fat || 0)}ג</span>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                {activeResult?.totals && (
                  <div style={{ background: 'linear-gradient(135deg, var(--primary-light), #F0FAD6)', borderRadius: '14px', padding: '0.875rem', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', gap: '0.5rem' }}>
                    {[
                      { label: 'קלוריות', value: Math.round(activeResult.totals.calories || 0), color: 'var(--primary)' },
                      { label: 'חלבון', value: Math.round(activeResult.totals.protein || 0) + 'ג', color: '#3B82F6' },
                      { label: 'פחמימות', value: Math.round(activeResult.totals.carbs || 0) + 'ג', color: 'var(--orange)' },
                      { label: 'שומן', value: Math.round(activeResult.totals.fat || 0) + 'ג', color: 'var(--teal)' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ fontWeight: 900, fontSize: '1.125rem', color, margin: 0 }}>{value}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-sub)', margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes from AI */}
                {activeResult?.healthNotes && (
                  <div style={{ background: '#F0FAD6', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8125rem', color: '#3D6B00', lineHeight: 1.5 }}>
                    💡 {activeResult.healthNotes}
                  </div>
                )}

                <button
                  onClick={() => saveEntries(textResult?.items || photoResult?.items || [])}
                  disabled={saving}
                  style={{ width: '100%', padding: '0.9375rem', borderRadius: '14px', border: 'none', background: saving ? '#D1CAF0' : 'linear-gradient(135deg, var(--primary), #9747FF)', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> שומר...</> : <><Check size={16} /> אשרי והוסיפי ליומן</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
