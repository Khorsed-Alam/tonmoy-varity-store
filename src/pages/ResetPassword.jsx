import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { apiResetPassword } from '../lib/authApi'
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLang()

  const email = searchParams.get('email') || sessionStorage.getItem('tvs_reset_email') || ''
  const token = searchParams.get('token') || sessionStorage.getItem('tvs_reset_token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!email || !token) {
      toast.error(t('অবৈধ রিসেট সেশন। অনুগ্রহ করে আবার শুরু করুন।', 'Invalid reset session. Please start over.'))
      navigate('/forgot-password')
    }
  }, [email, token, navigate, t])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password) {
      setError(t('নতুন পাসওয়ার্ড লিখুন', 'Please enter a new password'))
      return
    }

    if (password.length < 6) {
      setError(t('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'Password must be at least 6 characters'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('উভয় পাসওয়ার্ড এক হতে হবে', 'Passwords do not match'))
      return
    }

    setError('')
    setLoading(true)

    try {
      await apiResetPassword(email, token, password)

      // Clear stored tokens from session
      sessionStorage.removeItem('tvs_reset_token')
      sessionStorage.removeItem('tvs_reset_email')

      setIsSuccess(true)
      toast.success(t('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! 🎉', 'Password changed successfully! 🎉'))

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError(err.message || t('পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।', 'Failed to reset password.'))
      toast.error(err.message || t('পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।', 'Failed to reset password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="card p-8 shadow-xl border border-outline-variant/60">
          {/* Logo Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <img
                src="/logo.png"
                alt="তন্ময় ভ্যারাইটি স্টোর"
                className="h-20 w-auto mx-auto object-contain mb-3 drop-shadow-sm"
              />
            </Link>
            <h1 className="text-2xl font-bold text-brand-dark font-display">
              {isSuccess
                ? t('পাসওয়ার্ড পরিবর্তিত!', 'Password Changed!')
                : t('নতুন পাসওয়ার্ড সেট করুন', 'Set New Password')}
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              {isSuccess
                ? t('এখন নতুন পাসওয়ার্ড দিয়ে অ্যাকাউন্টে প্রবেশ করতে পারবেন', 'You can now log in with your new password')
                : t('আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী পাসওয়ার্ড তৈরি করুন', 'Create a strong password for your account')}
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-xs text-brand-muted max-w-xs mx-auto">
                {t(
                  'আপনাকে স্বয়ংক্রিয়ভাবে ৩ সেকেন্ডের মধ্যে লগইন পেইজে নিয়ে যাওয়া হচ্ছে…',
                  'Automatically redirecting you to the login page in 3 seconds…'
                )}
              </p>
              <div className="pt-2">
                <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
                  <span>{t('এখনই লগইন করুন', 'Login Now')}</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">
                  {t('নতুন পাসওয়ার্ড', 'New Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError('')
                    }}
                    className={`input-field pl-10 pr-10 ${error ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">
                  {t('নতুন পাসওয়ার্ড নিশ্চিত করুন', 'Confirm New Password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (error) setError('')
                    }}
                    className={`input-field pl-10 pr-10 ${error ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
              </div>

              <div className="p-3 bg-brand-surface rounded-xl text-xs text-brand-muted flex items-start gap-2 border border-outline-variant/40">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {t(
                    'পাসওয়ার্ডে কমপক্ষে ৬টি অক্ষর ব্যবহার করুন এবং কারো সাথে শেয়ার করবেন না।',
                    'Use at least 6 characters and never share it with anyone.'
                  )}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('পাসওয়ার্ড সংরক্ষণ করা হচ্ছে…', 'Saving password…')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('পাসওয়ার্ড নিশ্চিত করুন', 'Confirm & Reset Password')}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-dark font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('লগইন পেইজে ফিরে যান', 'Back to Login')}</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
