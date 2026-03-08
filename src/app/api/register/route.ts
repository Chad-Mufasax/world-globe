import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json()
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, email, password: hash },
  })
  return NextResponse.json({ id: user.id, username: user.username })
}
