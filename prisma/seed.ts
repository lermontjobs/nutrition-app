import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const foods = [
  // חלבונים
  { name: 'חזה עוף', nameEn: 'Chicken Breast', category: 'protein', servingSize: 100, calories: 110, protein: 23, carbs: 0, fat: 2.5, source: 'usda' },
  { name: 'שוק עוף ללא עור', nameEn: 'Chicken Thigh', category: 'protein', servingSize: 100, calories: 130, protein: 20, carbs: 0, fat: 5.5, source: 'usda' },
  { name: 'סלמון', nameEn: 'Salmon', category: 'protein', servingSize: 100, calories: 208, protein: 20, carbs: 0, fat: 13, source: 'usda' },
  { name: 'טונה בקופסה (במים)', nameEn: 'Canned Tuna', category: 'protein', servingSize: 100, calories: 84, protein: 20, carbs: 0, fat: 0.5, source: 'usda' },
  { name: 'בקלה', nameEn: 'Cod', category: 'protein', servingSize: 100, calories: 82, protein: 18, carbs: 0, fat: 0.5, source: 'usda' },
  { name: 'בשר בקר רזה', nameEn: 'Lean Beef', category: 'protein', servingSize: 100, calories: 186, protein: 26, carbs: 0, fat: 9, source: 'usda' },
  { name: 'הודו טחון', nameEn: 'Ground Turkey', category: 'protein', servingSize: 100, calories: 148, protein: 22, carbs: 0, fat: 7, source: 'usda' },
  { name: 'ביצה שלמה', nameEn: 'Whole Egg', category: 'protein', servingSize: 50, calories: 72, protein: 6, carbs: 0.4, fat: 5, source: 'usda' },
  { name: 'חלבון ביצה', nameEn: 'Egg White', category: 'protein', servingSize: 30, calories: 15, protein: 3.5, carbs: 0, fat: 0, source: 'usda' },
  // חלב וגבינות
  { name: 'גבינה לבנה 5%', nameEn: 'White Cheese 5%', category: 'dairy', servingSize: 100, calories: 80, protein: 10, carbs: 3, fat: 3, source: 'il_standard' },
  { name: 'קוטג\'', nameEn: 'Cottage Cheese', category: 'dairy', servingSize: 200, calories: 150, protein: 18, carbs: 6, fat: 4, source: 'il_standard' },
  { name: 'יוגורט יווני', nameEn: 'Greek Yogurt', category: 'dairy', servingSize: 170, calories: 100, protein: 17, carbs: 6, fat: 0.7, source: 'usda' },
  { name: 'גבינת מוצרלה', nameEn: 'Mozzarella', category: 'dairy', servingSize: 100, calories: 280, protein: 28, carbs: 2, fat: 17, source: 'usda' },
  { name: 'חלב 1%', nameEn: 'Milk 1%', category: 'dairy', servingSize: 240, calories: 100, protein: 8, carbs: 12, fat: 2.5, source: 'usda' },
  { name: 'גבינת עמק', nameEn: 'Yellow Cheese', category: 'dairy', servingSize: 30, calories: 90, protein: 7, carbs: 0, fat: 7, source: 'il_standard' },
  // פחמימות
  { name: 'אורז לבן מבושל', nameEn: 'White Rice Cooked', category: 'carbs', servingSize: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, source: 'usda' },
  { name: 'אורז מלא מבושל', nameEn: 'Brown Rice Cooked', category: 'carbs', servingSize: 100, calories: 112, protein: 2.6, carbs: 23, fat: 0.9, source: 'usda' },
  { name: 'לחם לבן', nameEn: 'White Bread', category: 'carbs', servingSize: 30, calories: 80, protein: 2.7, carbs: 15, fat: 1, source: 'usda' },
  { name: 'לחם מחיטה מלאה', nameEn: 'Whole Wheat Bread', category: 'carbs', servingSize: 30, calories: 70, protein: 3.5, carbs: 12, fat: 1, source: 'usda' },
  { name: 'שיבולת שועל', nameEn: 'Oatmeal', category: 'carbs', servingSize: 40, calories: 150, protein: 5, carbs: 27, fat: 3, source: 'usda' },
  { name: 'פסטה מבושלת', nameEn: 'Pasta Cooked', category: 'carbs', servingSize: 100, calories: 131, protein: 5, carbs: 25, fat: 1.1, source: 'usda' },
  { name: 'בטטה', nameEn: 'Sweet Potato', category: 'carbs', servingSize: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1, source: 'usda' },
  { name: 'תפוח אדמה', nameEn: 'Potato', category: 'carbs', servingSize: 100, calories: 77, protein: 2, carbs: 17, fat: 0.1, source: 'usda' },
  { name: 'קינואה מבושלת', nameEn: 'Quinoa Cooked', category: 'carbs', servingSize: 100, calories: 120, protein: 4.4, carbs: 21, fat: 1.9, source: 'usda' },
  { name: 'עדשים מבושלים', nameEn: 'Lentils Cooked', category: 'carbs', servingSize: 100, calories: 116, protein: 9, carbs: 20, fat: 0.4, source: 'usda' },
  { name: 'חומוס (שימורים)', nameEn: 'Canned Chickpeas', category: 'carbs', servingSize: 100, calories: 164, protein: 8.9, carbs: 27, fat: 2.6, source: 'usda' },
  { name: 'פיתה', nameEn: 'Pita', category: 'carbs', servingSize: 60, calories: 165, protein: 5.5, carbs: 33, fat: 1, source: 'il_standard' },
  { name: 'טורטייה', nameEn: 'Tortilla', category: 'carbs', servingSize: 60, calories: 180, protein: 5, carbs: 30, fat: 5, source: 'usda' },
  // ירקות
  { name: 'ברוקולי', nameEn: 'Broccoli', category: 'vegetables', servingSize: 100, calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, source: 'usda' },
  { name: 'עגבנייה', nameEn: 'Tomato', category: 'vegetables', servingSize: 100, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, source: 'usda' },
  { name: 'מלפפון', nameEn: 'Cucumber', category: 'vegetables', servingSize: 100, calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, source: 'usda' },
  { name: 'גזר', nameEn: 'Carrot', category: 'vegetables', servingSize: 100, calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, source: 'usda' },
  { name: 'תרד', nameEn: 'Spinach', category: 'vegetables', servingSize: 100, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, source: 'usda' },
  { name: 'כרוב', nameEn: 'Cabbage', category: 'vegetables', servingSize: 100, calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, source: 'usda' },
  { name: 'פלפל אדום', nameEn: 'Red Pepper', category: 'vegetables', servingSize: 100, calories: 31, protein: 1, carbs: 6, fat: 0.3, source: 'usda' },
  { name: 'בצל', nameEn: 'Onion', category: 'vegetables', servingSize: 100, calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, source: 'usda' },
  { name: 'שום', nameEn: 'Garlic', category: 'vegetables', servingSize: 10, calories: 15, protein: 0.6, carbs: 3.3, fat: 0.1, source: 'usda' },
  { name: 'קישוא', nameEn: 'Zucchini', category: 'vegetables', servingSize: 100, calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, source: 'usda' },
  { name: 'חצילים', nameEn: 'Eggplant', category: 'vegetables', servingSize: 100, calories: 25, protein: 1, carbs: 5.9, fat: 0.2, source: 'usda' },
  // פירות
  { name: 'תפוח', nameEn: 'Apple', category: 'fruits', servingSize: 150, calories: 78, protein: 0.4, carbs: 21, fat: 0.2, fiber: 3.6, source: 'usda' },
  { name: 'בננה', nameEn: 'Banana', category: 'fruits', servingSize: 120, calories: 107, protein: 1.3, carbs: 27, fat: 0.4, source: 'usda' },
  { name: 'תפוז', nameEn: 'Orange', category: 'fruits', servingSize: 130, calories: 62, protein: 1.2, carbs: 15, fat: 0.2, source: 'usda' },
  { name: 'אבוקדו', nameEn: 'Avocado', category: 'fruits', servingSize: 100, calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, source: 'usda' },
  { name: 'תות שדה', nameEn: 'Strawberry', category: 'fruits', servingSize: 100, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, source: 'usda' },
  { name: 'אבטיח', nameEn: 'Watermelon', category: 'fruits', servingSize: 200, calories: 60, protein: 1.2, carbs: 15, fat: 0.3, source: 'usda' },
  // שומנים ואגוזים
  { name: 'שמן זית', nameEn: 'Olive Oil', category: 'fats', servingSize: 14, calories: 120, protein: 0, carbs: 0, fat: 14, source: 'usda' },
  { name: 'טחינה גולמית', nameEn: 'Tahini Raw', category: 'fats', servingSize: 30, calories: 180, protein: 5, carbs: 6, fat: 16, source: 'il_standard' },
  { name: 'שקדים', nameEn: 'Almonds', category: 'nuts', servingSize: 28, calories: 164, protein: 6, carbs: 6, fat: 14, source: 'usda' },
  { name: 'אגוזי מלך', nameEn: 'Walnuts', category: 'nuts', servingSize: 28, calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, source: 'usda' },
  { name: 'חמאת בוטנים', nameEn: 'Peanut Butter', category: 'fats', servingSize: 32, calories: 190, protein: 7, carbs: 7, fat: 16, source: 'usda' },
  // מוצרים מוכנים ישראליים
  { name: 'חמוס (מוצר מוכן)', nameEn: 'Hummus', category: 'prepared', servingSize: 100, calories: 177, protein: 8, carbs: 20, fat: 8, source: 'il_estimated', isEstimated: true },
  { name: 'טחינה מוכנה', nameEn: 'Tahini Spread', category: 'prepared', servingSize: 50, calories: 170, protein: 6, carbs: 7, fat: 15, source: 'il_standard' },
  { name: 'שקשוקה', nameEn: 'Shakshuka', category: 'prepared', servingSize: 200, calories: 220, protein: 14, carbs: 12, fat: 13, source: 'il_estimated', isEstimated: true },
  { name: 'פלאפל (כדור)', nameEn: 'Falafel Ball', category: 'prepared', servingSize: 17, calories: 57, protein: 2.3, carbs: 5, fat: 3, source: 'il_estimated', isEstimated: true },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing foods
  await prisma.food.deleteMany({})

  // Insert foods
  for (const food of foods) {
    await prisma.food.create({
      data: {
        ...food,
        isEstimated: food.isEstimated || false,
      },
    })
  }

  console.log(`✅ Created ${foods.length} foods`)
  console.log('✅ Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
