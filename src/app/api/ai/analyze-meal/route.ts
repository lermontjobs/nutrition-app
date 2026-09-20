import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const contentType = req.headers.get('content-type') || ''
    let imageBase64 = ''
    let mimeType = 'image/jpeg'

    if (contentType.includes('multipart/form-data')) {
      // FormData with image file
      const formData = await req.formData()
      const file = formData.get('image') as File | null
      if (!file) return NextResponse.json({ error: '\u05DC\u05D0 \u05E0\u05E9\u05DC\u05D7\u05D4 \u05EA\u05DE\u05D5\u05E0\u05D4' }, { status: 400 })
      mimeType = file.type || 'image/jpeg'
      const buffer = await file.arrayBuffer()
      imageBase64 = Buffer.from(buffer).toString('base64')
    } else {
      // JSON with base64
      const body = await req.json()
      imageBase64 = body.imageBase64
      mimeType = body.mimeType || 'image/jpeg'
      if (!imageBase64) return NextResponse.json({ error: '\u05DC\u05D0 \u05E0\u05E9\u05DC\u05D7\u05D4 \u05EA\u05DE\u05D5\u05E0\u05D4' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' }
            },
            {
              type: 'text',
              text: `You are a nutrition expert. Analyze this meal image and return ONLY valid JSON (no markdown):
{
  "mealName": "meal name in Hebrew",
  "confidence": "high/medium/low",
  "items": [
    { "name": "item name in Hebrew", "quantity": 100, "unit": "gram", "calories": 150, "protein": 10, "carbs": 15, "fat": 5 }
  ],
  "totals": { "calories": 450, "protein": 35, "carbs": 40, "fat": 15 },
  "healthNotes": "brief note in Hebrew"
}
Estimate portions based on visible plate size. All values are estimates.`
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const raw = response.choices[0]?.message?.content || ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '\u05DC\u05D0 \u05E0\u05D9\u05EA\u05DF \u05DC\u05E0\u05EA\u05D7 \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 - \u05D5\u05D3\u05D0\u05D9 \u05E9\u05D6\u05D5 \u05EA\u05DE\u05D5\u05E0\u05EA \u05D0\u05E8\u05D5\u05D7\u05D4' }, { status: 422 })

    const analysis = JSON.parse(jsonMatch[0])
    // Return in format diary page expects
    return NextResponse.json({
      items: analysis.items || [],
      totals: analysis.totals || {},
      healthNotes: analysis.healthNotes || '',
      mealName: analysis.mealName || '',
      confidence: analysis.confidence || 'medium',
    })
  } catch (err: unknown) {
    console.error('Vision error:', err)
    const msg = err instanceof Error ? err.message : 'error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
