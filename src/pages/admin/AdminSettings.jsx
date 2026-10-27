import { useState } from 'react'
import { useLang } from '../../contexts/LanguageContext'
import { Store, Truck, Phone, MapPin, Clock, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const { t } = useLang()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    store_name: 'তন্ময় ভ্যারাইটি স্টোর',
    store_name_en: 'Tonmoy Varity Store',
    phone: '+880 1XXX-XXXXXX',
    address: 'ঢাকা, বাংলাদেশ',
    delivery_fee: '50',
    free_delivery_threshold: '500',
    open_hours: 'শনি – বৃহস্পতিবার: সকাল ৮টা – রাত ১০টা',
    home_delivery_enabled: true,
    store_pickup_enabled: true,
    cod_enabled: true,
    pay_at_store_enabled: true,
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    // In production, these would be stored in a settings table
    // For now we simulate success
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('সেটিংস সংরক্ষণ হয়েছে!')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">শপ সেটিংস</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Store Info */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4" /> স্টোর তথ্য
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">স্টোরের নাম (বাংলা)</label>
              <input value={settings.store_name} onChange={e => setSettings(s => ({ ...s, store_name: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name (English)</label>
              <input value={settings.store_name_en} onChange={e => setSettings(s => ({ ...s, store_name_en: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> ফোন নম্বর</label>
              <input value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> খোলার সময়</label>
              <input value={settings.open_hours} onChange={e => setSettings(s => ({ ...s, open_hours: e.target.value }))} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> ঠিকানা</label>
              <textarea rows={2} value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} className="input-field resize-none" />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4" /> ডেলিভারি সেটিংস
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ডেলিভারি চার্জ (৳)</label>
              <input type="number" min="0" value={settings.delivery_fee} onChange={e => setSettings(s => ({ ...s, delivery_fee: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ফ্রি ডেলিভারির সীমা (৳)</label>
              <input type="number" min="0" value={settings.free_delivery_threshold} onChange={e => setSettings(s => ({ ...s, free_delivery_threshold: e.target.value }))} className="input-field" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {[
              { key: 'home_delivery_enabled', label: 'হোম ডেলিভারি সক্রিয়' },
              { key: 'store_pickup_enabled', label: 'স্টোর পিকআপ সক্রিয়' },
              { key: 'cod_enabled', label: 'ক্যাশ অন ডেলিভারি সক্রিয়' },
              { key: 'pay_at_store_enabled', label: 'স্টোরে পেমেন্ট সক্রিয়' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))} className="accent-brand-fresh w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'সংরক্ষণ হচ্ছে…' : 'সেটিংস সংরক্ষণ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
