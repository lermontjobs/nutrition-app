// Calculate BMR using Mifflin-St Jeor equation
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number,
  gender: string
): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  return bmr * (activityMultipliers[activityLevel] || 1.55)
}

export function calculateGoalCalories(
  tdee: number,
  goalType: string
): number {
  switch (goalType) {
    case 'lose': return Math.round(tdee - 500)
    case 'gain': return Math.round(tdee + 300)
    case 'muscle': return Math.round(tdee + 200)
    default: return Math.round(tdee)
  }
}

export function calculateMacros(calories: number, goalType: string) {
  let proteinPct = 0.3
  let fatPct = 0.25
  if (goalType === 'muscle') {
    proteinPct = 0.35
    fatPct = 0.25
  } else if (goalType === 'lose') {
    proteinPct = 0.35
    fatPct = 0.3
  }
  const carbsPct = 1 - proteinPct - fatPct

  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  }
}

export function getAge(dateOfBirth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const m = today.getMonth() - dateOfBirth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--
  return age
}
