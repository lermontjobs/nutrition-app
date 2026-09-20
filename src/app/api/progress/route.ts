import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [measurements, foodLogs, goals] = await Promise.all([
    prisma.bodyMeasurement.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.foodLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
    }),
    prisma.userGoals.findUnique({ where: { userId } }),
  ])

  // Weekly averages
  const dailyCalories: Record<string, number[]> = {}
  foodLogs.forEach(log => {
    const d = log.date.toISOString().split('T')[0]
    if (!dailyCalories[d]) dailyCalories[d] = []
    dailyCalories[d].push(log.calories)
  })

  const days = Object.keys(dailyCalories)
  const avgCalories = days.length > 0
    ? Math.round(days.reduce((s, d) => s + dailyCalories[d].reduce((a, b) => a + b, 0), 0) / days.length)
    : 0

  const avgProtein = days.length > 0
    ? Math.round(foodLogs.reduce((s, l) => s + l.protein, 0) / Math.max(days.length, 1))
    : 0

  // Weight graph data
  const weightHistory = measurements
    .filter(m => m.weight)
    .map(m => ({
      date: m.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      weight: m.weight,
    }))

  // Calorie graph (last 7 days)
  const calorieHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('he-IL', { weekday: 'short' })
    const cals = (dailyCalories[key] || []).reduce((a, b) => a + b, 0)
    return { date: dayLabel, calories: Math.round(cals), target: goals?.dailyCalories || 2000 }
  })

  const latestMeasurement = measurements[measurements.length - 1]
  const prevMeasurement = measurements[measurements.length - 2]
  const weightChange = latestMeasurement?.weight && prevMeasurement?.weight
    ? latestMeasurement.weight - prevMeasurement.weight
    : 0

  // Days to goal
  const currentWeight = latestMeasurement?.weight || goals?.currentWeight || 0
  const targetWeight = goals?.targetWeight || 0
  const weeklyLoss = weightChange < 0 ? Math.abs(weightChange) * (7 / Math.max(measurements.length, 1)) : 0.3
  const daysToGoal = weeklyLoss > 0 ? Math.round(((currentWeight - targetWeight) / weeklyLoss) * 7) : null

  return NextResponse.json({
    weightHistory,
    calorieHistory,
    measurements,
    goals,
    weeklyStats: {
      avgCalories,
      avgProtein,
      weightChange: Math.round(weightChange * 10) / 10,
      adherence: goals?.dailyCalories ? Math.round((avgCalories / goals.dailyCalories) * 100) : 0,
      workouts: measurements.reduce((s, m) => s + (m.workouts || 0), 0),
      avgSteps: Math.round(measurements.reduce((s, m) => s + (m.steps || 0), 0) / Math.max(measurements.length, 1)),
      daysToGoal,
    },
    currentWeight,
    targetWeight,
  })
}
