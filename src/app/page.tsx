'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Droplets, ChevronLeft, Check, Loader2, X } from 'lucide-react'
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

const QUOTES = [
  '\u05D0\u05EA \u05D7\u05D6\u05E7\u05D4 \u05D9\u05D5\u05EA\u05E8 \u05DE\u05DE\u05D4 \u05E9\u05D0\u05EA \u05D7\u05D5\u05E9\u05D1\u05EA. \u05DB\u05DC \u05D1\u05D7\u05D9\u05E8\u05D4 \u05E7\u05D8\u05E0\u05D4 \u05E9\u05D0\u05EA \u05E2\u05D5\u05E9\u05D4 \u05D4\u05D9\u05D5\u05DD \u05D1\u05D5\u05E0\u05D4 \u05D0\u05EA \u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05DC\u05DE\u05D7\u05E8.',
  '\u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05E9\u05D5\u05DE\u05E2 \u05DC\u05DB\u05DC \u05D3\u05D1\u05E8 \u05E9\u05D0\u05EA \u05E2\u05D5\u05E9\u05D4 \u05E2\u05D1\u05D5\u05E8\u05D5. \u05EA\u05E0\u05D9 \u05DC\u05D5 \u05D0\u05D4\u05D1\u05D4.',
  '\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA \u05D0\u05D9\u05E0\u05D4 \u05E8\u05E7 \u05D1\u05E7\u05D9\u05DC\u05D5\u05D2\u05E8\u05DE\u05D9\u05DD. \u05D4\u05D9\u05D0 \u05D1\u05D0\u05D5\u05E8\u05D2\u05D4 \u05E9\u05DC\u05DA, \u05D1\u05D0\u05E0\u05E8\u05D2\u05D9\u05D4, \u05D1\u05D1\u05D7\u05D9\u05E8\u05D5\u05EA.',
  '\u05D9\u05D5\u05DD \u05D0\u05D7\u05D3 \u05D1\u05DB\u05DC \u05E4\u05E2\u05DD. \u05D6\u05D4\u05D5 \u05D4\u05E1\u05D5\u05D3 \u05E9\u05DC \u05D2\u05D5\u05E4\u05D5\u05EA \u05D7\u05D6\u05E7\u05D5\u05EA.',
  '\u05D0\u05EA \u05D0\u05D9\u05E0\u05DA \u05D1\u05EA\u05D7\u05E8\u05D5\u05EA \u05E2\u05DD \u05D0\u05E3 \u05D0\u05D7\u05EA \u05D0\u05D7\u05E8\u05EA. \u05D0\u05EA \u05D1\u05EA\u05D7\u05E8\u05D5\u05EA \u05E2\u05DD \u05D4\u05D2\u05E8\u05E1\u05D4 \u05D4\u05D8\u05D5\u05D1\u05D4 \u05D1\u05D9\u05D5\u05EA\u05E8 \u05E9\u05DC\u05DA.',
  '\u05DB\u05DC \u05DE\u05E9\u05D4 \u05D9\u05E9 \u05DC\u05DA \u05D0\u05E0\u05E8\u05D2\u05D9\u05D4 \u05DC\u05D9\u05D5\u05DD \u05D4\u05D6\u05D4 \u05D4\u05D5\u05D0 \u05D4\u05E9\u05E7\u05E2\u05D4 \u05D1\u05DE\u05D7\u05E8.',
  '\u05D0\u05D4\u05D1\u05D9 \u05D0\u05EA \u05E2\u05E6\u05DE\u05DA \u05DE\u05E1\u05E4\u05D9\u05E7 \u05DB\u05D3\u05D9 \u05DC\u05E2\u05E9\u05D5\u05EA \u05DC\u05D4 \u05D8\u05D5\u05D1.',
  '\u05D4\u05D9\u05D5\u05DD \u05D4\u05D6\u05D4, \u05E2\u05DB\u05E9\u05D9\u05D5, \u05D4\u05E0\u05D7 \u05D0\u05D5\u05EA\u05DA. \u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05DE\u05EA\u05D0\u05DE\u05DF.',
  '\u05E2\u05E7\u05D1\u05D9\u05D5\u05EA\u05D9\u05D9\u05D5\u05EA \u05D4\u05D9\u05D0 \u05DC\u05D0 \u05E2\u05D5\u05E0\u05E9\u05D9\u05DF. \u05D6\u05D5 \u05D0\u05D5\u05D4\u05D1\u05EA \u05D0\u05EA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA.',
  '\u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05E2\u05E9\u05D4 \u05D3\u05D1\u05E8\u05D9\u05DD \u05DE\u05D3\u05D4\u05D9\u05DE\u05D9\u05DD \u05E2\u05D1\u05D5\u05E8\u05DA \u05DB\u05DC \u05D9\u05D5\u05DD. \u05EA\u05E0\u05D9 \u05DC\u05D5 \u05E1\u05D9\u05D1\u05D4 \u05DC\u05D4\u05DE\u05E9\u05D9\u05DA.',
  '\u05DB\u05DC \u05D9\u05D5\u05DD \u05E9\u05D0\u05EA \u05E7\u05DE\u05D4 \u05D1\u05D1\u05D5\u05E7\u05E8 \u05D5\u05D1\u05D5\u05D7\u05E8\u05EA \u05DC\u05D4\u05D9\u05D5\u05EA \u05D1\u05E8\u05D9\u05D0\u05D4 \u05D4\u05D9\u05D0 \u05E0\u05E6\u05D7\u05D5\u05DF.',
  '\u05D0\u05EA \u05E8\u05D5\u05E6\u05D4 \u05EA\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05DC\u05D0 \u05E2\u05E9\u05D9\u05EA \u05D0\u05EA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA.',
  '\u05D4\u05D1\u05E8\u05D9\u05D0\u05D5\u05EA \u05D4\u05D9\u05D0 \u05DC\u05D0 \u05D9\u05E2\u05D3 \u05D0\u05D7\u05D3 - \u05D4\u05D9\u05D0 \u05D0\u05D5\u05E8\u05D7 \u05D7\u05D9\u05D9\u05DD.',
  '\u05DE\u05D4 \u05E9\u05E0\u05E8\u05D0\u05D4 \u05E7\u05E9\u05D4 \u05E2\u05DB\u05E9\u05D9\u05D5 \u05D9\u05D4\u05E4\u05D5\u05DA \u05DC\u05D3\u05D1\u05E8 \u05E9\u05D0\u05EA \u05D2\u05D0\u05D4 \u05D1\u05D5.',
  '\u05E9\u05E8\u05D9\u05E8\u05D5\u05EA \u05D0\u05D9\u05E0\u05D4 \u05E8\u05E7 \u05E4\u05D9\u05D6\u05D9\u05EA \u05D0\u05DC\u05D0 \u05D2\u05DD \u05E0\u05E4\u05E9\u05D9\u05EA.',
  '\u05DB\u05DC \u05E6\u05E2\u05D3 \u05E7\u05D3\u05D9\u05DE\u05D4 \u05D4\u05D5\u05D0 \u05E6\u05E2\u05D3 \u05D0\u05D7\u05D3 \u05E7\u05E8\u05D5\u05D1 \u05D9\u05D5\u05EA\u05E8 \u05DC\u05DE\u05D9 \u05E9\u05D0\u05EA \u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA.',
  '\u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05D4\u05D5\u05D0 \u05D1\u05D9\u05EA\u05DA. \u05EA\u05E0\u05D9 \u05DC\u05D5 \u05D0\u05D5\u05D4\u05D1\u05D4.',
  '\u05D4\u05D9\u05D5\u05DD \u05D4\u05D6\u05D4 \u05D9\u05DB\u05E8\u05D9\u05E2 \u05D0\u05EA \u05D4\u05DE\u05D7\u05E1\u05D5\u05DD \u05D4\u05E9\u05DC\u05DA \u05D0\u05D5 \u05D9\u05E7\u05E8\u05D1 \u05D0\u05D5\u05EA\u05DA \u05D0\u05DC\u05D9\u05D5.',
  '\u05D0\u05D9\u05DF \u05D3\u05D9\u05D0\u05D8\u05D4 \u05DE\u05D5\u05E9\u05DC\u05DE\u05EA \u05D1\u05DC\u05D9\u05DC\u05D4 \u05D0\u05D7\u05EA. \u05D9\u05E9 \u05E2\u05E7\u05D1\u05D9\u05D5\u05EA\u05D9\u05D5\u05EA \u05D9\u05D5\u05DE\u05D9\u05EA.',
  '\u05D1\u05D7\u05E8\u05D9 \u05D0\u05EA \u05D4\u05D1\u05E8\u05D9\u05D0\u05D5\u05EA \u05DB\u05D0\u05D5\u05E8\u05D7 \u05D7\u05D9\u05D9\u05DD, \u05DC\u05D0 \u05DB\u05E2\u05D5\u05E0\u05E9.',
  '\u05E2\u05E7\u05D1\u05D9\u05D5\u05EA\u05D9\u05D5\u05EA\u05DA \u05E7\u05D8\u05E0\u05D4 \u05DE\u05D9\u05D5\u05DD \u05E0\u05EA\u05E0 \u05EA\u05D5\u05E6\u05D0\u05D5\u05EA \u05D2\u05D3\u05D5\u05DC\u05D5\u05EA.',
  '\u05D0\u05EA \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05D5\u05E9\u05DC\u05DE\u05EA - \u05E8\u05E7 \u05DC\u05D4\u05EA\u05E7\u05D3\u05DD.',
  '\u05DB\u05DC \u05E1\u05D9\u05D1\u05D5\u05D1 \u05E8\u05D5\u05E6\u05D4 \u05E9\u05EA\u05E8\u05D9\u05E6\u05D9 - \u05D6\u05D9\u05DB\u05E8\u05D9 \u05DC\u05DE\u05D4 \u05D0\u05EA \u05E8\u05E6\u05D4.',
  '\u05D4\u05D2\u05D5\u05E3 \u05E9\u05DC\u05DA \u05D6\u05D5\u05DB\u05E8 \u05DB\u05DC \u05DE\u05D0\u05DE\u05E5 \u05E9\u05E2\u05E9\u05D9\u05EA \u05E2\u05D1\u05D5\u05E8\u05D5.',
  '\u05D9\u05D5\u05DD \u05D0\u05D7\u05D3 \u05E7\u05E9\u05D4 \u05DC\u05D0 \u05DE\u05D1\u05D8\u05DC \u05E9\u05E0\u05D9\u05DD \u05E9\u05DC \u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA.',
  '\u05D0\u05EA \u05D3\u05D5\u05D0\u05D2\u05EA \u05DC\u05E2\u05E6\u05DE\u05DA \u05D5\u05D0\u05EA \u05D0\u05D5\u05D4\u05D1\u05EA \u05D0\u05EA \u05D1\u05E8\u05D9\u05D0\u05D5\u05EA\u05DA - \u05D6\u05D4 \u05E0\u05E8\u05D0\u05D4.',
  '\u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA \u05D4\u05D5\u05D0 \u05D4\u05E1\u05D9\u05E4\u05D5\u05E8 - \u05DC\u05D0 \u05E8\u05E7 \u05D4\u05EA\u05D5\u05E6\u05D0\u05D4.',
  '\u05DB\u05DC \u05D9\u05D5\u05DD \u05E9\u05D0\u05EA \u05D1\u05D5\u05D7\u05E8\u05EA \u05DC\u05D4\u05D0\u05DB\u05D9\u05DC \u05D8\u05D5\u05D1 \u05D0\u05EA \u05E6\u05D5\u05D4\u05D1\u05EA \u05DC\u05E2\u05E6\u05DE\u05DA.',
  '\u05E9\u05D9\u05E0\u05D5\u05D9 \u05E7\u05D8\u05DF + \u05E2\u05E7\u05D1\u05D9\u05D5\u05EA\u05D9\u05D5\u05EA = \u05E9\u05D9\u05E0\u05D5\u05D9 \u05D2\u05D3\u05D5\u05DC.',
  '\u05D0\u05EA \u05D2\u05D0\u05D4 \u05D1\u05D8\u05D9\u05E4\u05D5\u05DC \u05D1\u05E2\u05E6\u05DE\u05DA. \u05D6\u05D4 \u05D9\u05D5\u05E6\u05D0 \u05E2\u05DC\u05D9\u05DA.',
]

