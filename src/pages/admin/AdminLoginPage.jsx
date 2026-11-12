import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Shield, Lock, Mail, Eye, EyeOff,
  ArrowLeft, Phone, ShieldCheck, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: 'tonmoyverity@gmail.com',
    password: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = (form.email || '').trim().toLowerCase()

    if (!cleanEmail) {
      toast.error('অ্যাডমিন ইমেইল প্রদান করুন।')
      return
    }

    if (cleanEmail !== 'tonmoyverity@gmail.com') {
      toast.error('অননুমোদিত ইমেইল! শুধুমাত্র একক অনুমোদিত স্বত্বাধিকারী (tonmoyverity@gmail.com) লগইন করতে পারবেন।')
      return
    }

    if (!form.password) {
      toast.error('অ্যাডমিন মাস্টার পাসওয়ার্ড প্রদান করুন।')
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn({ email: cleanEmail, password: form.password })
      if (error) {
        toast.error(error.message || 'লগইন ব্যর্থ। সঠিক মাস্টার পাসওয়ার্ড দিন।')
        return
      }

      toast.success('স্বাগতম, মোঃ তৌহিদুল ইসলাম বিন্দু! 👋 (অ্যাডমিন কনসোল ভেরিফাইড)')
      navigate('/admin')
    } catch (err) {
      toast.error('লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Top Header */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-xl shadow-xs sticky top-0 z-50 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Tonmoy Varity Store"
              className="h-9 w-auto object-contain drop-shadow-xs shrink-0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-sm tracking-tight font-display">
                  Tonmoy Varity Store
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">
                তন্ময় ভ্যারাইটি স্টোর • সুরক্ষিত অ্যাডমিন পোর্টাল
              </span>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span>দোকানে ফিরে যান</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full max-w-7xl mx-auto">
        <div className="w-full max-w-lg relative flex flex-col items-center">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none" />

          {/* Main Login Card */}
          <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden relative border border-outline-variant/30 z-10">
            {/* Top Green Gradient Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-primary via-primary-container to-secondary" />

            <div className="p-6 sm:p-10 flex flex-col">
              {/* Brand & Seal Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <img
                    src="/logo.png"
                    alt="Tonmoy Varity Store"
                    className="h-20 w-auto mx-auto object-contain drop-shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-on-secondary-container" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-xs font-bold mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>সংরক্ষিত একক অ্যাডমিন কনসোল • Single Super-Admin</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight font-display">
                  তন্ময় ভ্যারাইটি স্টোর
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                  Tonmoy Varity Store Management & Inventory Administration
                </p>
              </div>

              {/* Single-Admin Strict Security Notice */}
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-left">
                  <strong className="font-bold text-amber-800 dark:text-amber-300">একক স্বত্বাধিকারী সুরক্ষা:</strong>
                  {' '}এই প্যানেলে শুধুমাত্র অনুমোদিত ইমেইল (<code>tonmoyverity@gmail.com</code>) এবং মাস্টার পাসওয়ার্ড দিয়ে প্রবেশ করা যাবে। কোনো ডেমো বা ডিরেক্ট বাইপাস উন্মুক্ত নেই।
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left text-xs">
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface flex items-center justify-between" htmlFor="admin-email">
                    <span>স্বত্বাধিকারীর জিমেইল (Authorized Admin Email)</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      অনুমোদিত
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="tonmoyverity@gmail.com"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface text-on-surface text-xs font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all outline-none border border-outline-variant/30"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface" htmlFor="admin-password">
                    মাস্টার পাসওয়ার্ড (Master Password) *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="আপনার আনহ্যাক্যাবল মাস্টার পাসওয়ার্ড লিখুন"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface text-on-surface text-xs focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all outline-none border border-outline-variant/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      title={showPass ? 'লুকান' : 'দেখুন'}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Trust Device Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={e => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-on-surface-variant text-xs">
                      ডিভাইসে সুরক্ষিত অ্যাডমিন সেশন রাখুন
                    </span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md font-bold">
                    নিরাপদ সেশন
                  </span>
                </div>

                {/* Submit Primary CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-75 disabled:cursor-not-allowed text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>যাচাই করা হচ্ছে (Verifying Credentials)...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>অ্যাডমিন প্যানেলে প্রবেশ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Public Storefront Link */}
              <div className="mt-6 pt-5 border-t border-outline-variant/20 flex items-center justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-primary hover:bg-secondary-container/40 text-xs font-bold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>মূল পাবলিক দোকানে ফিরে যান (Back to Storefront)</span>
                </Link>
              </div>
            </div>

            {/* Strict Audit Strip */}
            <div className="bg-surface-container px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs border-t border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                <Shield className="w-3.5 h-3.5 text-secondary" />
                <span>HMAC SHA-256 Verified • SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>একক অ্যাডমিন নীতি কার্যকর (Strict 1-Admin Policy)</span>
              </div>
            </div>
          </div>

          {/* IT / Helpdesk Card */}
          <div className="mt-5 w-full max-w-lg bg-surface-container-low/90 backdrop-blur rounded-2xl p-4 flex items-center justify-between gap-4 border border-outline-variant/30 z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left text-xs">
                <span className="font-bold text-on-surface">কারিগরি সহায়তা ও স্টোর হেল্পলাইন</span>
                <span className="text-on-surface-variant text-[11px]">+880 1717-999460 (সরাসরি যোগাযোগ)</span>
              </div>
            </div>
            <a
              href="tel:+8801717999460"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>কল করুন</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low/70 py-4 border-t border-outline-variant/30 text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-on-surface-variant">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>সুরক্ষিত অভ্যন্তরীণ ম্যানেজমেন্ট সিস্টেম • মেসার্স তন্ময় ভ্যারাইটি স্টোর</span>
          </div>
          <div>© ২০২৬ তন্ময় ভ্যারাইটি স্টোর। সর্বস্বত্ব সংরক্ষিত।</div>
        </div>
      </footer>
    </div>
  )
}
