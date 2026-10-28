import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    setAccessDenied(false)

    const { data, error } = await signIn({ email: form.email, password: form.password })
    if (error) {
      setLoading(false)
      setAccessDenied(true)
      toast.error('লগইন ব্যর্থ। ইমেইল বা পাসওয়ার্ড ভুল।')
      return
    }

    // Check admin role
    setTimeout(async () => {
      const { supabase } = await import('../../lib/supabase')
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      setLoading(false)
      if (profile?.role === 'admin') {
        toast.success('স্বাগতম, অ্যাডমিন! 👋')
        navigate('/admin')
      } else {
        const { supabase: sb } = await import('../../lib/supabase')
        await sb.auth.signOut()
        setAccessDenied(true)
        toast.error('অ্যাক্সেস প্রত্যাখ্যাত। শুধুমাত্র অ্যাডমিন প্রবেশ করতে পারবেন।')
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#e7fff1] flex flex-col">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#005128] flex items-center justify-center shadow">
              <span className="text-white text-lg">🏪</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#005128] text-sm tracking-tight">Tonmoy Varity Store</span>
                <span className="px-2 py-0.5 rounded-full bg-[#97f3b5] text-[#047240] text-[10px] font-bold uppercase tracking-wider">Admin</span>
              </div>
              <span className="text-[#404940] text-xs">তন্ময় ভ্যারাইটি স্টোর • পোর্টাল প্রবেশ</span>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#d7f5e4] hover:bg-[#cbe9d9] text-[#052016] text-sm font-semibold transition-colors">
            ← দোকানে ফিরে যান
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Glow effects */}
          <div className="relative">
            <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-[#97f3b5]/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-8 w-60 h-60 rounded-full bg-[#a3f5b6]/25 blur-3xl pointer-events-none" />

            {/* Login Card */}
            <div className="relative z-10 bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Top gradient bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#005128] via-[#176b3a] to-[#006d3d]" />

              <div className="p-8 flex flex-col">
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-xl bg-[#005128] flex items-center justify-center shadow-md">
                      <span className="text-white text-3xl">🛍️</span>
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#97f3b5] flex items-center justify-center shadow-sm">
                      <span className="text-[#047240] text-xs">🛡</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d7f5e4] text-[#005128] text-xs font-bold mb-2">
                    🔒 অভ্যন্তরীণ অ্যাডমিন কনসোল • RBAC Protected
                  </div>
                  <h1 className="font-bold text-xl text-[#052016] tracking-tight">তন্ময় ভ্যারাইটি স্টোর</h1>
                  <p className="text-[#404940] text-sm mt-0.5">Tonmoy Varity Store Management & Administration</p>
                </div>

                {/* Access Denied Alert */}
                {accessDenied && (
                  <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <span className="text-red-500 text-xl shrink-0">⛔</span>
                    <div>
                      <div className="font-bold text-red-700 text-sm">অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে (Access Denied)</div>
                      <div className="text-red-600 text-xs mt-0.5">ভুল ইমেইল বা পাসওয়ার্ড অথবা অ্যাডমিন অনুমতির ঘাটতি।</div>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="mb-5 p-3.5 rounded-lg bg-[#d7f5e4] flex items-start gap-3">
                  <span className="text-[#005128] text-lg shrink-0">🛡️</span>
                  <p className="text-xs text-[#404940] text-left leading-relaxed">
                    <strong className="text-[#005128]">অননুমোদিত প্রবেশ নিষিদ্ধ:</strong> শুধুমাত্র প্রধান স্টোর অ্যাডমিনিস্ট্রেটর দ্বারা তৈরি প্রি-কনফিগারড ক্রেডেনশিয়াল অনুমোদিত।
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#052016] flex items-center justify-between" htmlFor="admin-email">
                      <span>অ্যাডমিন ইমেইল (Admin Email)</span>
                      <span className="text-[#404940] text-xs font-normal">প্রয়োজনীয়</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[#404940] text-lg">✉️</span>
                      <input
                        id="admin-email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full h-12 pl-11 pr-4 rounded-lg bg-[#e7fff1] border border-[#bfc9bd] text-[#052016] text-sm focus:outline-none focus:ring-2 focus:ring-[#005128]/30 focus:bg-white transition-all"
                        placeholder="admin@tonmoystore.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#052016]" htmlFor="admin-password">
                      গোপন পাসওয়ার্ড (Password)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[#404940] text-lg">🔒</span>
                      <input
                        id="admin-password"
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full h-12 pl-11 pr-12 rounded-lg bg-[#e7fff1] border border-[#bfc9bd] text-[#052016] text-sm focus:outline-none focus:ring-2 focus:ring-[#005128]/30 focus:bg-white transition-all"
                        placeholder="পাসওয়ার্ড প্রদান করুন"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 w-8 h-8 rounded-lg flex items-center justify-center text-[#404940] hover:text-[#005128] hover:bg-[#d7f5e4] transition-colors"
                      >
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Remember device */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={e => setRememberDevice(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#005128] cursor-pointer"
                      />
                      <span className="text-xs text-[#404940]">বিশ্বস্ত ডিভাইসে সেশন স্মরণ রাখুন</span>
                    </label>
                    <span className="hidden sm:inline text-xs text-[#404940] bg-[#d7f5e4] px-2 py-0.5 rounded">২৪ ঘণ্টা</span>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-lg bg-[#005128] hover:bg-[#176b3a] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>যাচাই করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>🔓 লগইন করুন (Sign In to Console)</>
                    )}
                  </button>
                </form>

                {/* Back link */}
                <div className="mt-6 pt-5 border-t border-[#d7f5e4] flex items-center justify-center">
                  <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[#005128] hover:bg-[#d7f5e4] text-sm font-semibold transition-colors">
                    ← মূল পাবলিক দোকানে ফিরে যান
                  </Link>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-[#d7f5e4] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#404940] text-xs">
                  🔐 <span>SSL 256-bit Encrypted • Supabase Auth</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#404940] text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#006d3d] inline-block" />
                  <span>অডিট লগ সক্রিয়</span>
                </div>
              </div>
            </div>

            {/* Support card */}
            <div className="mt-5 bg-white/80 backdrop-blur rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#d7f5e4] flex items-center justify-center text-[#005128] shrink-0 text-lg">
                  🎧
                </div>
                <div>
                  <div className="font-semibold text-[#052016] text-sm">কারিগরি সহায়তা ও স্টাফ অ্যাক্সেস</div>
                  <div className="text-[#404940] text-xs">পাসওয়ার্ড হারানো বা অ্যাকাউন্ট লক হলে সিস্টেম এডমিনের সাথে যোগাযোগ করুন</div>
                </div>
              </div>
              <a href="tel:+8801717999460" className="shrink-0 px-3 py-1.5 rounded-lg bg-[#d7f5e4] hover:bg-[#cbe9d9] text-[#005128] text-xs font-bold flex items-center gap-1 transition-colors">
                📞 হেল্পডেস্ক
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/70 py-5 border-t border-[#d7f5e4]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <div className="flex items-center gap-2 text-[#404940] text-xs">
            ✅ <span>সুরক্ষিত অভ্যন্তরীণ ম্যানেজমেন্ট সিস্টেম • অননুমোদিত প্রবেশ নিষিদ্ধ</span>
          </div>
          <div className="text-[#404940] text-xs">© ২০২৫ তন্ময় ভ্যারাইটি স্টোর</div>
        </div>
      </footer>
    </div>
  )
}
