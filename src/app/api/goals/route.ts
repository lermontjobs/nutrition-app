import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [goals, prefs, user] = await Promise.all([
    prisma.userGoals.findUnique({ where: { userId: session.user.id } }),
    prisma.dietaryPreferences.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, gender: true, height: true, dateOfBirth: true } }),
  ])

  return NextResponse.json({ goals, prefs, user })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { goals, prefs } = body

  const results: Record<string, unknown> = {}

  if (goals) {
    results.goals = await prisma.userGoals.update({
      where: { userId: session.user.id },
      data: goals,
    })
  }
  if (prefs) {
    results.prefs = await prisma.dietaryPreferences.update({
      where: { userId: session.user.id },
      data: prefs,
    })
  }

  return NextResponse.json(results)
}
