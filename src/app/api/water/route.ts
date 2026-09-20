import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount } = await req.json()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const log = await prisma.waterLog.create({
    data: { userId: session.user.id, date: today, amount: Number(amount) },
  })
  return NextResponse.json(log)
}
