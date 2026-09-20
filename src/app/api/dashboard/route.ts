import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [goals, todayLogs, waterLogs, measurements] = await Promise.all([
    prisma.userGoals.findUnique({ where: { userId } }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: today, lt: tomorrow } }, include: { food: true } }),
    prisma.waterLog.findMany({ where: { userId, date: { gte: today, lt: tomorrow } } }),
    prisma.bodyMeasurement.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
  ])

  const eatenTotals = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    carbs: acc.carbs + log.carbs,
    fat: acc.fat + log.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const waterToday = waterLogs.reduce((s, w) => s + w.amount, 0)

  // Calculate streak
  let streak = 0
  const checkDate = new Date(today)
  for (let i = 0; i < 30; i++) {
    const d = new Date(checkDate)
    d.setDate(d.getDate() - i)
    const nd = new Date(d)
    nd.setDate(nd.getDate() + 1)
    const count = await prisma.foodLog.count({ where: { userId, date: { gte: d, lt: nd } } })
    if (count > 0) streak++
    else if (i > 0) break
  }

  // Weight history for graph
  const weightHistory = measurements
    .filter(m => m.weight)
    .map(m => ({
      date: m.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
      weight: m.weight,
    }))
    .reverse()

  return NextResponse.json({
    goals,
    eatenTotals,
    waterToday,
    streak,
    weightHistory,
    latestWeight: measurements[0]?.weight || goals?.currentWeight || null,
  })
}
