import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = t('ইমেইল প্রয়োজন', 'Email is required')
    if (!form.password) e.password = t('পাসওয়ার্ড প্রয়োজন', 'Password is required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { error } = await signIn({ email: form.email, password: form.password })
    setLoading(false)
    if (error) {
      const code = error?.code || error?.message || ''
      if (code.includes('email_not_confirmed') || code.includes('Email not confirmed')) {
        toast.error(t('ইমেইল কনফার্ম করুন। আপনার ইনবক্স চেক করুন।', 'Please confirm your email first. Check your inbox.'), { duration: 5000 })
      } else if (code.includes('invalid_credentials') || code.includes('Invalid login credentials')) {
        toast.error(t('ইমেইল বা পাসওয়ার্ড ভুল।', 'Invalid email or password.'))
      } else if (code.includes('too_many_requests') || code.includes('rate limit')) {
        toast.error(t('অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।', 'Too many attempts. Please try again later.'))
      } else {
        toast.error(t('লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'Login failed. Please try again.'))
        console.error('Login error:', error)
      }
    } else {
      toast.success(t('স্বাগতম! 👋', 'Welcome back! 👋'))
      navigate('/')
    }
  }


  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg">
              ত
            </div>
            <h1 className="text-2xl font-bold text-brand-dark">{t('স্বাগতম!', 'Welcome Back!')}</h1>
            <p className="text-brand-muted text-sm mt-1">{t('তন্ময় ভ্যারাইটি স্টোরে লগইন করুন', 'Sign in to Tonmoy Varity Store')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('ইমেইল', 'Email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`input-field pl-10 ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('পাসওয়ার্ড', 'Password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('লগইন হচ্ছে…', 'Signing in…') : t('লগইন করুন', 'Sign In')}
            </button>
          </form>

          <p className="text-center text-sm text-brand-muted mt-5">
            {t('অ্যাকাউন্ট নেই?', "Don't have an account?")}{' '}
            <Link to="/register" className="text-brand-fresh font-semibold hover:underline">
              {t('নিবন্ধন করুন', 'Register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
