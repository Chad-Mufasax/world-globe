import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  const photos = await prisma.photo.findMany({
    include: { user: { select: { username: true, avatar: true } }, likes: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const folderName = formData.get('folderName') as string
  const caption = formData.get('caption') as string

  if (!file || isNaN(lat) || isNaN(lng) || !folderName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
  await writeFile(path.join(uploadsDir, filename), buffer)
  const url = `/uploads/${filename}`

  const photo = await prisma.photo.create({
    data: {
      url,
      lat,
      lng,
      folderName,
      caption: caption || null,
      userId: session.user.id,
    },
    include: { user: { select: { username: true, avatar: true } }, likes: true },
  })

  return NextResponse.json(photo)
}
