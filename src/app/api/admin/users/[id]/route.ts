import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) return null
  return session
}

// PATCH update user
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const { name, email, password, isAdmin } = await req.json()
  const data: Record<string, unknown> = {}

  if (name) data.name = name
  if (email) data.email = email
  if (typeof isAdmin === 'boolean') data.isAdmin = isAdmin
  if (password) data.password = await bcrypt.hash(password, 10)

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, isAdmin: true },
  })

  return NextResponse.json(user)
}

// DELETE user
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  // Prevent deleting yourself
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'אי אפשר למחוק את עצמך' }, { status: 400 })
  }

  // Delete all related data first (cascade)
  await prisma.$transaction([
    prisma.foodLog.deleteMany({ where: { userId: params.id } }),
    prisma.waterLog.deleteMany({ where: { userId: params.id } }),
    prisma.bodyMeasurement.deleteMany({ where: { userId: params.id } }),
    prisma.aIConversation.deleteMany({ where: { userId: params.id } }),
    prisma.weeklyPlan.deleteMany({ where: { userId: params.id } }),
    prisma.dailyPlan.deleteMany({ where: { userId: params.id } }),
    prisma.dietaryPreferences.deleteMany({ where: { userId: params.id } }),
    prisma.userGoals.deleteMany({ where: { userId: params.id } }),
    prisma.user.delete({ where: { id: params.id } }),
  ])

  return NextResponse.json({ success: true })
}

// GET single user stats
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      goals: true,
      dietaryPreferences: true,
      _count: { select: { foodLogs: true, bodyMeasurements: true, weeklyPlans: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })

  // Last activity
  const lastLog = await prisma.foodLog.findFirst({
    where: { userId: params.id },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ ...user, lastActivity: lastLog?.date || null })
}
