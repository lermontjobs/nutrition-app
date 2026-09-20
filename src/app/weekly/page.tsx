'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { ChevronRight, ChevronLeft, Plus, Copy, ShoppingCart, Printer, X, RefreshCw, Flame } from 'lucide-react'
import { MEAL_TYPE_LABELS } from '@/types'

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'morning_snack', 'afternoon_snack']
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  lunch: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  dinner: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  morning_snack: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  afternoon_snack: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
}

interface PlannedMeal {
  name: string
  calories: number
  protein: number
}

type WeekPlan = Record<number, Record<string, PlannedMeal | null>>

const mockPlan: WeekPlan = {
  0: { breakfast: { name: 'חביתה וירקות', calories: 320, protein: 22 }, lunch: { name: 'חזה עוף ואורז', calories: 520, protein: 48 }, dinner: { name: 'סלמון ובטטה', calories: 480, protein: 38 }, morning_snack: null, afternoon_snack: { name: 'יוגורט יווני', calories: 120, protein: 15 } },
  1: { breakfast: { name: 'שיבולת שועל עם פירות', calories: 380, protein: 14 }, lunch: { name: 'שניצל הודו ופסטה', calories: 560, protein: 42 }, dinner: { name: 'קציצות דגים', calories: 400, protein: 35 }, morning_snack: { name: 'פרי וגבינה', calories: 150, protein: 8 }, afternoon_snack: null },
  2: { breakfast: null, lunch: { name: 'פלאפל ופיתה', calories: 480, protein: 18 }, dinner: { name: 'סטייק וירקות', calories: 550, protein: 52 }, morning_snack: null, afternoon_snack: null },
  3: { breakfast: { name: 'טוסט עם אבוקדו', calories: 300, protein: 10 }, lunch: { name: 'עוף בתנור', calories: 500, protein: 45 }, dinner: null, morning_snack: null, afternoon_snack: { name: 'שקדים ותמרים', calories: 180, protein: 6 } },
  4: { breakfast: { name: 'חביתה וירקות', calories: 320, protein: 22 }, lunch: { name: 'חמוס ופיתה מלאה', calories: 420, protein: 16 }, dinner: { name: 'פסטה טונה', calories: 480, protein: 36 }, morning_snack: { name: 'קוטג\' ופרי', calories: 160, protein: 14 }, afternoon_snack: null },
  5: { breakfast: { name: 'לחם מלא עם ביצים', calories: 350, protein: 20 }, lunch: null, dinner: { name: 'ארוחת שישי בשרית', calories: 650, protein: 55 }, morning_snack: null, afternoon_snack: null },
  6: { breakfast: { name: 'ביצים ושקשוקה', calories: 420, protein: 28 }, lunch: { name: 'עוף ממולא', calories: 580, protein: 50 }, dinner: { name: 'גריל ירקות ודגים', calories: 420, protein: 38 }, morning_snack: null, afternoon_snack: null },
}

const shoppingList = [
  { category: 'בשר ודגים', items: [{ name: 'חזה עוף', qty: '1.5 ק"ג' }, { name: 'סלמון', qty: '600 ג' }, { name: 'שניצל הודו', qty: '500 ג' }] },
  { category: 'ירקות', items: [{ name: 'ברוקולי', qty: '500 ג' }, { name: 'עגבניות', qty: '1 ק"ג' }, { name: 'בטטה', qty: '4 יחידות' }, { name: 'מלפפון', qty: '500 ג' }] },
  { category: 'פחמימות', items: [{ name: 'אורז', qty: '500 ג' }, { name: 'לחם מחיטה מלאה', qty: '2 כיכרות' }, { name: 'פסטה', qty: '500 ג' }] },
  { category: 'חלב וביצים', items: [{ name: 'ביצים', qty: '2 מגשים' }, { name: 'יוגורט יווני', qty: '6 גביעים' }, { name: 'קוטג\'', qty: '4 גביעים' }, { name: 'גבינה לבנה', qty: '2 יחידות' }] },
  { category: 'שונות', items: [{ name: 'שמן זית', qty: '1 בקבוק' }, { name: 'שקדים', qty: '200 ג' }, { name: 'טחינה', qty: '1 צנצנת' }] },
]

