import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MEAL_NAMES: Record<string, string> = {
  breakfast: 'ארוחת בוקר',
  morning_snack: 'נשנוש בוקר',
  lunch: 'ארוחת צהריים',
  afternoon_snack: 'נשנוש אחה"צ',
  dinner: 'ארוחת ערב',
}

const CALORIE_SPLIT: Record<string, number> = {
  breakfast: 0.25,
  morning_snack: 0.1,
  lunch: 0.35,
  afternoon_snack: 0.1,
  dinner: 0.2,
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mealType, swapItem, currentMeal } = await req.json()
  if (!mealType) return NextResponse.json({ error: 'Missing mealType' }, { status: 400 })

  const userId = session.user.id
  const [goals, prefs] = await Promise.all([
    prisma.userGoals.findFirst({ where: { userId } }),
    prisma.dietaryPreferences.findFirst({ where: { userId } }),
  ])

  const targetCals = Math.round((goals?.dailyCalories || 2000) * (CALORIE_SPLIT[mealType] || 0.2))
  const targetProtein = Math.round((goals?.dailyProtein || 150) * (CALORIE_SPLIT[mealType] || 0.2))
  const restrictions = []
  if (prefs?.isKosher) restrictions.push('כשר')
  if (prefs?.isVegetarian) restrictions.push('צמחוני')
  if (prefs?.isVegan) restrictions.push('טבעוני')
  if (prefs?.allergies) restrictions.push(`ללא אלרגנים: ${prefs.allergies}`)
  if (prefs?.dislikes) restrictions.push(`לא אוהבת: ${prefs.dislikes}`)

  const swapContext = swapItem && currentMeal
    ? `\n\nהמשתמשת רוצה להחליף את הרכיב "${swapItem}" מהמנה "${currentMeal}". הצגי 3 חלופות לרכיב זה בלבד (לא את כל הארוחה), עם ערכים תזונתיים מחושבים.`
    : ''

  const isSwap = !!(swapItem && currentMeal)

  const prompt = isSwap
    ? `אתה תזונאית. המשתמשת אוכלת "${currentMeal}" ורוצה להחליף את "${swapItem}".
${restrictions.length ? `הגבלות: ${restrictions.join(', ')}` : ''}

החזירי JSON בלבד:
{
  "suggestions": [
    { "name": "שם הרכיב החלופי", "quantity": 100, "unit": "גרם", "calories": 120, "protein": 10, "carbs": 15, "fat": 5, "reason": "למה זה טוב" }
  ]
}`
    : `אתה תזונאית. הצגי 5 אפשרויות שונות ל${MEAL_NAMES[mealType] || mealType}.

יעדי הארוחה:
- קלוריות: כ-${targetCals} קק"ל
- חלבון: כ-${targetProtein}ג
${restrictions.length ? `הגבלות: ${restrictions.join(', ')}` : ''}

החזירי JSON בלבד:
{
  "mealType": "${mealType}",
  "mealName": "${MEAL_NAMES[mealType] || mealType}",
  "targetCalories": ${targetCals},
  "suggestions": [
    {
      "id": 1,
      "name": "שם הארוחה",
      "emoji": "🥗",
      "items": [
        { "name": "שם פריט", "quantity": 100, "unit": "גרם", "calories": 150, "protein": 12, "carbs": 20, "fat": 5 }
      ],
      "totals": { "calories": 380, "protein": 30, "carbs": 40, "fat": 12 },
      "prepTime": 10,
      "tags": ["קל להכנה", "עשיר בחלבון"],
      "tip": "טיפ להכנה"
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })
    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json({ ...result, isSwap })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
