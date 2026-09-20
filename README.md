# 🥗 מערכת מעקב תזונה אישית

מערכת אישית לניהול תזונה ומעקב מדדים, בנויה ב-Next.js עם ממשק מלא בעברית RTL.

## תכונות עיקריות

- ✅ הרשמה והתחברות עם אשף הגדרה ב-5 שלבים
- ✅ דשבורד יומי עם טבעת קלוריות, מאקרו ומים
- ✅ יומן תזונה יומי עם מעקב ארוחות
- ✅ החלפת ארוחות חכמה לפי ערכים דומים
- ✅ צ'אט עם AI (OpenAI) לקבלת הצעות ארוחות
- ✅ תפריט שבועי עם גרילה ורשימת קניות
- ✅ מעקב מדדים גופניים (משקל, היקפים, שינה, מצב רוח)
- ✅ דשבורד התקדמות עם גרפים וסיכום שבועי
- ✅ הגדרות עם ניהול פרופיל והתראות
- ✅ מאגר 50+ מזונות בעברית ואנגלית
- ✅ עיצוב מותאם מובייל (mobile-first)
- ✅ מצב כהה/בהיר

## התקנה

### 1. דרישות מקדימות
- Node.js 18+
- npm

### 2. התקנת תלויות
\`\`\`bash
npm install
\`\`\`

### 3. הגדרת משתני סביבה
\`\`\`bash
copy .env.example .env
\`\`\`
ערוך את `.env` והוסף:
- `OPENAI_API_KEY` — מפתח OpenAI שלך
- `NEXTAUTH_SECRET` — מחרוזת אקראית ארוכה (לדוגמה: `openssl rand -base64 32`)

### 4. יצירת בסיס הנתונים
\`\`\`bash
npm run db:push
npm run db:seed
\`\`\`

### 5. הפעלה
\`\`\`bash
npm run dev
\`\`\`
גש ל: http://localhost:3000

## מבנה הפרויקט

\`\`\`
nutrition-app/
├── prisma/
│   ├── schema.prisma    # מבנה בסיס הנתונים
│   └── seed.ts          # נתוני זרע (50+ מזונות)
├── src/
│   ├── app/
│   │   ├── page.tsx           # דשבורד ראשי
│   │   ├── diary/             # יומן תזונה
│   │   ├── chat/              # צ'אט AI
│   │   ├── weekly/            # תפריט שבועי
│   │   ├── measurements/      # מדדים גופניים
│   │   ├── progress/          # התקדמות
│   │   ├── settings/          # הגדרות
│   │   ├── auth/              # כניסה/הרשמה
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── layout/            # TopBar, BottomNav
│   │   └── ui/                # MacroBar, CalorieRing
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   └── macros.ts          # חישובי BMR/TDEE
│   └── types/
│       └── index.ts           # TypeScript types
└── .env                       # משתני סביבה (לא לגיט!)
\`\`\`

## טכנולוגיות

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **Auth**: NextAuth.js (credentials)
- **AI**: OpenAI API (gpt-4o-mini, server-side only)
- **Charts**: Recharts
- **Icons**: Lucide React

## הערות חשובות

- ⚠️ המערכת אינה מחליפה ייעוץ של רופא או תזונאי
- 🔒 מפתח OpenAI מאוחסן בצד השרת בלבד
- 📊 ערכים קלוריים משוערים מסומנים בבירור
- 🌐 תמיכה מלאה ב-RTL (ימין לשמאל)
