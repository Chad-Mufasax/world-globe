'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { LogOut, Upload, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
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
    <div className="h-screen w-screen flex overflow-hidden relative" style={{ background: '#07030f' }}>

      {/* Left sidebar */}
      <div className={`relative flex-shrink-0 transition-all duration-300 ${leftOpen ? 'w-72' : 'w-0'}`} style={{ zIndex: 10 }}>
        <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${leftOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{
            background: 'linear-gradient(180deg, rgba(20,8,40,0.96) 0%, rgba(15,5,30,0.96) 100%)',
            borderRight: '1px solid rgba(139,92,246,0.2)',
            backdropFilter: 'blur(20px)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
            <div style={{ filter: 'drop-shadow(0 0 8px rgba(192,38,211,0.8))' }}>
              <Sparkles className="w-6 h-6" style={{ color: '#e879f9' }} />
            </div>
            <span className="font-bold tracking-widest uppercase text-sm"
              style={{ background: 'linear-gradient(90deg, #e879f9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Merge
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 0 14px rgba(168,85,247,0.5)' }}>
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#f0abfc' }}>@{session?.user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{session?.user?.email}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="transition-colors hover:scale-110"
              style={{ color: 'rgba(139,92,246,0.6)' }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mx-4 mt-4 rounded-xl p-0.5" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            {(['feed', 'upload'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 text-xs py-2 rounded-lg transition-all capitalize font-medium"
                style={tab === t ? {
                  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                  color: '#fff',
                  boxShadow: '0 0 14px rgba(139,92,246,0.4)',
                } : { color: 'rgba(255,255,255,0.35)' }}
              >
                {t === 'upload'
                  ? <span className="flex items-center justify-center gap-1"><Upload className="w-3 h-3" />Upload</span>
                  : 'Feed'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tab === 'upload' ? (
              <UploadPanel onUploadSuccess={handleUploadSuccess} />
            ) : (
              photos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🌍</div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No memories yet.</p>
                  <p className="text-xs" style={{ color: 'rgba(192,38,211,0.6)' }}>Be the first to pin one!</p>
                </div>
              ) : (
                photos.map(photo => (
                  <PhotoCard key={photo.id} photo={photo} onSelect={() => setSelectedPhoto(photo)} />
                ))
              )
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
            boxShadow: '0 0 16px rgba(139,92,246,0.5)',
          }}
        >
          {leftOpen ? <ChevronLeft className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Globe */}
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-sm animate-pulse" style={{ color: '#a78bfa' }}>Loading the world…</div>
          </div>
        }>
          <GlobeCanvas photos={photos} onMarkerClick={photo => setSelectedPhoto(photo)} />
        </Suspense>

        {/* Selected photo popup */}
        {selectedPhoto && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl p-4 flex gap-4 items-center max-w-sm w-full mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(20,8,40,0.95), rgba(30,10,50,0.95))',
              border: '1px solid rgba(192,38,211,0.4)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(139,92,246,0.3)',
            }}>
            <img src={selectedPhoto.url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              style={{ border: '2px solid rgba(192,38,211,0.4)', boxShadow: '0 0 12px rgba(192,38,211,0.3)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#f0abfc' }}>
                📁 {selectedPhoto.folderName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>@{selectedPhoto.user.username}</p>
              {selectedPhoto.caption && (
                <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedPhoto.caption}</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {selectedPhoto.lat.toFixed(3)}°, {selectedPhoto.lng.toFixed(3)}°
              </p>
            </div>
            <button onClick={() => setSelectedPhoto(null)}
              className="self-start text-xl leading-none transition-colors hover:scale-110"
              style={{ color: 'rgba(192,38,211,0.6)' }}>×</button>
          </div>
        )}
      </div>
    </div>
  )
}