function getDailyQuote(): string {
  const today = new Date()
  const dayIndex = today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()
  return QUOTES[dayIndex % QUOTES.length]
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
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s' }} />
    </svg>
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
  const [dailyMenu, setDailyMenu] = useState<any>(null)
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuExpanded, setMenuExpanded] = useState(false)
  const [fillModal, setFillModal] = useState(false)
  const [fillMenu, setFillMenu] = useState<any>(null)
  const [fillLoading, setFillLoading] = useState(false)
  const [fillSaving, setFillSaving] = useState(false)
  const [fillDone, setFillDone] = useState(false)

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

  const fetchMenu = async () => {
    if (dailyMenu) { setMenuExpanded(e => !e); return }
    setMenuLoading(true)
    try {
      const res = await fetch('/api/ai/daily-menu')
      if (res.ok) { const d = await res.json(); if (d.meals) setDailyMenu(d) }
    } finally { setMenuLoading(false) }
    setMenuExpanded(true)
  }

  const openFillModal = async () => {
    setFillModal(true); setFillDone(false)
    if (fillMenu) return
    setFillLoading(true)
    try {
      const res = await fetch('/api/ai/daily-menu')
      if (res.ok) { const d = await res.json(); if (d.meals) setFillMenu(d) }
    } finally { setFillLoading(false) }
  }

  const confirmFillDiary = async () => {
    if (!fillMenu) return
    setFillSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const MEAL_ITEMS_MAP: Record<string, string> = {}
    try {
      for (const meal of fillMenu.meals) {
        const perItemCals = Math.round((meal.calories || 0) / Math.max(1, (meal.items || []).length))
        const perItemProt = Math.round((meal.protein || 0) / Math.max(1, (meal.items || []).length))
        const perItemCarbs = Math.round((meal.carbs || 0) / Math.max(1, (meal.items || []).length))
        const perItemFat = Math.round((meal.fat || 0) / Math.max(1, (meal.items || []).length))
        for (const itemName of (meal.items || [])) {
          await fetch('/api/diary/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: today, mealType: meal.mealType,
              foodName: String(itemName).substring(0, 80),
              quantity: 100, unit: 'גרם',
              calories: perItemCals, protein: perItemProt,
              carbs: perItemCarbs, fat: perItemFat,
              isEstimate: true
            })
          })
        }
      }
      setFillDone(true)
    } finally { setFillSaving(false) }
  }

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
  const dailyQuote = getDailyQuote()

  const MEAL_LABELS: Record<string, string> = {
    breakfast: 'בוקר', morning_snack: 'נשנוש בוקר', lunch: 'צהריים',
    afternoon_snack: 'נשנוש אחה"צ', dinner: 'ערב'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem', paddingTop: '0.25rem' }}>
      {showCamera && <MealCamera onClose={() => setShowCamera(false)} onAddToLog={() => fetchData()} />}

      {/* Daily quote from Sergei */}
      <div style={{ background: 'linear-gradient(135deg, #F3F0FF 0%, #E8F4FD 100%)', borderRadius: '20px', padding: '1.125rem 1.25rem', border: '1.5px solid rgba(108,76,241,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', opacity: 0.06, lineHeight: 1 }}>💙</div>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>מסרגיי, באהבה ❤️</p>
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>"{dailyQuote}"</p>
      </div>

      {/* Main calorie card */}
      <div className="card animate-fade-up" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #9747FF 100%)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <CalorieRingNew eaten={eaten.calories} target={target} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.625rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{Math.round(eaten.calories)}</span>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem' }}>מתוך {target}</span>
            </div>
          </div>
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

      {/* Fill diary banner */}
      <button onClick={openFillModal} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, #F0FAD6 0%, #E8F5D6 100%)', border: '1.5px solid rgba(61,107,0,0.2)', borderRadius: '20px', padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'right' }}>
        <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #7CB900, #5C8A00)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', flexShrink: 0 }}>✨</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, color: '#3D6B00', margin: '0 0 0.25rem', fontSize: '0.9375rem' }}>מלאי תפריט יומי שלם</p>
          <p style={{ fontSize: '0.8125rem', color: '#5C8A00', margin: 0 }}>AI ימלא את כל הארוחות להיום לפי המטרות שלך</p>
        </div>
        <ChevronLeft size={20} style={{ color: '#5C8A00', flexShrink: 0 }} />
      </button>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }} className="animate-fade-up">
        {[
          { href: '/diary', icon: '🍽️', label: 'הוסיפי ארוחה', bg: 'var(--primary-light)', color: 'var(--primary)' },
          { href: '/measurements', icon: '⚖️', label: 'עדכני משקל', bg: 'var(--coral-light)', color: 'var(--coral)' },
          { href: '/chat', icon: '✨', label: 'שאלי AI', bg: '#F0FAD6', color: '#5C8A00' },
          { href: '/progress', icon: '📊', label: 'התקדמות', bg: 'var(--teal-light)', color: '#0E7B7C' },
        ].map(({ href, icon, label, bg, color }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', borderRadius: '18px', padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', boxShadow: 'var(--card-shadow)', cursor: 'pointer' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>{icon}</div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
            </div>
          </Link>
        ))}
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

      {/* AI chat strip */}
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
                <div className="progress-fill" style={{ background: 'linear-gradient(90deg, var(--primary), var(--coral))', width: `${Math.min(100, Math.max(5, ((goals?.currentWeight || currentWeight) - currentWeight) / Math.max(0.1, (goals?.currentWeight || currentWeight) - targetWeight) * 100))}%` }} />
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

      {/* Daily Menu Card */}
      {goals && (
        <div className="card animate-fade-up" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: menuExpanded && dailyMenu ? '1rem' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', background: 'linear-gradient(135deg, #FFE0B2, #FFF3E0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>🍽️</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)', margin: 0 }}>תפריט יומי מומלץ</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', margin: 0 }}>מותאם אישית ל-{goals.dailyCalories} קק&quot;ל</p>
              </div>
            </div>
            <button onClick={fetchMenu} disabled={menuLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: menuExpanded ? 'var(--primary-light)' : 'var(--primary)', color: menuExpanded ? 'var(--primary)' : 'white', border: 'none', borderRadius: '12px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'inherit' }}>
              {menuLoading ? '⏳ טוענת...' : menuExpanded ? 'סגרי ▲' : '✨ הצגי תפריט'}
            </button>
          </div>
          {menuExpanded && dailyMenu && (
            <div>
              {dailyMenu.meals?.map((meal: any, i: number) => (
                <div key={i} style={{ borderTop: i > 0 ? '1px solid #F0EEF9' : 'none', paddingTop: i > 0 ? '0.75rem' : 0, marginTop: i > 0 ? '0.75rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{meal.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{meal.name}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.125rem 0.5rem', borderRadius: '10px', fontWeight: 600 }}>{meal.calories} קק&quot;ל</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', marginBottom: '0.25rem' }}>
                    {meal.items?.join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                    <span>💪 {meal.protein}ג</span>
                    <span>🌾 {meal.carbs}ג</span>
                    <span>⏱ {meal.prepTime} דק'</span>
                  </div>
                </div>
              ))}
              {dailyMenu.nutritionNote && (
                <div style={{ marginTop: '1rem', background: '#F0FAD6', borderRadius: '12px', padding: '0.75rem', fontSize: '0.8125rem', color: '#3D6B00', lineHeight: 1.5 }}>
                  💡 {dailyMenu.nutritionNote}
                </div>
              )}
            </div>
          )}
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

      {/* ======== FILL DIARY MODAL ======== */}
      {fillModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem 1.25rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-main)', margin: 0 }}>מילוי תפריט יומי שלם</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', margin: 0 }}>AI ימלא את כל הארוחות להיום</p>
              </div>
              <button onClick={() => setFillModal(false)} style={{ background: '#F0EEF9', border: 'none', borderRadius: '10px', width: '2rem', height: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} style={{ color: 'var(--primary)' }} />
              </button>
            </div>

            {fillLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 0', color: 'var(--primary)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: 600 }}>ה-AI בונה תפריט יומי מותאם...</span>
              </div>
            )}

            {fillDone && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', textAlign: 'center' }}>
                <div style={{ width: '4rem', height: '4rem', background: '#F0FAD6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} style={{ color: 'var(--lime)' }} />
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-main)', margin: 0 }}>היומן מולא בהצלחה! 🎉</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', margin: 0 }}>כל 5 הארוחות נוספו ליומן שלך להיום</p>
                <button onClick={() => { setFillModal(false); router.push('/diary') }}
                  style={{ padding: '0.875rem 2rem', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
                  עברי ליומן →
                </button>
              </div>
            )}

            {!fillLoading && !fillDone && fillMenu && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: '#FFF3E0', borderRadius: '12px', padding: '0.75rem' }}>
                  <span style={{ fontSize: '1rem' }}>⚠️</span>
                  <p style={{ fontSize: '0.8125rem', color: '#92400E', margin: 0 }}>ערכים מאומדים על ידי AI. ניתן לעדכן ביומן לאחר מכן.</p>
                </div>

                {fillMenu.meals?.map((meal: any, i: number) => (
                  <div key={i} style={{ border: '1.5px solid #EDE9FE', borderRadius: '14px', padding: '0.875rem', marginBottom: '0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{meal.emoji}</span>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{meal.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', display: 'block' }}>{MEAL_LABELS[meal.mealType] || meal.mealType}</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>{meal.calories} קק"ל</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-sub)', marginBottom: '0.375rem' }}>
                      {meal.items?.join(' · ')}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                      <span>💪 {meal.protein}ג</span>
                      <span>🌾 {meal.carbs}ג</span>
                      <span>⏱ {meal.prepTime} דק'</span>
                    </div>
                  </div>
                ))}

                {fillMenu.dailyTotals && (
                  <div style={{ background: 'linear-gradient(135deg, var(--primary-light), #F0FAD6)', borderRadius: '14px', padding: '0.875rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', textAlign: 'center', gap: '0.5rem' }}>
                    {[
                      { l: 'קלוריות', v: fillMenu.dailyTotals.calories, c: 'var(--primary)' },
                      { l: 'חלבון', v: fillMenu.dailyTotals.protein + 'ג', c: '#3B82F6' },
                      { l: 'פחמימות', v: fillMenu.dailyTotals.carbs + 'ג', c: 'var(--orange)' },
                      { l: 'שומן', v: fillMenu.dailyTotals.fat + 'ג', c: 'var(--teal)' },
                    ].map(({ l, v, c }) => (
                      <div key={l}><p style={{ fontWeight: 900, fontSize: '1rem', color: c, margin: 0 }}>{v}</p><p style={{ fontSize: '0.65rem', color: 'var(--text-sub)', margin: 0 }}>{l}</p></div>
                    ))}
                  </div>
                )}

                <button onClick={confirmFillDiary} disabled={fillSaving}
                  style={{ width: '100%', padding: '0.9375rem', borderRadius: '14px', border: 'none', background: fillSaving ? '#D1CAF0' : 'linear-gradient(135deg,var(--primary),#9747FF)', color: 'white', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', cursor: fillSaving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {fillSaving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />ממלא את היומן...</> : <><Check size={16} />אשרי ומלאי את כל היומן</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
