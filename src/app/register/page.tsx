'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, User, Sparkles } from 'lucide-react'

const fields = [
  { icon: User,  placeholder: 'Username', key: 'username', type: 'text' },
  { icon: Mail,  placeholder: 'Email',    key: 'email',    type: 'email' },
  { icon: Lock,  placeholder: 'Password', key: 'password', type: 'password' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Registration failed')
      setLoading(false)
      return
    }
    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center overflow-auto" style={{ background: '#07030f' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(219,39,119,0.18), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="w-full max-w-md px-8 relative" style={{ zIndex: 10 }}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #db2777, #7c3aed)', boxShadow: '0 0 30px rgba(219,39,119,0.5)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest uppercase"
            style={{ background: 'linear-gradient(90deg, #e879f9, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GlobeSnap
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Join the world map.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ icon: Icon, placeholder, key, type }) => (
            <div key={key} className="relative">
              <Icon className="absolute left-3.5 top-3.5 w-4 h-4" style={{ color: 'rgba(167,139,250,0.6)' }} />
              <input
                type={type}
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
                required
              />
            </div>
          ))}
          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-all disabled:opacity-40 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #db2777, #7c3aed)', boxShadow: '0 0 24px rgba(219,39,119,0.4)' }}>
            {loading ? 'Creating…' : 'Create Account ✦'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium" style={{ color: '#e879f9' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
