import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
  }

  const { message, context } = await req.json()

  const systemPrompt = `אתה תזונאי דיגיטלי ישראלי מקצועי. עונה בעברית בלבד.

נתוני המשתמש:
- יעד קלוריות יומי: ${context.dailyCalories} קק"ל
- יעד חלבון: ${context.dailyProtein}ג
- יעד פחמימות: ${context.dailyCarbs}ג  
- יעד שומן: ${context.dailyFat}ג
- קלוריות שנאכלו היום: ${context.eatenCalories} קק"ל
- נותרו: ${context.remainingCalories} קק"ל
- חלבון שנאכל: ${context.eatenProtein}ג
- מגבלות: ${context.allergies || 'ללא'}
- העדפות: ${context.preferences || 'ללא'}

כאשר מציע ארוחה, החזר JSON בפורמט הבא (בנוסף להסבר בעברית):
{
  "meal_suggestion": {
    "name": "שם הארוחה",
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "prepTime": 0,
    "ingredients": [{"name": "שם", "quantity": 0, "unit": "ג"}],
    "instructions": "הוראות הכנה",
    "reason": "הסבר מדוע הארוחה מתאימה"
  }
}

חשוב: 
- אל תציג הצעות כתחליף לייעוץ מקצועי
- סמן ערכים קלוריים משוערים כ"משוער"
- היה ספציפי עם כמויות בגרמים`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content || ''

    // Try to parse meal suggestion from response
    let mealSuggestion = null
    const jsonMatch = content.match(/\{[\s\S]*"meal_suggestion"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        mealSuggestion = parsed.meal_suggestion
      } catch {
        // No valid JSON
      }
    }

    // Clean text response (remove JSON block)
    const textResponse = content.replace(/```json[\s\S]*?```/g, '').replace(/\{[\s\S]*"meal_suggestion"[\s\S]*\}/g, '').trim()

    return NextResponse.json({
      message: textResponse || content,
      mealSuggestion,
    })
  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json({ error: 'שגיאה בחיבור ל-AI' }, { status: 500 })
  }
}
