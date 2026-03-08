'use client'
import { useState } from 'react'
import { Heart, MapPin } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Photo {
  id: string
  url: string
  caption?: string
  lat: number
  lng: number
  folderName: string
  createdAt: string
  user: { username: string; avatar?: string }
  likes: { userId: string }[]
}

export default function PhotoCard({ photo, onSelect }: { photo: Photo; onSelect: () => void }) {
  const { data: session } = useSession()
  const [likes, setLikes] = useState(photo.likes)
  const liked = session?.user?.id ? likes.some(l => l.userId === session.user.id) : false

  async function toggleLike() {
    if (!session) return
    const res = await fetch(`/api/photos/${photo.id}/like`, { method: 'POST' })
    if (res.ok) {
      const { liked: nowLiked } = await res.json()
      setLikes(nowLiked
        ? [...likes, { userId: session.user.id }]
        : likes.filter(l => l.userId !== session.user.id)
      )
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 p-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
          {photo.user.username[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium text-white">{photo.user.username}</span>
        <span className="text-xs text-gray-600 ml-auto">{new Date(photo.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="relative cursor-pointer" onClick={onSelect}>
        <img src={photo.url} alt={photo.folderName} className="w-full aspect-square object-cover" />
        <div className="absolute bottom-2 left-2">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            {photo.folderName}
          </span>
        </div>
      </div>

      <div className="p-3">
        {photo.caption && <p className="text-sm text-gray-300 mb-2">{photo.caption}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
            {likes.length}
          </button>
          <span className="text-xs text-gray-700 ml-auto">
            {photo.lat.toFixed(3)}&deg;, {photo.lng.toFixed(3)}&deg;
          </span>
        </div>
      </div>
    </div>
  )
}
