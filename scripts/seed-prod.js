const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const foods = [
  { name: 'חזה עוף מבושל', category: 'protein', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100 },
  { name: 'ביצה שלמה', category: 'protein', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100 },
  { name: 'גבינה לבנה 5%', category: 'dairy', calories: 90, protein: 11, carbs: 4, fat: 3, servingSize: 100 },
  { name: 'יוגורט יווני 0%', category: 'dairy', calories: 59, protein: 10, carbs: 4, fat: 0.4, servingSize: 100 },
  { name: 'אורז לבן מבושל', category: 'carbs', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100 },
  { name: 'לחם מחיטה מלאה', category: 'carbs', calories: 247, protein: 9, carbs: 41, fat: 3.4, servingSize: 100 },
  { name: 'בטטה מבושלת', category: 'carbs', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: 100 },
  { name: 'קינואה מבושלת', category: 'carbs', calories: 120, protein: 4.4, carbs: 22, fat: 1.9, servingSize: 100 },
  { name: 'עגבנייה', category: 'vegetables', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: 100 },
  { name: 'מלפפון', category: 'vegetables', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, servingSize: 100 },
  { name: 'ברוקולי', category: 'vegetables', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: 100 },
  { name: 'תרד', category: 'vegetables', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: 100 },
  { name: 'אבוקדו', category: 'fats', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: 100 },
  { name: 'שמן זית', category: 'fats', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100 },
  { name: 'שקדים', category: 'nuts', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 100 },
  { name: 'בננה', category: 'fruits', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100 },
  { name: 'תפוח', category: 'fruits', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100 },
  { name: 'סלמון אפוי', category: 'protein', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100 },
  { name: 'טונה בשמן', category: 'protein', calories: 200, protein: 30, carbs: 0, fat: 9, servingSize: 100 },
  { name: 'חומוס', category: 'protein', calories: 166, protein: 9, carbs: 27, fat: 3, servingSize: 100 },
]

async function main() {
  console.log('🌱 Seeding database...')

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.name },
      update: food,
      create: { id: food.name.replace(/\s/g, '_'), ...food, isVerified: true },
    }).catch(() => prisma.food.create({ data: { ...food, isVerified: true } }))
  }

  console.log(`✅ Seeded ${foods.length} foods`)

  // Create demo admin if ADMIN_EMAIL is set
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    const user = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: { isAdmin: true },
      create: {
        email: process.env.ADMIN_EMAIL,
        password: hashed,
        name: process.env.ADMIN_NAME || 'Admin',
        isAdmin: true,
        goals: { create: { goalType: 'maintain', dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65, dailyWater: 2.5, mealsPerDay: 4 } },
        dietaryPreferences: { create: {} },
      },
    })
    console.log(`✅ Admin user: ${user.email}`)
  }

  console.log('🎉 Seed complete!')
}

main().catch(e => { console.error(e); process.exit(1) })
