import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'
import { Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, signUp } = useAuth()
  const { t } = useLang()

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = t('নাম প্রয়োজন', 'Name is required')
    if (!form.phone.trim()) e.phone = t('ফোন নম্বর প্রয়োজন', 'Phone is required')
    else if (!/^(\+880|880|0)?1[3-9]\d{8}$/.test(form.phone.trim())) e.phone = t('সঠিক ফোন নম্বর দিন', 'Enter valid BD phone')
    if (!form.email.trim()) e.email = t('ইমেইল প্রয়োজন', 'Email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('সঠিক ইমেইল দিন', 'Enter valid email')
    if (!form.password) e.password = t('পাসওয়ার্ড প্রয়োজন', 'Password is required')
    else if (form.password.length < 6) e.password = t('কমপক্ষে ৬ অক্ষর', 'Minimum 6 characters')
    if (form.password !== form.confirmPassword) e.confirmPassword = t('পাসওয়ার্ড মিলছে না', 'Passwords do not match')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      phone: form.phone,
    })
    setLoading(false)
    if (error) {
      const code = (error?.code || error?.message || '').toLowerCase()
      if (
        code.includes('user_already_exists') ||
        code.includes('already registered') ||
        code.includes('already exists') ||
        code.includes('identity_already_exists')
      ) {
        toast.error(t('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করুন।', 'User with this email already exists. Please log in.'))
      } else if (code.includes('password') && code.includes('weak')) {
        toast.error(t('আরও শক্তিশালী পাসওয়ার্ড দিন।', 'Password is too weak.'))
      } else {
        toast.error(t('নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'Registration failed. Please try again.'))
        console.error('Register error:', error)
      }
    } else {
      toast.success(t('নিবন্ধন সফল! ইমেইল যাচাই করুন।', 'Registered! Check your email.'))
      navigate('/login', { replace: true })
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
            <h1 className="text-2xl font-bold text-brand-dark">{t('নতুন অ্যাকাউন্ট খুলুন', 'Create Account')}</h1>
            <p className="text-brand-muted text-sm mt-1">{t('তন্ময় ভ্যারাইটি স্টোরে স্বাগতম!', 'Welcome to Tonmoy Varity Store!')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('পূর্ণ নাম', 'Full Name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className={`input-field pl-10 ${errors.fullName ? 'border-red-400' : ''}`}
                  placeholder={t('আপনার নাম', 'Your full name')}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('মোবাইল নম্বর', 'Phone Number')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={`input-field pl-10 ${errors.phone ? 'border-red-400' : ''}`}
                  placeholder="01712345678"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

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
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('পাসওয়ার্ড নিশ্চিত করুন', 'Confirm Password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('নিবন্ধন হচ্ছে…', 'Registering…') : t('নিবন্ধন সম্পন্ন করুন', 'Complete Registration')}
            </button>
          </form>

          <p className="text-center text-sm text-brand-muted mt-5">
            {t('ইতিমধ্যে অ্যাকাউন্ট আছে?', 'Already have an account?')}{' '}
            <Link to="/login" className="text-brand-fresh font-semibold hover:underline">
              {t('লগইন করুন', 'Sign In')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
