export interface MacroSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealSuggestion {
  name: string
  mealType: string
  ingredients: { name: string; quantity: number; unit: string }[]
  calories: number
  protein: number
  carbs: number
  fat: number
  instructions: string
  prepTime: number
  reason: string
  alternatives?: string[]
}

export interface DailyTotals {
  plannedCalories: number
  eatenCalories: number
  remainingCalories: number
  plannedProtein: number
  eatenProtein: number
  plannedCarbs: number
  eatenCarbs: number
  plannedFat: number
  eatenFat: number
}

export type GoalType = 'lose' | 'maintain' | 'gain' | 'muscle' | 'composition'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'pre_workout' | 'post_workout' | 'custom'
export type MealStatus = 'planned' | 'eaten_full' | 'eaten_partial' | 'skipped' | 'replaced'

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  morning_snack: 'ארוחת ביניים בוקר',
  lunch: 'ארוחת צהריים',
  afternoon_snack: 'ארוחת ביניים צהריים',
  dinner: 'ארוחת ערב',
  pre_workout: 'לפני אימון',
  post_workout: 'אחרי אימון',
  custom: 'ארוחה מותאמת',
}

export const GOAL_TYPE_LABELS: Record<string, string> = {
  lose: 'ירידה במשקל',
  maintain: 'שמירה על משקל',
  gain: 'עלייה במשקל',
  muscle: 'עלייה במסת שריר',
  composition: 'שיפור הרכב גוף',
}

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'יושבני (ללא פעילות)',
  light: 'קל (1-3 אימונים בשבוע)',
  moderate: 'מתון (3-5 אימונים בשבוע)',
  active: 'פעיל (6-7 אימונים בשבוע)',
  very_active: 'פעיל מאוד (אימונים מרובים)',
}
