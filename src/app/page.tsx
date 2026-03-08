'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Globe, LogOut, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import UploadPanel from '@/components/UploadPanel'
import PhotoCard from '@/components/PhotoCard'

const GlobeCanvas = dynamic(() => import('@/components/Globe'), { ssr: false })

interface Photo {
  id: string
  url: string
  caption?: string
  lat: number
  lng: number
  folderName: string
  createdAt: string
  user: { username: string }
  likes: { userId: string }[]
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [leftOpen, setLeftOpen] = useState(true)
  const [tab, setTab] = useState<'upload' | 'feed'>('feed')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/photos').then(r => r.json()).then(setPhotos)
  }, [])

  function handleUploadSuccess(photo: Photo) {
    setPhotos(prev => [photo, ...prev])
    setTab('feed')
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0f]">

      {/* Left sidebar */}
      <div className={`relative flex-shrink-0 transition-all duration-300 ${leftOpen ? 'w-72' : 'w-0'}`}>
        <div className={`absolute inset-0 bg-[#0d0f1a]/90 border-r border-white/[0.06] backdrop-blur-xl flex flex-col transition-opacity duration-300 ${leftOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
            <Globe className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <span className="text-white font-light tracking-widest uppercase text-sm">GlobeSnap</span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">@{session?.user?.name}</p>
              <p className="text-xs text-gray-600 truncate">{session?.user?.email}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-gray-600 hover:text-gray-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mx-4 mt-4 bg-white/[0.04] rounded-lg p-0.5">
            {(['feed', 'upload'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-xs py-2 rounded-md transition-all capitalize ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t === 'upload' ? <span className="flex items-center justify-center gap-1"><Upload className="w-3 h-3" />{t}</span> : t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tab === 'upload' ? (
              <UploadPanel onUploadSuccess={handleUploadSuccess} />
            ) : (
              photos.length === 0 ? (
                <p className="text-gray-700 text-xs text-center py-8">No photos yet. Be the first!</p>
              ) : (
                photos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onSelect={() => setSelectedPhoto(photo)}
                  />
                ))
              )
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-[#0d0f1a] border border-white/10 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
        >
          {leftOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* Globe */}
      <div className="flex-1 relative">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-700">Loading globe&hellip;</div>}>
          <GlobeCanvas
            photos={photos}
            onMarkerClick={photo => setSelectedPhoto(photo)}
          />
        </Suspense>

        {/* Selected photo overlay */}
        {selectedPhoto && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0d0f1a]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex gap-4 items-center max-w-sm w-full">
            <img src={selectedPhoto.url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white flex items-center gap-1">
                {selectedPhoto.folderName}
              </p>
              <p className="text-xs text-gray-500">@{selectedPhoto.user.username}</p>
              {selectedPhoto.caption && <p className="text-xs text-gray-400 mt-1 truncate">{selectedPhoto.caption}</p>}
              <p className="text-xs text-gray-700 mt-1">{selectedPhoto.lat.toFixed(4)}&deg;, {selectedPhoto.lng.toFixed(4)}&deg;</p>
            </div>
            <button onClick={() => setSelectedPhoto(null)} className="text-gray-600 hover:text-white self-start transition-colors text-lg leading-none">&times;</button>
          </div>
        )}
      </div>
    </div>
  )
}
