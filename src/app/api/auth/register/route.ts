import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, dob, gender, height, currentWeight, targetWeight,
      goalType, activityLevel, workoutsPerWeek, targetDate,
      dailyCalories, dailyProtein, dailyCarbs, dailyFat, dailyWater, mealsPerDay,
      isKosher, isVegetarian, isVegan, allergies, dislikes, favorites, medicalNotes,
      maxPrepTime, mealTimes, workoutTimes } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'אימייל כבר קיים במערכת' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        dateOfBirth: dob ? new Date(dob) : null,
        gender,
        height: height ? Number(height) : null,
      },
    })

    await prisma.userGoals.create({
      data: {
        userId: user.id,
        currentWeight: currentWeight ? Number(currentWeight) : null,
        targetWeight: targetWeight ? Number(targetWeight) : null,
        goalType: goalType || 'lose',
        activityLevel: activityLevel || 'moderate',
        workoutsPerWeek: Number(workoutsPerWeek) || 3,
        targetDate: targetDate ? new Date(targetDate) : null,
        dailyCalories: Number(dailyCalories) || 2000,
        dailyProtein: Number(dailyProtein) || 150,
        dailyCarbs: Number(dailyCarbs) || 200,
        dailyFat: Number(dailyFat) || 65,
        dailyWater: Number(dailyWater) || 2.5,
        mealsPerDay: Number(mealsPerDay) || 4,
      },
    })

    await prisma.dietaryPreferences.create({
      data: {
        userId: user.id,
        isKosher: Boolean(isKosher),
        isVegetarian: Boolean(isVegetarian),
        isVegan: Boolean(isVegan),
        allergies: allergies || '',
        dislikes: dislikes || '',
        favorites: favorites || '',
        medicalNotes: medicalNotes || '',
        maxPrepTime: Number(maxPrepTime) || 30,
        mealTimes: mealTimes || '',
        workoutTimes: workoutTimes || '',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
