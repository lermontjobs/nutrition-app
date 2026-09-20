import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  const foods = await prisma.food.findMany({
    where: {
      OR: [
        { userId: null }, // global foods
        { userId: session.user.id }, // user's custom foods
      ],
      AND: q ? {
        OR: [
          { name: { contains: q } },
          { nameEn: { contains: q } },
        ],
      } : {},
    },
    orderBy: { name: 'asc' },
    take: 50,
  })

  return NextResponse.json(foods)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const food = await prisma.food.create({
    data: {
      ...body,
      userId: session.user.id,
      source: 'manual',
    },
  })

  return NextResponse.json(food)
}
