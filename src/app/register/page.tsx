'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Globe, Lock, Mail, User } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] overflow-auto">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-10">
          <Globe className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h1 className="text-3xl font-light tracking-widest uppercase text-white">GlobeSnap</h1>
          <p className="text-gray-500 mt-2 text-sm">Join the world map</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { icon: User, placeholder: 'Username', key: 'username', type: 'text' },
            { icon: Mail, placeholder: 'Email', key: 'email', type: 'email' },
            { icon: Lock, placeholder: 'Password', key: 'password', type: 'password' },
          ].map(({ icon: Icon, placeholder, key, type }) => (
            <div key={key} className="relative">
              <Icon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type={type}
                placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm transition-colors"
                required
              />
            </div>
          ))}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 text-sm tracking-wide"
          >
            {loading ? 'Creating account\u2026' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
