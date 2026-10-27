import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LanguageContext'
import { User, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = t('নাম প্রয়োজন', 'Name is required')
    if (form.phone && !/^(\+880|880|0)?1[3-9]\d{8}$/.test(form.phone.trim()))
      e.phone = t('সঠিক ফোন নম্বর দিন', 'Enter valid BD phone')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    // Explicitly exclude role from updates - customers cannot update their own role
    const { full_name, phone, address } = form
    const { error } = await updateProfile({ full_name, phone, address })
    setLoading(false)
    if (error) {
      toast.error(t('প্রোফাইল আপডেট ব্যর্থ', 'Failed to update profile'))
    } else {
      setSaved(true)
      toast.success(t('প্রোফাইল আপডেট হয়েছে!', 'Profile updated!'))
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="page-container py-8 animate-fade-in">
      <h1 className="section-title">{t('আমার প্রোফাইল', 'My Profile')}</h1>
      <p className="section-subtitle">{t('আপনার তথ্য আপডেট করুন', 'Update your personal information')}</p>

      <div className="max-w-lg">
        <div className="card p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-brand-dark text-lg">{profile?.full_name || t('ব্যবহারকারী', 'User')}</div>
              <div className="text-brand-muted text-sm">{user?.email}</div>
              {profile?.role === 'admin' && (
                <span className="badge bg-brand-dark text-white mt-1">{t('অ্যাডমিন', 'Admin')}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('পূর্ণ নাম', 'Full Name')} *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className={`input-field pl-10 ${errors.full_name ? 'border-red-400' : ''}`}
                  placeholder={t('আপনার নাম', 'Your name')} />
              </div>
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('মোবাইল নম্বর', 'Phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={`input-field pl-10 ${errors.phone ? 'border-red-400' : ''}`}
                  placeholder="01XXXXXXXXX" />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('ঠিকানা', 'Address')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea rows={3} value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="input-field pl-10 resize-none"
                  placeholder={t('আপনার ঠিকানা', 'Your address')} />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1.5">{t('ইমেইল', 'Email')}</label>
              <input type="email" value={user?.email || ''} disabled
                className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-brand-muted mt-1">{t('ইমেইল পরিবর্তন করা যাবে না', 'Email cannot be changed')}</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
              {loading ? t('সংরক্ষণ হচ্ছে…', 'Saving…') : t('সংরক্ষণ করুন', 'Save Changes')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
