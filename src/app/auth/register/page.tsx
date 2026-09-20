'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react'
import { calculateBMR, calculateTDEE, calculateGoalCalories, calculateMacros, getAge } from '@/lib/macros'
import { GOAL_TYPE_LABELS, ACTIVITY_LABELS } from '@/types'

const steps = ['פרטים אישיים', 'מטרות', 'יעדים', 'העדפות', 'לוח זמנים']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    // Step 1
    name: '', email: '', password: '', dob: '', gender: 'male', height: '', currentWeight: '', targetWeight: '',
    // Step 2
    goalType: 'lose', activityLevel: 'moderate', workoutsPerWeek: 3, targetDate: '',
    // Step 3 (auto-calculated)
    dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65, dailyWater: 2.5, mealsPerDay: 4,
    // Step 4
    isKosher: false, isVegetarian: false, isVegan: false, allergies: '', dislikes: '', favorites: '', medicalNotes: '',
    // Step 5
    maxPrepTime: 30, mealTimes: '', workoutTimes: '',
  })

  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const calcMacros = () => {
    if (!form.dob || !form.height || !form.currentWeight) return
    const age = getAge(new Date(form.dob))
    const bmr = calculateBMR(Number(form.currentWeight), Number(form.height), age, form.gender)
    const tdee = calculateTDEE(bmr, form.activityLevel)
    const cals = calculateGoalCalories(tdee, form.goalType)
    const macros = calculateMacros(cals, form.goalType)
    setForm(f => ({ ...f, dailyCalories: cals, ...macros }))
  }

  const next = () => {
    if (step === 1) calcMacros()
    setStep(s => Math.min(s + 1, steps.length - 1))
  }
  const back = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'שגיאה ברישום')
        setLoading(false)
        return
      }
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      router.push('/')
    } catch {
      setError('שגיאה בחיבור לשרת')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl">🥗</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">הרשמה למערכת</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-primary-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">{steps[step]}</p>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl">
          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">{error}</p>}

          {/* Step 1: Personal */}
          {step === 0 && (
            <div className="space-y-3">
              {[['name', 'text', 'שם מלא', 'ישראל ישראלי'], ['email', 'email', 'אימייל', 'you@email.com'], ['password', 'password', 'סיסמה', '••••••••']].map(([k, t, l, ph]) => (
                <div key={k}>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">{l}</label>
                  <input type={t} value={(form as Record<string, unknown>)[k] as string} onChange={e => update(k, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder={ph} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">תאריך לידה</label>
                  <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">מין</label>
                  <select value={form.gender} onChange={e => update('gender', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400">
                    <option value="male">זכר</option>
                    <option value="female">נקבה</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[['height', 'גובה (ס"מ)'], ['currentWeight', 'משקל (ק"ג)'], ['targetWeight', 'יעד (ק"ג)']].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">{l}</label>
                    <input type="number" value={(form as Record<string, unknown>)[k] as string} onChange={e => update(k, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">מטרה עיקרית</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => update('goalType', k)}
                      className={`text-right px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${form.goalType === k ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">רמת פעילות</label>
                <div className="space-y-2">
                  {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => update('activityLevel', k)}
                      className={`w-full text-right px-4 py-2 rounded-xl border-2 text-xs font-medium transition-colors ${form.activityLevel === k ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">אימונים בשבוע: {form.workoutsPerWeek}</label>
                <input type="range" min={0} max={7} value={form.workoutsPerWeek} onChange={e => update('workoutsPerWeek', Number(e.target.value))}
                  className="w-full accent-primary-500" />
              </div>
            </div>
          )}

          {/* Step 3: Macros */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                חישבנו יעדים ראשוניים על בסיס הנתונים שלך. תוכל לשנות אותם ידנית בכל עת.
              </p>
              {[
                ['dailyCalories', 'קלוריות יומיות', 'קק"ל', 1200, 4000],
                ['dailyProtein', 'חלבון', 'ג\'', 50, 300],
                ['dailyCarbs', 'פחמימות', 'ג\'', 50, 500],
                ['dailyFat', 'שומן', 'ג\'', 30, 200],
              ].map(([k, l, u, min, max]) => (
                <div key={k}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{l}</label>
                    <span className="text-sm font-bold text-primary-600">{(form as Record<string, unknown>)[k] as number} {u}</span>
                  </div>
                  <input type="range" min={min} max={max} step={k === 'dailyCalories' ? 50 : 5}
                    value={(form as Record<string, unknown>)[k] as number}
                    onChange={e => update(k as string, Number(e.target.value))}
                    className="w-full accent-primary-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">מים יומיים (ל')</label>
                  <input type="number" step="0.1" value={form.dailyWater} onChange={e => update('dailyWater', Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">ארוחות ביום</label>
                  <select value={form.mealsPerDay} onChange={e => update('mealsPerDay', Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400">
                    {[3,4,5,6].map(n => <option key={n} value={n}>{n} ארוחות</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Dietary */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[['isKosher', 'כשר'], ['isVegetarian', 'צמחוני'], ['isVegan', 'טבעוני']].map(([k, l]) => (
                  <button key={k} onClick={() => update(k, !(form as Record<string, unknown>)[k])}
                    className={`py-2 rounded-xl border-2 text-sm font-medium transition-colors ${(form as Record<string, unknown>)[k] ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {[['allergies', 'אלרגיות (הפרד בפסיק)'], ['dislikes', 'מאכלים שלא אוהב'], ['favorites', 'מאכלים אהובים']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">{l}</label>
                  <input type="text" value={(form as Record<string, unknown>)[k] as string} onChange={e => update(k, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="לדוגמה: בוטנים, חלב..." />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">מגבלות רפואיות (רשות)</label>
                <textarea value={form.medicalNotes} onChange={e => update('medicalNotes', e.target.value)} rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  placeholder="סוכרת, לחץ דם גבוה..." />
                <p className="text-xs text-slate-400 mt-1">⚠️ המערכת אינה מחליפה ייעוץ מקצועי</p>
              </div>
            </div>
          )}

          {/* Step 5: Schedule */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">זמן הכנה מקסימלי (דקות): {form.maxPrepTime}</label>
                <input type="range" min={5} max={120} step={5} value={form.maxPrepTime} onChange={e => update('maxPrepTime', Number(e.target.value))}
                  className="w-full accent-primary-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">שעות ארוחות מועדפות</label>
                <input type="text" value={form.mealTimes} onChange={e => update('mealTimes', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="07:00, 10:00, 13:00, 19:00" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">שעות אימון</label>
                <input type="text" value={form.workoutTimes} onChange={e => update('workoutTimes', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="18:00" />
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">סיכום היעדים שלך:</p>
                <p className="text-xs text-green-600 dark:text-green-500">🔥 {form.dailyCalories} קק"ל ביום</p>
                <p className="text-xs text-green-600 dark:text-green-500">💪 {form.dailyProtein}ג חלבון | {form.dailyCarbs}ג פחמימות | {form.dailyFat}ג שומן</p>
                <p className="text-xs text-green-600 dark:text-green-500">💧 {form.dailyWater}ל מים | {form.mealsPerDay} ארוחות</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <button onClick={back} className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight size={18} />
                חזרה
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors">
                הבא
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {loading ? 'יוצר חשבון...' : 'סיום והרשמה'}
              </button>
            )}
          </div>

          {step === 0 && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
              יש לך כבר חשבון?{' '}
              <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">כניסה</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
