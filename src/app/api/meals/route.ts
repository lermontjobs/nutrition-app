import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mealType = searchParams.get('mealType')
  const targetCal = Number(searchParams.get('calories') || 0)
  const targetProt = Number(searchParams.get('protein') || 0)

  const meals = await prisma.meal.findMany({
    where: mealType ? { mealType } : {},
    include: { items: { include: { food: true } } },
    take: 20,
  })

  // Sort by similarity to target if given
  if (targetCal > 0) {
    meals.sort((a, b) => Math.abs(a.totalCalories - targetCal) - Math.abs(b.totalCalories - targetCal))
  }

  return NextResponse.json(meals)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, mealType, items, instructions, prepTime } = body

  // Calculate totals from items
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0

  const foodItems = await Promise.all(items.map(async (item: { foodId: string; quantity: number; unit: string }) => {
    const food = await prisma.food.findUnique({ where: { id: item.foodId } })
    if (!food) return null
    const factor = item.quantity / food.servingSize
    totalCalories += food.calories * factor
    totalProtein += food.protein * factor
    totalCarbs += food.carbs * factor
    totalFat += food.fat * factor
    return { foodId: item.foodId, quantity: item.quantity, unit: item.unit || 'g' }
  }))

  const meal = await prisma.meal.create({
    data: {
      name,
      mealType: mealType || 'custom',
      instructions,
      prepTime,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      items: { create: foodItems.filter(Boolean) as { foodId: string; quantity: number; unit: string }[] },
    },
    include: { items: { include: { food: true } } },
  })

  return NextResponse.json(meal)
}
