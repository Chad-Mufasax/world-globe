import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const photos = await prisma.photo.findMany({
      include: { user: { select: { username: true, avatar: true } }, likes: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(photos)
  } catch (e) {
    console.error('GET /api/photos error:', e)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { imageData, lat, lng, folderName, caption } = body

    if (!imageData || isNaN(lat) || isNaN(lng) || !folderName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const photo = await prisma.photo.create({
      data: {
        url: imageData,
        lat,
        lng,
        folderName,
        caption: caption || null,
        userId: session.user.id,
      },
      include: { user: { select: { username: true, avatar: true } }, likes: true },
    })

    return NextResponse.json(photo)
  } catch (e) {
    console.error('POST /api/photos error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
