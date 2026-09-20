import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  try {
    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'לא התקבלה תמונה' }, { status: 400 })

    const prompt = `אתה תזונאי מומחה. נתח את הארוחה בתמונה והחזר תשובה בדיוק בפורמט JSON הבא (בלי markdown, רק JSON טהור):

{
  "mealName": "שם הארוחה בעברית",
  "description": "תיאור קצר של מה שנראה בתמונה",
  "confidence": "high/medium/low",
  "isEstimate": true,
  "items": [
    {
      "name": "שם המרכיב",
      "quantity": 100,
      "unit": "גרם",
      "calories": 150,
      "protein": 10,
      "carbs": 15,
      "fat": 5
    }
  ],
  "totals": {
    "calories": 450,
    "protein": 35,
    "carbs": 40,
    "fat": 15,
    "fiber": 5
  },
  "mealType": "breakfast/lunch/dinner/snack",
  "prepTime": 15,
  "healthNotes": "הערה קצרה על ערכי התזונה",
  "tips": "טיפ אחד לשיפור הארוחה תזונתית"
}

חשוב: כל הערכים הם הערכות. אם לא ניתן לזהות ארוחה, החזר שגיאה. הערך את הכמויות לפי גודל המנה הנראה בתמונה.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`, detail: 'high' } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 1000,
    })

    const raw = response.choices[0]?.message?.content || ''
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'לא ניתן לנתח את התמונה' }, { status: 422 })

    const analysis = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, analysis })
  } catch (err: unknown) {
    console.error('Vision error:', err)
    const msg = err instanceof Error ? err.message : 'שגיאה'
    if (msg.includes('API key')) return NextResponse.json({ error: 'מפתח OpenAI לא תקין' }, { status: 500 })
    return NextResponse.json({ error: 'שגיאה בניתוח התמונה' }, { status: 500 })
  }
}
