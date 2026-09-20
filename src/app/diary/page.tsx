'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { ChevronRight, ChevronLeft, Plus, Check, RefreshCw, Edit2, Star, AlertCircle, X, Flame } from 'lucide-react'
import { MEAL_TYPE_LABELS } from '@/types'
import { MacroBar } from '@/components/ui/MacroBar'

type MealStatus = 'planned' | 'eaten_full' | 'eaten_partial' | 'skipped' | 'replaced'

interface FoodItem {
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DiaryMeal {
  id: string
  name: string
  mealType: string
  status: MealStatus
  items: FoodItem[]
  calories: number
  protein: number
  carbs: number
  fat: number
  prepTime: number
  instructions?: string
}

const mockMeals: DiaryMeal[] = [
  {
    id: '1', name: 'ארוחת בוקר', mealType: 'breakfast', status: 'eaten_full',
    calories: 420, protein: 32, carbs: 45, fat: 12, prepTime: 10,
    instructions: 'ערבב ביצים עם ירקות. צלה במחבת עם מעט שמן.',
    items: [
      { name: 'חביתה (2 ביצים)', quantity: 120, unit: 'ג', calories: 180, protein: 14, carbs: 1, fat: 13 },
      { name: 'גבינה לבנה 5%', quantity: 100, unit: 'ג', calories: 80, protein: 10, carbs: 3, fat: 3 },
      { name: 'לחם מחיטה מלאה', quantity: 60, unit: 'ג', calories: 140, protein: 5, carbs: 26, fat: 2 },
      { name: 'עגבנייה', quantity: 100, unit: 'ג', calories: 20, protein: 1, carbs: 4, fat: 0 },
    ],
  },
  {
    id: '2', name: 'ארוחת ביניים', mealType: 'morning_snack', status: 'eaten_full',
    calories: 180, protein: 15, carbs: 20, fat: 4, prepTime: 2,
    items: [
      { name: 'גביע קוטג\'', quantity: 200, unit: 'ג', calories: 140, protein: 14, carbs: 6, fat: 4 },
      { name: 'תפוח', quantity: 150, unit: 'ג', calories: 80, protein: 0, carbs: 21, fat: 0 },
    ],
  },
  {
    id: '3', name: 'ארוחת צהריים', mealType: 'lunch', status: 'planned',
    calories: 580, protein: 48, carbs: 60, fat: 14, prepTime: 20,
    instructions: 'צלה חזה עוף עם תבלינים. בשל אורז לפי הוראות. הגש עם ירקות.',
    items: [
      { name: 'חזה עוף', quantity: 200, unit: 'ג', calories: 220, protein: 42, carbs: 0, fat: 5 },
      { name: 'אורז לבן מבושל', quantity: 200, unit: 'ג', calories: 240, protein: 4, carbs: 52, fat: 0 },
      { name: 'ברוקולי מאודה', quantity: 150, unit: 'ג', calories: 50, protein: 4, carbs: 8, fat: 0 },
      { name: 'שמן זית', quantity: 10, unit: 'מ"ל', calories: 90, protein: 0, carbs: 0, fat: 10 },
    ],
  },
  {
    id: '4', name: 'ארוחת אחה"צ', mealType: 'afternoon_snack', status: 'planned',
    calories: 200, protein: 20, carbs: 15, fat: 6, prepTime: 5,
    items: [
      { name: 'יוגורט יווני', quantity: 170, unit: 'ג', calories: 100, protein: 17, carbs: 6, fat: 0 },
      { name: 'שקדים', quantity: 25, unit: 'ג', calories: 145, protein: 5, carbs: 5, fat: 13 },
    ],
  },
  {
    id: '5', name: 'ארוחת ערב', mealType: 'dinner', status: 'planned',
    calories: 520, protein: 40, carbs: 45, fat: 18, prepTime: 25,
    items: [
      { name: 'סלמון אפוי', quantity: 150, unit: 'ג', calories: 250, protein: 35, carbs: 0, fat: 12 },
      { name: 'בטטה צלויה', quantity: 200, unit: 'ג', calories: 180, protein: 3, carbs: 41, fat: 0 },
      { name: 'סלט ירוק', quantity: 100, unit: 'ג', calories: 30, protein: 2, carbs: 5, fat: 0 },
      { name: 'טחינה', quantity: 20, unit: 'ג', calories: 120, protein: 3, carbs: 3, fat: 11 },
    ],
  },
]

const goals = { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 }

const statusConfig: Record<MealStatus, { label: string; color: string; icon: React.ReactNode }> = {
  planned: { label: 'מתוכנן', color: 'text-slate-500', icon: null },
  eaten_full: { label: 'נאכל במלואו', color: 'text-green-600', icon: <Check size={14} /> },
  eaten_partial: { label: 'נאכל חלקית', color: 'text-yellow-600', icon: <Check size={14} /> },
  skipped: { label: 'לא נאכל', color: 'text-red-500', icon: <X size={14} /> },
  replaced: { label: 'הוחלף', color: 'text-blue-500', icon: <RefreshCw size={14} /> },
}

function MealCard({ meal, onStatusChange }: { meal: DiaryMeal; onStatusChange: (id: string, status: MealStatus) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showReplace, setShowReplace] = useState(false)

  const bgClass = {
    planned: 'bg-white dark:bg-slate-800',
    eaten_full: 'bg-green-50 dark:bg-green-900/10',
    eaten_partial: 'bg-yellow-50 dark:bg-yellow-900/10',
    skipped: 'bg-red-50 dark:bg-red-900/10',
    replaced: 'bg-blue-50 dark:bg-blue-900/10',
  }[meal.status]

  const sc = statusConfig[meal.status]

  return (
    <div className={`rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden ${bgClass}`}>
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
              meal.status === 'eaten_full' ? 'bg-green-100 text-green-700' :
              meal.status === 'eaten_partial' ? 'bg-yellow-100 text-yellow-700' :
              meal.status === 'skipped' ? 'bg-red-100 text-red-700' :
              meal.status === 'replaced' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {sc.icon}{sc.label}
            </div>
          </div>
          <span className="text-xs text-slate-400">{MEAL_TYPE_LABELS[meal.mealType]}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-white">{meal.name}</h3>
          <div className="flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Flame size={14} className="text-orange-400" />
            {meal.calories} קק"ל
          </div>
        </div>
        <div className="mt-1 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>💪 {meal.protein}ג</span>
          <span>🌾 {meal.carbs}ג</span>
          <span>🧈 {meal.fat}ג</span>
          <span>⏱ {meal.prepTime} דק'</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4">
          {/* Items */}
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">מרכיבים</p>
            {meal.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{item.quantity}{item.unit}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.calories} קק"ל</span>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          {meal.instructions && (
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">הכנה</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{meal.instructions}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">סמן סטטוס</p>
            <div className="grid grid-cols-2 gap-2">
              {(['eaten_full', 'eaten_partial', 'skipped', 'replaced'] as MealStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(meal.id, s)}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors border-2 ${
                    meal.status === s ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' :
                    'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}>
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowReplace(true)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                <RefreshCw size={14} />
                החלפת ארוחה
              </button>
              <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                <Star size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Modal */}
      {showReplace && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">החלפת ארוחה</h3>
              <button onClick={() => setShowReplace(false)}><X size={20} className="text-slate-500" /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">חלופות דומות ל-{meal.name}:</p>
            {[
              { name: 'שניצל הודו עם תפוחי אדמה', calories: 560, protein: 46, diff: '+20 קק"ל' },
              { name: 'דג בקלה מאודה עם ירקות', calories: 480, protein: 44, diff: '-100 קק"ל' },
              { name: 'פסטה עוף ברוטב עגבניות', calories: 590, protein: 42, diff: '+10 קק"ל' },
            ].map((alt, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-xl p-3 mb-2 cursor-pointer hover:border-primary-400 transition-colors"
                onClick={() => { onStatusChange(meal.id, 'replaced'); setShowReplace(false) }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{alt.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${alt.diff.startsWith('-') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{alt.diff}</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span>🔥 {alt.calories} קק"ל</span>
                  <span>💪 {alt.protein}ג חלבון</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-400 text-center mt-2">לחץ על חלופה לאישור ההחלפה</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DiaryPage() {
  const { data: session, status } = useSession()
  const [date, setDate] = useState(new Date())
  const [meals, setMeals] = useState<DiaryMeal[]>(mockMeals)

  if (status === 'loading') return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
  if (!session) { redirect('/auth/login'); return null }

  const eaten = meals.filter(m => m.status === 'eaten_full' || m.status === 'eaten_partial')
  const eatenCals = eaten.reduce((s, m) => s + (m.status === 'eaten_partial' ? m.calories * 0.7 : m.calories), 0)
  const eatenProtein = eaten.reduce((s, m) => s + (m.status === 'eaten_partial' ? m.protein * 0.7 : m.protein), 0)
  const plannedCals = meals.reduce((s, m) => s + (m.status !== 'skipped' ? m.calories : 0), 0)

  const navigate = (d: number) => {
    const nd = new Date(date)
    nd.setDate(nd.getDate() + d)
    setDate(nd)
  }

  const handleStatusChange = (id: string, s: MealStatus) => {
    setMeals(ms => ms.map(m => m.id === id ? { ...m, status: s } : m))
  }

  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <div className="space-y-4">
      {/* Date Nav */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-800 dark:text-white">
            {isToday ? 'היום' : date.toLocaleDateString('he-IL', { weekday: 'long' })}
          </p>
          <p className="text-xs text-slate-500">{date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Daily summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">סיכום יומי</span>
          <span className={`text-sm font-bold ${Math.round(goals.dailyCalories - eatenCals) < 0 ? 'text-red-500' : 'text-green-600'}`}>
            נותר: {Math.round(goals.dailyCalories - eatenCals)} קק"ל
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'יעד', value: goals.dailyCalories, unit: 'קק"ל', color: 'text-slate-700 dark:text-slate-200' },
            { label: 'תוכנן', value: Math.round(plannedCals), unit: 'קק"ל', color: 'text-blue-600' },
            { label: 'נאכל', value: Math.round(eatenCals), unit: 'קק"ל', color: 'text-green-600' },
            { label: 'נותר', value: Math.max(0, Math.round(goals.dailyCalories - eatenCals)), unit: 'קק"ל', color: 'text-orange-500' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400">{unit}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <MacroBar label="חלבון" value={eatenProtein} target={goals.dailyProtein} color="bg-blue-500" />
        </div>
      </div>

      {/* Meals */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">ארוחות</h2>
        <button className="flex items-center gap-1 text-sm text-primary-600 font-medium">
          <Plus size={16} />
          הוסף ארוחה
        </button>
      </div>

      <div className="space-y-3">
        {meals.map(meal => (
          <MealCard key={meal.id} meal={meal} onStatusChange={handleStatusChange} />
        ))}
      </div>

      {/* Medical warning */}
      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">המערכת אינה מחליפה ייעוץ של רופא או תזונאי מוסמך.</p>
      </div>
    </div>
  )
}
