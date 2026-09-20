import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { foodId, foodName, date: dateStr, mealType, quantity, unit, notes, calories, protein, carbs, fat, isEstimate } = body

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = dateStr ? (() => { const d = new Date(dateStr); d.setHours(0,0,0,0); return d })() : today

  let logCalories = calories, logProtein = protein, logCarbs = carbs, logFat = fat, resolvedFoodId = foodId

  // If foodId provided, calculate from DB
  if (foodId && !calories) {
    const food = await prisma.food.findUnique({ where: { id: foodId } })
    if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    const factor = (quantity || 100) / food.servingSize
    logCalories = food.calories * factor
    logProtein = food.protein * factor
    logCarbs = food.carbs * factor
    logFat = food.fat * factor
  }

  // If free-text food (from camera analysis) - create or find food record
  if (!foodId && foodName && calories) {
    // Try to find existing free-text food, or create one
    let food = await prisma.food.findFirst({ where: { name: foodName, category: 'custom' } })
    if (!food) {
      food = await prisma.food.create({
        data: {
          name: foodName, category: 'custom',
          calories: logCalories || 0, protein: logProtein || 0,
          carbs: logCarbs || 0, fat: logFat || 0,
          servingSize: 1,
        },
      })
    }
    resolvedFoodId = food.id
  }

  const log = await prisma.foodLog.create({
    data: {
      userId: session.user.id,
      foodId: resolvedFoodId,
      date,
      mealType: mealType || 'snack',
      quantity: quantity || 1,
      unit: unit || 'מנה',
      calories: Math.round(logCalories || 0),
      protein: Math.round((logProtein || 0) * 10) / 10,
      carbs: Math.round((logCarbs || 0) * 10) / 10,
      fat: Math.round((logFat || 0) * 10) / 10,
      notes: notes || (isEstimate ? '* הערכת AI מתמונה' : null),
    },
  })

  return NextResponse.json(log)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.foodLog.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