export default function WeeklyPage() {
  const { data: session, status } = useSession()
  const [weekOffset, setWeekOffset] = useState(0)
  const [plan, setPlan] = useState<WeekPlan>(mockPlan)
  const [showShopping, setShowShopping] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ day: number; mealType: string } | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  if (status === 'loading') return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
  if (!session) { redirect('/auth/login'); return null }

  const getWeekDates = () => {
    const today = new Date()
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7)
    return DAYS.map((_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return d
    })
  }

  const weekDates = getWeekDates()
  const isCurrentWeek = weekOffset === 0

  const copyDay = (fromDay: number, toDay: number) => {
    setPlan(p => ({ ...p, [toDay]: { ...p[fromDay] } }))
  }

  const removeMeal = (day: number, mealType: string) => {
    setPlan(p => ({ ...p, [day]: { ...p[day], [mealType]: null } }))
  }

  const addQuickMeal = (day: number, mealType: string) => {
    const meals: Record<string, PlannedMeal> = {
      breakfast: { name: 'חביתה וירקות', calories: 320, protein: 22 },
      lunch: { name: 'חזה עוף ואורז', calories: 520, protein: 48 },
      dinner: { name: 'סלמון ובטטה', calories: 480, protein: 38 },
      morning_snack: { name: 'יוגורט וגרנולה', calories: 200, protein: 12 },
      afternoon_snack: { name: 'שקדים ותמרים', calories: 180, protein: 6 },
    }
    setPlan(p => ({ ...p, [day]: { ...p[day], [mealType]: meals[mealType] || { name: 'ארוחה מותאמת', calories: 400, protein: 30 } } }))
    setSelectedCell(null)
  }

  const getDayTotal = (day: number) => {
    return Object.values(plan[day] || {}).reduce((s, m) => ({
      calories: s.calories + (m?.calories || 0),
      protein: s.protein + (m?.protein || 0),
    }), { calories: 0, protein: 0 })
  }

  const toggleShoppingItem = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">תפריט שבועי</h1>
        <button
          onClick={() => setShowShopping(true)}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <ShoppingCart size={16} />
          רשימת קניות
        </button>
      </div>

      {/* Week Nav */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-800 dark:text-white text-sm">
            {isCurrentWeek ? 'השבוע הנוכחי' : weekOffset < 0 ? `לפני ${Math.abs(weekOffset)} שבועות` : `בעוד ${weekOffset} שבועות`}
          </p>
          <p className="text-xs text-slate-500">
            {weekDates[0].toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} –{' '}
            {weekDates[6].toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Weekly Grid - scrollable horizontally */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3" style={{ minWidth: `${DAYS.length * 160}px` }}>
          {DAYS.map((day, dayIdx) => {
            const date = weekDates[dayIdx]
            const isToday = date.toDateString() === new Date().toDateString()
            const totals = getDayTotal(dayIdx)

            return (
              <div key={dayIdx} className={`flex-1 min-w-[150px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border-2 ${isToday ? 'border-primary-400' : 'border-transparent'}`}>
                {/* Day Header */}
                <div className={`p-2 text-center ${isToday ? 'bg-primary-500 text-white' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                  <p className="font-bold text-sm">{day}</p>
                  <p className="text-xs opacity-70">{date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</p>
                  {totals.calories > 0 && (
                    <p className="text-xs font-medium mt-0.5">{totals.calories} קק"ל</p>
                  )}
                </div>

                {/* Meals */}
                <div className="p-2 space-y-2">
                  {MEAL_TYPES.map(mealType => {
                    const meal = plan[dayIdx]?.[mealType]
                    return (
                      <div key={mealType}>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{MEAL_TYPE_LABELS[mealType]}</p>
                        {meal ? (
                          <div className={`relative rounded-xl p-2 border ${MEAL_COLORS[mealType]} cursor-pointer group`}
                            onClick={() => setSelectedCell({ day: dayIdx, mealType })}>
                            <button
                              onClick={e => { e.stopPropagation(); removeMeal(dayIdx, mealType) }}
                              className="absolute top-1 left-1 w-4 h-4 bg-white dark:bg-slate-700 rounded-full items-center justify-center hidden group-hover:flex shadow-sm"
                            >
                              <X size={10} className="text-slate-500" />
                            </button>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{meal.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Flame size={10} className="text-orange-400" />
                              <span className="text-xs text-slate-500">{meal.calories}</span>
                              <span className="text-xs text-slate-400">|</span>
                              <span className="text-xs text-slate-500">💪{meal.protein}ג</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedCell({ day: dayIdx, mealType })}
                            className="w-full rounded-xl p-2 border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                          >
                            <Plus size={14} className="text-slate-400" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Copy day button */}
                  <button
                    onClick={() => {
                      const nextDay = (dayIdx + 1) % 7
                      copyDay(dayIdx, nextDay)
                    }}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    <Copy size={11} />
                    העתק ליום הבא
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Meal Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelectedCell(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {DAYS[selectedCell.day]} – {MEAL_TYPE_LABELS[selectedCell.mealType]}
              </h3>
              <button onClick={() => setSelectedCell(null)}><X size={20} className="text-slate-500" /></button>
            </div>

            {plan[selectedCell.day]?.[selectedCell.mealType] && (
              <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{plan[selectedCell.day][selectedCell.mealType]?.name}</p>
                <div className="flex gap-2 mt-1 text-xs text-slate-500">
                  <span>🔥 {plan[selectedCell.day][selectedCell.mealType]?.calories} קק"ל</span>
                  <span>💪 {plan[selectedCell.day][selectedCell.mealType]?.protein}ג</span>
                </div>
              </div>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">בחר ארוחה מהירה:</p>
            <div className="space-y-2">
              {[
                { name: 'חביתה וירקות', calories: 320, protein: 22 },
                { name: 'חזה עוף ואורז', calories: 520, protein: 48 },
                { name: 'סלמון ובטטה', calories: 480, protein: 38 },
                { name: 'שיבולת שועל עם פירות', calories: 350, protein: 12 },
                { name: 'יוגורט יווני עם גרנולה', calories: 280, protein: 18 },
              ].map((meal, i) => (
                <button key={i}
                  onClick={() => { setPlan(p => ({ ...p, [selectedCell.day]: { ...p[selectedCell.day], [selectedCell.mealType]: { name: meal.name, calories: meal.calories, protein: meal.protein } } })); setSelectedCell(null) }}
                  className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                  <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{meal.name}</span>
                  <div className="text-xs text-slate-500 flex gap-2">
                    <span>🔥 {meal.calories}</span>
                    <span>💪 {meal.protein}ג</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold" onClick={() => addQuickMeal(selectedCell.day, selectedCell.mealType)}>
                <RefreshCw size={14} />
                הצע ארוחה לפי יעדים
              </button>
              {plan[selectedCell.day]?.[selectedCell.mealType] && (
                <button onClick={() => { removeMeal(selectedCell.day, selectedCell.mealType); setSelectedCell(null) }}
                  className="px-4 py-3 border border-red-200 text-red-500 rounded-xl text-sm">
                  הסר
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShopping && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">רשימת קניות</h3>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <Printer size={16} />
                </button>
                <button onClick={() => setShowShopping(false)}>
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">לפי תפריט השבוע – מחולק לפי מחלקות</p>

            {shoppingList.map((cat, ci) => (
              <div key={ci} className="mb-4">
                <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                  {cat.category}
                </p>
                <div className="space-y-1">
                  {cat.items.map((item, ii) => {
                    const key = `${ci}-${ii}`
                    const checked = checkedItems.has(key)
                    return (
                      <button
                        key={ii}
                        onClick={() => toggleShoppingItem(key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${checked ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checked ? 'border-green-500 bg-green-500' : 'border-slate-300 dark:border-slate-500'}`}>
                            {checked && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-sm ${checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{item.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">{item.qty}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="mt-2 text-xs text-slate-400 text-center">
              {checkedItems.size} מתוך {shoppingList.reduce((s, c) => s + c.items.length, 0)} פריטים נאספו
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
