import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/diary?date=2024-01-15
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  // Get daily plan
  const plan = await prisma.dailyPlan.findFirst({
    where: { userId: session.user.id, date },
    include: { meals: { include: { meal: { include: { items: { include: { food: true } } } } }, orderBy: { order: 'asc' } } },
  })

  // Get food logs for actual eaten
  const logs = await prisma.foodLog.findMany({
    where: { userId: session.user.id, date: { gte: date, lt: nextDay } },
    include: { food: true },
    orderBy: { createdAt: 'asc' },
  })

  // Get user goals
  const goals = await prisma.userGoals.findUnique({ where: { userId: session.user.id } })

  // Calculate totals
  const plannedTotals = plan?.meals.reduce((acc, pm) => {
    if (pm.status === 'skipped') return acc
    const factor = pm.portionPct / 100
    return {
      calories: acc.calories + pm.meal.totalCalories * factor,
      protein: acc.protein + pm.meal.totalProtein * factor,
      carbs: acc.carbs + pm.meal.totalCarbs * factor,
      fat: acc.fat + pm.meal.totalFat * factor,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const eatenTotals = logs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    carbs: acc.carbs + log.carbs,
    fat: acc.fat + log.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return NextResponse.json({ plan, logs, goals, plannedTotals, eatenTotals })
}

// POST /api/diary - create or update daily plan meal
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date: dateStr, mealType, mealId, status, portionPct } = body

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  // Upsert daily plan
  let plan = await prisma.dailyPlan.findFirst({
    where: { userId: session.user.id, date },
  })
  if (!plan) {
    plan = await prisma.dailyPlan.create({ data: { userId: session.user.id, date } })
  }

  if (status !== undefined && mealId) {
    // Update meal status
    await prisma.dailyPlanMeal.updateMany({
      where: { dailyPlanId: plan.id, mealId, mealType },
      data: { status, portionPct: portionPct || 100 },
    })
  } else if (mealId) {
    // Add meal to plan
    const existing = await prisma.dailyPlanMeal.findFirst({
      where: { dailyPlanId: plan.id, mealType },
    })
    if (!existing) {
      await prisma.dailyPlanMeal.create({
        data: { dailyPlanId: plan.id, mealId, mealType, order: 0 },
      })
    }
  }

  return NextResponse.json({ success: true })
}
