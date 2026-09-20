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

  if (foodId && !calories) {
    const food = await prisma.food.findUnique({ where: { id: foodId } })
    if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    const factor = (quantity || 100) / food.servingSize
    logCalories = food.calories * factor
    logProtein = food.protein * factor
    logCarbs = food.carbs * factor
    logFat = food.fat * factor
  }

  if (!foodId && foodName && calories) {
    let food = await prisma.food.findFirst({ where: { name: foodName, category: 'custom' } })
    if (!food) {
      food = await prisma.food.create({
        data: { name: foodName, category: 'custom', calories: logCalories || 0, protein: logProtein || 0, carbs: logCarbs || 0, fat: logFat || 0, servingSize: 1 },
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
      unit: unit || '\u05D2\u05E8\u05DD',
      calories: Math.round(logCalories || 0),
      protein: Math.round((logProtein || 0) * 10) / 10,
      carbs: Math.round((logCarbs || 0) * 10) / 10,
      fat: Math.round((logFat || 0) * 10) / 10,
      notes: notes || (isEstimate ? 'AI estimate' : null),
    },
  })

  return NextResponse.json(log)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const { foodName, quantity, unit, calories, protein, carbs, fat } = body

  // Update the food record name if it's custom
  const existingLog = await prisma.foodLog.findFirst({ where: { id, userId: session.user.id } })
  if (!existingLog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If foodName changed and we have a foodId, update the custom food record
  if (foodName && existingLog.foodId) {
    const food = await prisma.food.findUnique({ where: { id: existingLog.foodId } })
    if (food?.category === 'custom') {
      await prisma.food.update({ where: { id: existingLog.foodId }, data: { name: foodName } })
    }
  }

  const updated = await prisma.foodLog.update({
    where: { id },
    data: {
      quantity: quantity !== undefined ? Number(quantity) : existingLog.quantity,
      unit: unit || existingLog.unit,
      calories: calories !== undefined ? Math.round(Number(calories)) : existingLog.calories,
      protein: protein !== undefined ? Math.round(Number(protein) * 10) / 10 : existingLog.protein,
      carbs: carbs !== undefined ? Math.round(Number(carbs) * 10) / 10 : existingLog.carbs,
      fat: fat !== undefined ? Math.round(Number(fat) * 10) / 10 : existingLog.fat,
      notes: 'edited',
    },
  })

  return NextResponse.json(updated)
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