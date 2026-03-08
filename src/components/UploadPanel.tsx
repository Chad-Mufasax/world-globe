'use client'
import { useState, useRef } from 'react'
import { Upload, MapPin, CheckCircle, AlertCircle, X } from 'lucide-react'

interface Props {
  onUploadSuccess: (photo: PhotoData) => void
}

interface PhotoData {
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

export default function UploadPanel({ onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [folderName, setFolderName] = useState('')
  const [caption, setCaption] = useState('')
  const [status, setStatus] = useState<{ msg: string; type: 'idle' | 'loading' | 'ok' | 'err' }>({ msg: '', type: 'idle' })
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(f: File) {
    if (!f.type.startsWith('image/')) {
      setStatus({ msg: 'Please select an image file.', type: 'err' })
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus({ msg: 'Reading GPS data\u2026', type: 'loading' })

    try {
      const exifr = (await import('exifr')).default
      const result = await exifr.gps(f)
      if (!result?.latitude) throw new Error('No GPS data found in this photo. Make sure location is enabled on your camera.')
      setGps({ lat: result.latitude, lng: result.longitude })
      setStatus({ msg: `${result.latitude.toFixed(4)}\u00b0, ${result.longitude.toFixed(4)}\u00b0`, type: 'ok' })
      if (!folderName) setFolderName(f.name.replace(/\.[^.]+$/, ''))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to read GPS data'
      setStatus({ msg: message, type: 'err' })
      setGps(null)
    }
  }

  async function handleUpload() {
    if (!file || !gps || !folderName) return
    setStatus({ msg: 'Uploading\u2026', type: 'loading' })

    const fd = new FormData()
    fd.append('file', file)
    fd.append('lat', String(gps.lat))
    fd.append('lng', String(gps.lng))
    fd.append('folderName', folderName)
    fd.append('caption', caption)

    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    if (!res.ok) {
      const d = await res.json()
      setStatus({ msg: d.error || 'Upload failed', type: 'err' })
      return
    }
    const photo = await res.json()
    onUploadSuccess(photo)
    setStatus({ msg: 'Pinned on the globe!', type: 'ok' })
    setTimeout(() => {
      setFile(null); setPreview(null); setFolderName(''); setCaption(''); setGps(null)
      setStatus({ msg: '', type: 'idle' })
    }, 2000)
  }

  function clear() {
    setFile(null); setPreview(null); setFolderName(''); setCaption(''); setGps(null)
    setStatus({ msg: '', type: 'idle' })
  }

  return (
    <div className="space-y-3">
      {!file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-blue-500/5"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-gray-500 text-xs">Drop a photo or click to browse</p>
          <p className="text-gray-700 text-xs mt-1">Needs GPS data (camera photos)</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview!} alt="preview" className="w-full h-36 object-cover" />
          <button onClick={clear} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {status.msg && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          status.type === 'ok' ? 'bg-green-500/10 text-green-400' :
          status.type === 'err' ? 'bg-red-500/10 text-red-400' :
          'bg-white/5 text-gray-400'
        }`}>
          {status.type === 'ok' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
          {status.type === 'err' && <AlertCircle className="w-3 h-3 flex-shrink-0" />}
          {status.msg}
        </div>
      )}

      {file && (
        <>
          <input
            type="text"
            placeholder="Folder name *"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleUpload}
            disabled={!gps || !folderName || status.type === 'loading'}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-30 text-white text-sm font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {status.type === 'loading' ? 'Uploading\u2026' : 'Pin to Globe'}
          </button>
        </>
      )}
    </div>
  )
}
