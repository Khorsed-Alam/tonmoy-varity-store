import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const { signIn, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    const { data, error } = await signIn({ email: form.email, password: form.password })
    if (error) {
      toast.error('Invalid credentials')
      setLoading(false)
      return
    }
    // We need to check the profile after sign-in
    // The auth context will update isAdmin via onAuthStateChange + fetchProfile
    // Give it a moment to propagate
    setTimeout(async () => {
      // Re-check by fetching profile directly
      const { supabase } = await import('../../lib/supabase')
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      setLoading(false)
      if (profile?.role === 'admin') {
        toast.success('Welcome, Admin! 👋')
        navigate('/admin')
      } else {
        await import('../../lib/supabase').then(m => m.supabase.auth.signOut())
        toast.error('Access denied. Admin only.')
      }
    }, 800)
  }

  return (
    <div className="min-h-screen gradient-brand flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-brand-dark">অ্যাডমিন প্যানেল</h1>
            <p className="text-brand-muted text-sm mt-1">Tonmoy Varity Store — Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-10" placeholder="admin@example.com" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pl-10" placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
