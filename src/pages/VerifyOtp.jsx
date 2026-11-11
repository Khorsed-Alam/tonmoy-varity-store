import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { apiVerifyOtp, apiForgotPassword } from '../lib/authApi'
import { Mail, KeyRound, Clock, RotateCw, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const OTP_EXPIRY_SECONDS = 120 // Exactly 2 minutes

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLang()

  const email = searchParams.get('email') || ''
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS)
  const timerRef = useRef(null)

  // Start 2-minute countdown timer
  const startTimer = (seconds = OTP_EXPIRY_SECONDS) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(seconds)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (!email) {
      toast.error(t('অনুগ্রহ করে প্রথমে ইমেইল দিন।', 'Please enter your email first.'))
      navigate('/forgot-password')
      return
    }

    startTimer(OTP_EXPIRY_SECONDS)

    // Focus first input box
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [email, navigate, t])

  // Format mm:ss
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    if (error) setError('')
    const val = value.replace(/\D/g, '') // only digits

    const newDigits = [...otpDigits]
    newDigits[index] = val ? val.slice(-1) : ''
    setOtpDigits(newDigits)

    // Move to next input box
    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    }
  }

  // Handle clipboard paste of full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newDigits = ['', '', '', '', '', '']
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i]
      }
      setOtpDigits(newDigits)
      const focusIndex = Math.min(pasted.length, 5)
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus()
      }
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return

    setResending(true)
    setError('')
    try {
      const res = await apiForgotPassword(email)
      if (res.otpSession) {
        sessionStorage.setItem('tvs_otp_session', res.otpSession)
      }
      toast.success(
        t('নতুন ওটিপি কোড পাঠানো হয়েছে! (ইনবক্স ও স্প্যাম চেক করুন)', 'New OTP code sent! (Check inbox & spam)')
      )
      setOtpDigits(['', '', '', '', '', ''])
      startTimer(OTP_EXPIRY_SECONDS)
      if (inputRefs.current[0]) inputRefs.current[0].focus()
    } catch (err) {
      toast.error(err.message || t('কোড পুনরায় পাঠাতে সমস্যা হয়েছে।', 'Failed to resend OTP.'))
    } finally {
      setResending(false)
    }
  }

  // Submit OTP Verification
  const handleSubmit = async (e) => {
    e.preventDefault()
    const otp = otpDigits.join('').trim()

    if (otp.length < 6) {
      setError(t('৬ ডিজিটের সম্পূর্ণ ওটিপি কোডটি লিখুন', 'Please enter all 6 digits of the OTP'))
      return
    }

    if (countdown === 0) {
      setError(t('কোডের মেয়াদ শেষ হয়ে গেছে। পুনরায় নতুন কোড পাঠান।', 'OTP expired. Please resend a new OTP.'))
      return
    }

    setError('')
    setLoading(true)

    try {
      const otpSession = sessionStorage.getItem('tvs_otp_session') || ''
      const res = await apiVerifyOtp(email, otp, otpSession)
      toast.success(t('ওটিপি যাচাই সফল হয়েছে!', 'OTP verified successfully!'))

      // Navigate to Reset Password page with authorization token
      sessionStorage.setItem('tvs_reset_token', res.resetToken)
      sessionStorage.setItem('tvs_reset_email', email)

      navigate(
        `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(res.resetToken)}`
      )
    } catch (err) {
      console.error('OTP verification failed:', err)
      setError(err.message || t('ওটিপি কোডটি সঠিক নয়।', 'Invalid OTP code.'))
      toast.error(err.message || t('ওটিপি কোডটি সঠিক নয়।', 'Invalid OTP code.'))
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
              {t('ওটিপি কোড যাচাই করুন', 'Verify OTP Code')}
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              {t('আপনার ইমেইলে প্রেরিত ৬ ডিজিটের কোডটি দিন', 'Enter the 6-digit code sent to your email')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Email Badge with Edit Option */}
            <div className="flex items-center justify-between p-2.5 bg-brand-surface rounded-xl border border-outline-variant/50 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate text-brand-dark font-medium">{email}</span>
              </div>
              <Link
                to={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-xs text-brand-fresh hover:underline font-semibold shrink-0 ml-2"
              >
                {t('ইমেইল পরিবর্তন', 'Change')}
              </Link>
            </div>

            {/* 2-Minute Countdown Timer Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                countdown > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 shrink-0 ${
                    countdown > 0 ? 'text-amber-600 animate-pulse' : 'text-red-500'
                  }`}
                />
                <div className="text-xs">
                  {countdown > 0 ? (
                    <>
                      <span className="font-semibold">{t('মেয়াদ বাকি:', 'Expires in:')} </span>
                      <span className="font-mono font-bold text-sm tracking-wider text-amber-700 dark:text-amber-300">
                        {formatTime(countdown)}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {t('২ মিনিট শেষ হয়ে গেছে! পুনরায় কোড পাঠান।', '2 minutes expired! Please resend code.')}
                    </span>
                  )}
                </div>
              </div>

              {/* Resend OTP Button */}
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  countdown === 0 && !resending
                    ? 'bg-primary text-white hover:bg-primary-hover shadow-sm cursor-pointer'
                    : 'text-gray-400 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-60'
                }`}
                title={countdown > 0 ? t('২ মিনিট শেষ হলে পুনরায় পাঠানো যাবে', 'Available after 2 minutes') : ''}
              >
                <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? t('পাঠানো হচ্ছে…', 'Sending…') : t('পুনরায় কোড পাঠান', 'Resend')}</span>
              </button>
            </div>

            {/* 6-Digit OTP Boxes */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-2 text-center">
                {t('৬-ডিজিটের ওটিপি লিখুন', 'Enter 6-Digit OTP')}
              </label>
              <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              {error && <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('যাচাই করা হচ্ছে…', 'Verifying…')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('ওটিপি কোড নিশ্চিত করুন', 'Confirm OTP Code')}</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-dark font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('ইমেইল পেজে ফিরে যান', 'Back to Email Page')}</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

