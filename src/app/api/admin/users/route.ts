import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  if (!session.user.isAdmin) return null
  return session
}

// GET all users
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, isAdmin: true, createdAt: true,
      goals: { select: { currentWeight: true, targetWeight: true, goalType: true, dailyCalories: true } },
      _count: { select: { foodLogs: true, bodyMeasurements: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

// POST create new user
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const { name, email, password, isAdmin } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'שם, אימייל וסיסמה הם שדות חובה' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'אימייל כבר קיים במערכת' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name, email, password: hashed,
      isAdmin: Boolean(isAdmin),
      goals: {
        create: {
          goalType: 'maintain', dailyCalories: 2000, dailyProtein: 150,
          dailyCarbs: 200, dailyFat: 65, dailyWater: 2.5, mealsPerDay: 4,
        },
      },
      dietaryPreferences: { create: {} },
    },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
