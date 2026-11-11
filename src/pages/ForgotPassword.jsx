import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { apiForgotPassword } from '../lib/authApi'
import { Mail, KeyRound, Clock, Loader2, ArrowLeft, UserPlus, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLang()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notRegistered, setNotRegistered] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError(t('ইমেইল ঠিকানা প্রদান করুন', 'Please enter your email'))
      setNotRegistered(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError(t('সঠিক ইমেইল ঠিকানা দিন', 'Please enter a valid email address'))
      setNotRegistered(false)
      return
    }

    setError('')
    setNotRegistered(false)
    setLoading(true)

    try {
      const res = await apiForgotPassword(cleanEmail)
      toast.success(
        t(
          'আপনার ইমেইলে ২ মিনিটের একটি ওটিপি কোড পাঠানো হয়েছে!',
          'A 2-minute OTP code has been sent to your email!'
        ),
        { duration: 5000 }
      )

      if (res.otpSession) {
        sessionStorage.setItem('tvs_otp_session', res.otpSession)
      }

      // Navigate to OTP verification page
      navigate(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`)
    } catch (err) {
      console.error('Forgot password error:', err)
      const isUnregistered = Boolean(
        err.notRegistered ||
        (err.message && (err.message.includes('কোনো অ্যাকাউন্ট তৈরি করা নেই') || err.message.includes('সাইন আপ')))
      )
      setNotRegistered(isUnregistered)
      setError(err.message || t('ওটিপি পাঠাতে সমস্যা হয়েছে।', 'Failed to send OTP.'))
      toast.error(err.message || t('ওটিপি পাঠাতে সমস্যা হয়েছে।', 'Failed to send OTP.'))
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
              {t('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot Password?')}
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              {t(
                'আপনার নিবন্ধিত ইমেইলে একটি ৬-ডিজিটের কনফার্মেশন কোড পাঠানো হবে।',
                'A 6-digit confirmation code will be sent to your registered email.'
              )}
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">
                {t('নিবন্ধিত ইমেইল ঠিকানা', 'Registered Email Address')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className={`input-field pl-10 ${error ? 'border-red-400' : ''}`}
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Account Not Found Banner & Sign Up CTA */}
            {notRegistered && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-3 animate-fade-in shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      {t('কোনো অ্যাকাউন্ট পাওয়া যায়নি!', 'No Account Found!')}
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                      {t(
                        'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট তৈরি করা নেই। পাসওয়ার্ড রিসেট করতে প্রথমে একটি অ্যাকাউন্ট থাকতে হবে।',
                        'There is no account associated with this email. Please sign up to create a new account.'
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/register?email=${encodeURIComponent(email.trim())}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)', 'Create New Account (Sign Up)')}</span>
                </Link>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3 bg-brand-surface rounded-xl text-xs text-brand-muted flex items-start gap-2 border border-outline-variant/40">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {t(
                  'কোডটির মেয়াদ পাঠানোর পর ঠিক ২ মিনিট (১২০ সেকেন্ড) থাকবে। ২ মিনিটের মধ্যে কোডটি যাচাই করতে হবে।',
                  'The code is valid for exactly 2 minutes (120 seconds). You must verify it within this time.'
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('ওটিপি পাঠানো হচ্ছে…', 'Sending OTP…')}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t('ওটিপি কোড পাঠান', 'Send OTP Code')}</span>
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
        </div>
      </div>
    </div>
  )
}
