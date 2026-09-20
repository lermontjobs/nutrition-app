import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition analysis expert. The user will describe food they ate in Hebrew or English.
Analyze the food and return a JSON object with:
- items: array of food items, each with: name (Hebrew), quantity (number), unit (string, default "גרם"), calories, protein, carbs, fat (all numbers)
- totals: { calories, protein, carbs, fat }
- healthNotes: short helpful note in Hebrew (1 sentence max)

Be realistic with portion sizes. If quantity is unclear, use typical serving size.
Return ONLY valid JSON, no markdown.`
        },
        { role: 'user', content: `Analyze this food: ${text}` }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('analyze-text error:', e)
    return NextResponse.json({ error: e.message || 'AI error' }, { status: 500 })
  }
}
