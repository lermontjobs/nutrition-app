import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// One-time endpoint to make the first user an admin
// Only works if NO admin exists yet (secure bootstrap)
export async function POST(req: Request) {
  const { email, secret } = await req.json()

  // Must provide the app secret
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'קוד סודי שגוי' }, { status: 403 })
  }

  const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } })
  if (existingAdmin) {
    return NextResponse.json({ error: 'כבר קיים מנהל במערכת' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
    select: { id: true, name: true, email: true, isAdmin: true },
  })

  return NextResponse.json({ success: true, user })
}
