'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { LogOut, Upload, Sparkles, Globe, LayoutList, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tab, setTab] = useState<'upload' | 'feed'>('feed')
  // mobile sheet
  const [sheetTab, setSheetTab] = useState<'feed' | 'upload' | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/photos').then(r => r.json()).then(setPhotos)
  }, [])

  function handleUploadSuccess(photo: Photo) {
    setPhotos(prev => [photo, ...prev])
    setTab('feed')
    setSheetTab('feed')
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  const sidebarContent = (activeTab: 'feed' | 'upload', setActiveTab: (t: 'feed' | 'upload') => void) => (
    <>
      {/* Tabs */}
      <div className="flex mx-4 mt-4 rounded-xl p-0.5 flex-shrink-0"
        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
        {(['feed', 'upload'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 text-xs py-2 rounded-lg transition-all capitalize font-medium"
            style={activeTab === t ? {
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              color: '#fff',
              boxShadow: '0 0 14px rgba(139,92,246,0.4)',
            } : { color: 'rgba(255,255,255,0.35)' }}>
            {t === 'upload'
              ? <span className="flex items-center justify-center gap-1"><Upload className="w-3 h-3" />Upload</span>
              : 'Feed'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {activeTab === 'upload' ? (
          <UploadPanel onUploadSuccess={handleUploadSuccess} />
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No memories yet.</p>
            <p className="text-xs" style={{ color: 'rgba(192,38,211,0.6)' }}>Be the first to pin one!</p>
          </div>
        ) : (
          photos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} onSelect={() => {
              setSelectedPhoto(photo)
              setSheetTab(null)
            }} />
          ))
        )}
      </div>
    </>
  )

  return (
    <div className="h-screen w-screen flex overflow-hidden relative" style={{ background: '#07030f' }}>

      {/* ── DESKTOP sidebar ── */}
      <div className="hidden md:block relative flex-shrink-0 transition-all duration-300"
        style={{ width: sidebarOpen ? 288 : 0, zIndex: 10 }}>

        <div className="absolute inset-0 flex flex-col transition-opacity duration-300"
          style={{
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            background: 'linear-gradient(180deg, rgba(20,8,40,0.96) 0%, rgba(15,5,30,0.96) 100%)',
            borderRight: '1px solid rgba(139,92,246,0.2)',
            backdropFilter: 'blur(20px)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
            <div style={{ filter: 'drop-shadow(0 0 8px rgba(192,38,211,0.8))' }}>
              <Sparkles className="w-6 h-6" style={{ color: '#e879f9' }} />
            </div>
            <span className="font-bold tracking-widest uppercase text-sm"
              style={{ background: 'linear-gradient(90deg, #e879f9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Merge
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', boxShadow: '0 0 14px rgba(168,85,247,0.5)' }}>
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#f0abfc' }}>@{session?.user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{session?.user?.email}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="transition-colors hover:scale-110" style={{ color: 'rgba(139,92,246,0.6)' }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {sidebarContent(tab, setTab)}
        </div>

        {/* Toggle button — always visible, outside the collapsing div */}
      </div>

      {/* Desktop toggle — fixed to left edge, always visible */}
      <button
        onClick={() => setSidebarOpen(v => !v)}
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center transition-all hover:scale-110"
        style={{
          left: sidebarOpen ? 272 : 4,
          background: 'linear-gradient(135deg, #7c3aed, #db2777)',
          boxShadow: '0 0 16px rgba(139,92,246,0.5)',
          transition: 'left 0.3s ease',
        }}>
        {sidebarOpen ? <ChevronLeft className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
      </button>

      {/* Globe — full screen on both mobile and desktop */}
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-sm animate-pulse" style={{ color: '#a78bfa' }}>Loading the world…</div>
          </div>
        }>
          <GlobeCanvas photos={photos} onMarkerClick={photo => { setSelectedPhoto(photo); setSheetTab(null) }} />
        </Suspense>

        {/* Selected photo popup */}
        {selectedPhoto && (
          <div className="absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 rounded-2xl p-4 flex gap-4 items-center w-[calc(100%-2rem)] max-w-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(20,8,40,0.95), rgba(30,10,50,0.95))',
              border: '1px solid rgba(192,38,211,0.4)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(139,92,246,0.3)',
            }}>
            <img src={selectedPhoto.url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              style={{ border: '2px solid rgba(192,38,211,0.4)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#f0abfc' }}>📁 {selectedPhoto.folderName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>@{selectedPhoto.user.username}</p>
              {selectedPhoto.caption && <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedPhoto.caption}</p>}
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{selectedPhoto.lat.toFixed(3)}°, {selectedPhoto.lng.toFixed(3)}°</p>
            </div>
            <button onClick={() => setSelectedPhoto(null)} className="self-start text-xl leading-none" style={{ color: 'rgba(192,38,211,0.6)' }}>×</button>
          </div>
        )}
      </div>

      {/* ── MOBILE bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-4 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(15,5,30,0.97), rgba(20,8,40,0.97))',
          borderTop: '1px solid rgba(139,92,246,0.25)',
          backdropFilter: 'blur(20px)',
        }}>

        {/* Logo / home */}
        <button onClick={() => setSheetTab(null)} className="flex flex-col items-center gap-1">
          <Globe className="w-6 h-6" style={{ color: sheetTab === null ? '#e879f9' : 'rgba(255,255,255,0.4)' }} />
          <span className="text-[10px]" style={{ color: sheetTab === null ? '#e879f9' : 'rgba(255,255,255,0.3)' }}>Globe</span>
        </button>

        {/* Upload button — center prominent */}
        <button
          onClick={() => setSheetTab(t => t === 'upload' ? null : 'upload')}
          className="w-14 h-14 rounded-full flex items-center justify-center -mt-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
            boxShadow: '0 0 24px rgba(139,92,246,0.6)',
          }}>
          <Upload className="w-6 h-6 text-white" />
        </button>

        {/* Feed */}
        <button onClick={() => setSheetTab(t => t === 'feed' ? null : 'feed')} className="flex flex-col items-center gap-1">
          <LayoutList className="w-6 h-6" style={{ color: sheetTab === 'feed' ? '#e879f9' : 'rgba(255,255,255,0.4)' }} />
          <span className="text-[10px]" style={{ color: sheetTab === 'feed' ? '#e879f9' : 'rgba(255,255,255,0.3)' }}>Feed</span>
        </button>
      </div>

      {/* ── MOBILE bottom sheet ── */}
      {sheetTab !== null && (
        <div className="md:hidden fixed inset-0 z-20" onClick={() => setSheetTab(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
        </div>
      )}
      <div
        className="md:hidden fixed left-0 right-0 z-25 flex flex-col rounded-t-3xl"
        style={{
          bottom: 64,
          height: '70vh',
          background: 'linear-gradient(180deg, rgba(20,8,40,0.98), rgba(15,5,30,0.98))',
          border: '1px solid rgba(139,92,246,0.25)',
          borderBottom: 'none',
          backdropFilter: 'blur(20px)',
          transform: sheetTab !== null ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          zIndex: 25,
        }}>

        {/* Sheet handle + header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#e879f9' }} />
            <span className="font-bold tracking-widest uppercase text-xs"
              style={{ background: 'linear-gradient(90deg, #e879f9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Merge
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>@{session?.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ color: 'rgba(139,92,246,0.6)' }}>
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => setSheetTab(null)} style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {sheetTab !== null && sidebarContent(sheetTab, setSheetTab as any)}
      </div>
    </div>
  )
}
