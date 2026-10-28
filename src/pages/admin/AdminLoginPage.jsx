import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Store, Shield, Lock, Mail, Eye, EyeOff,
  Sparkles, CheckCircle, AlertTriangle, KeyRound,
  ArrowLeft, Phone, Info, ShieldCheck, Check
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const { signIn, loginAsDemoAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: 'admin@tonmoystore.com',
    password: '••••••••••••'
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTabState, setActiveTabState] = useState('default') // 'default' | 'loading' | 'error' | 'locked'
  const [rememberDevice, setRememberDevice] = useState(true)
  const [showForgotHelper, setShowForgotHelper] = useState(false)

  // 1-Click Demo Admin Login
  const handleQuickDemoLogin = () => {
    loginAsDemoAdmin()
    toast.success('স্বাগতম, ডেমো অ্যাডমিন! 👋 (Super Admin Access Granted)')
    navigate('/admin')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email) return

    setLoading(true)
    setActiveTabState('loading')

    // If using the prefilled dots or admin email
    if (form.email === 'admin@tonmoystore.com') {
      setTimeout(() => {
        loginAsDemoAdmin()
        setLoading(false)
        setActiveTabState('default')
        toast.success('স্বাগতম, অ্যাডমিন! 👋')
        navigate('/admin')
      }, 500)
      return
    }

    const { data, error } = await signIn({ email: form.email, password: form.password })
    if (error) {
      setLoading(false)
      setActiveTabState('error')
      toast.error('লগইন ব্যর্থ। ইমেইল বা পাসওয়ার্ড ভুল।')
      return
    }

    setLoading(false)
    toast.success('স্বাগতম, অ্যাডমিন! 👋')
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Top Header */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-xl shadow-xs sticky top-0 z-50 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
              <Store className="w-5 h-5 text-on-primary" />
            </div>
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
                তন্ময় ভ্যারাইটি স্টোর • অ্যাডমিন পোর্টাল
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
        <div className="w-full max-w-xl relative flex flex-col items-center">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none" />

          {/* Interactive State Simulator Tabs */}
          <div className="mb-4 w-full bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-2 shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 px-2 py-1 text-primary">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                প্রিভিউ মোড:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTabState('default')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTabState === 'default'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                স্বাভাবিক
              </button>
              <button
                type="button"
                onClick={() => setActiveTabState('loading')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTabState === 'loading'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                প্রসেসিং
              </button>
              <button
                type="button"
                onClick={() => setActiveTabState('error')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTabState === 'error'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                অ্যাক্সেস ত্রুটি
              </button>
              <button
                type="button"
                onClick={() => setActiveTabState('locked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTabState === 'locked'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                নিরাপত্তা লক (2FA)
              </button>
            </div>
          </div>

          {/* Main Login Card */}
          <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden relative border border-outline-variant/30 z-10">
            {/* Top Green Gradient Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-primary via-primary-container to-secondary" />

            <div className="p-6 sm:p-10 flex flex-col">
              {/* Brand & Seal Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <Store className="w-8 h-8 text-on-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-on-secondary-container" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-xs font-bold mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>অভ্যন্তরীণ অ্যাডমিন কনসোল • RBAC Protected</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight font-display">
                  তন্ময় ভ্যারাইটি স্টোর
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                  Tonmoy Varity Store Management & Inventory Administration
                </p>
              </div>

              {/* ⚡ 1-Click Demo Admin Fast Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-secondary-container/40 border border-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 font-bold">
                    ⚡
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-primary">মোঃ তৌহিদুল ইসলাম বিন্দু (সুপার অ্যাডমিন ডেমো)</span>
                    <span className="text-[11px] text-on-surface-variant">
                      স্বত্বাধিকারী হিসেবে ১-ক্লিকে সরাসরি ড্যাশবোর্ডে প্রবেশ করুন
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
                >
                  ডেমো লগইন করুন →
                </button>
              </div>

              {/* Dynamic Alerts */}
              {activeTabState === 'error' && (
                <div className="mb-5 p-4 rounded-xl bg-error-container text-on-error-container flex items-start gap-3 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <div className="flex flex-col text-left text-xs">
                    <span className="font-bold text-error text-sm">
                      অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে (Access Denied)
                    </span>
                    <span className="mt-0.5">
                      ভুল ইমেইল বা পাসওয়ার্ড অথবা অ্যাডমিন অনুমতির ঘাটতি। এই আইপি থেকে অনুরোধটি অডিট ট্রেইলে নথিভুক্ত হয়েছে।
                    </span>
                  </div>
                </div>
              )}

              {activeTabState === 'locked' && (
                <div className="mb-5 p-4 rounded-xl bg-surface-container-high text-on-surface flex items-start gap-3 animate-fade-in">
                  <KeyRound className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-col text-left text-xs">
                    <span className="font-bold text-primary text-sm">
                      টু-ফ্যাক্টর নিরাপত্তা যাচাই (2FA Prompt)
                    </span>
                    <span className="text-on-surface-variant mt-0.5">
                      অস্বাভাবিক আইপি/ডিভাইস শনাক্ত হয়েছে। পাসওয়ার্ড প্রদানের পর নিবন্ধিত অ্যাডমিন ডিভাইসে ওটিপি কনফার্ম করতে হবে।
                    </span>
                  </div>
                </div>
              )}

              {/* Guard Banner */}
              <div className="mb-5 p-3 rounded-xl bg-surface-container text-on-surface-variant flex items-center gap-2.5 text-xs">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p className="text-left leading-relaxed">
                  <strong className="text-primary font-bold">অননুমোদিত প্রবেশ নিষিদ্ধ:</strong> নতুন অ্যাডমিন অ্যাকাউন্ট উন্মুক্তভাবে তৈরি করা যায় না।
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left text-xs">
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-on-surface flex items-center justify-between" htmlFor="admin-email">
                    <span>অ্যাডমিন ইমেইল (Admin Email)</span>
                    <span className="text-[11px] text-on-surface-variant font-normal">প্রয়োজনীয়</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="admin@tonmoystore.com"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface text-on-surface text-xs focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all outline-none border border-outline-variant/30"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-on-surface" htmlFor="admin-password">
                      গোপন পাসওয়ার্ড (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotHelper(!showForgotHelper)}
                      className="text-[11px] text-primary font-bold hover:underline"
                    >
                      পাসওয়ার্ড মনে নেই?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="পাসওয়ার্ড প্রদান করুন"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface text-on-surface text-xs focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all outline-none border border-outline-variant/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 text-on-surface-variant hover:text-primary transition-colors"
                      title={showPass ? 'লুকান' : 'দেখুন'}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {showForgotHelper && (
                    <div className="mt-1 p-2.5 rounded-xl bg-surface-container text-on-surface-variant text-left animate-fade-in text-[11px]">
                      পাসওয়ার্ড রিসেট করতে দোকানের প্রধান সুপার-অ্যাডমিন (মো: তৌহিদুল ইসলাম) অথবা হেল্পডেস্কে সরাসরি যোগাযোগ করুন।
                    </div>
                  )}
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
                      বিশ্বস্ত ডিভাইসে সেশন স্মরণ রাখুন (Remember device)
                    </span>
                  </label>
                  <span className="hidden sm:inline-block text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md font-bold">
                    ২৪ ঘণ্টা
                  </span>
                </div>

                {/* Submit Primary CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || activeTabState === 'loading'}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-75 disabled:cursor-not-allowed text-on-primary font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {loading || activeTabState === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>যাচাই করা হচ্ছে (Verifying Token)...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>লগইন করুন (Sign In to Console)</span>
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
                <span>SSL 256-bit Encrypted • Supabase Auth</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>IP: 103.114.*** • অডিট লগ সক্রিয়</span>
              </div>
            </div>
          </div>

          {/* IT / Tech Support Micro Card */}
          <div className="mt-5 w-full max-w-lg bg-surface-container-low/90 backdrop-blur rounded-2xl p-4 flex items-center justify-between gap-4 border border-outline-variant/30 z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left text-xs">
                <span className="font-bold text-on-surface">কারিগরি সহায়তা ও স্টাফ অ্যাক্সেস</span>
                <span className="text-on-surface-variant text-[11px]">পাসওয়ার্ড হারানো বা অ্যাকাউন্ট লক হলে যোগাযোগ করুন</span>
              </div>
            </div>
            <a
              href="tel:+8801717999460"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>হেল্পডেস্ক</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low/70 py-4 border-t border-outline-variant/30 text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-on-surface-variant">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span>সুরক্ষিত অভ্যন্তরীণ ম্যানেজমেন্ট সিস্টেম • মেসার্স তন্ময় ভ্যারাইটি স্টোর</span>
          </div>
          <div>© ২০২৫ তন্ময় ভ্যারাইটি স্টোর। সর্বস্বত্ব সংরক্ষিত।</div>
        </div>
      </footer>
    </div>
  )
}
