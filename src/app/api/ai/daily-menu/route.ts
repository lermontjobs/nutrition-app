import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userId = session.user.id

    // Fetch user profile, goals, and preferences
    const [user, goals, prefs] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, gender: true, height: true, dateOfBirth: true } }),
      prisma.userGoals.findFirst({ where: { userId } }),
      prisma.dietaryPreferences.findFirst({ where: { userId } }),
    ])

    if (!goals) return NextResponse.json({ error: 'no_goals' }, { status: 200 })

    // Build context
    const age = user?.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : null
    const restrictions = []
    if (prefs?.isKosher) restrictions.push('כשר')
    if (prefs?.isVegetarian) restrictions.push('צמחוני')
    if (prefs?.isVegan) restrictions.push('טבעוני')
    if (prefs?.allergies) restrictions.push(`ללא: ${prefs.allergies}`)

    const prompt = `אתה תזונאית מוסמכת. צרי תפריט יומי מלא ומאוזן בעברית בהתאם לפרמטרים הבאים:

פרמטרי המשתמשת:
- יעד קלוריות: ${goals.dailyCalories} קק"ל
- חלבון יומי: ${goals.dailyProtein}ג
- פחמימות: ${goals.dailyCarbs}ג  
- שומן: ${goals.dailyFat}ג
- מטרה: ${goals.goalType === 'lose_weight' ? 'ירידה במשקל' : goals.goalType === 'gain_muscle' ? 'בניית שריר' : 'שמירה על משקל'}
${age ? `- גיל: ${age}` : ''}
${restrictions.length > 0 ? `- הגבלות: ${restrictions.join(', ')}` : ''}
${prefs?.dislikes ? `- לא אוהבת: ${prefs.dislikes}` : ''}
${prefs?.favorites ? `- מועדפים: ${prefs.favorites}` : ''}

החזירי JSON בלבד (ללא markdown):
{
  "meals": [
    {
      "mealType": "breakfast",
      "name": "שם הארוחה",
      "emoji": "🥗",
      "items": ["פריט 1 עם כמות", "פריט 2 עם כמות"],
      "calories": 400,
      "protein": 30,
      "carbs": 40,
      "fat": 12,
      "prepTime": 10,
      "tip": "טיפ קצר להכנה"
    }
  ],
  "dailyTotals": { "calories": 2000, "protein": 150, "carbs": 200, "fat": 65 },
  "nutritionNote": "הערה תזונתית קצרה לגבי התפריט"
}

כללי ה-meals array: breakfast, morning_snack, lunch, afternoon_snack, dinner (5 ארוחות).
הכמויות חייבות להתאים בדיוק ליעדי הקלוריות.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('daily-menu error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
