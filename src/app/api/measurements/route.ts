import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 30,
  })

  return NextResponse.json(measurements)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const date = new Date(body.date)
  date.setHours(0, 0, 0, 0)

  const measurement = await prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    update: { ...body, userId: undefined, date: undefined },
    create: { ...body, userId: session.user.id, date },
  })

  return NextResponse.json(measurement)
}
