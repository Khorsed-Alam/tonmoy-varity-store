import { useState } from 'react'
import { useLang } from '../../context/LanguageContext'
import {
  Store, Truck, Phone, MapPin, Clock, Loader2, Save,
  CreditCard, Bell, Shield, CheckCircle, Smartphone
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { t } = useLang()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    store_name: 'তন্ময় ভ্যারাইটি স্টোর',
    store_name_en: 'Tonmoy Varity Store',
    proprietor: 'মোঃ তৌহিদুল ইসলাম বিন্দু',
    phone: '০১৭১৭-৯৯৯৪৬০',
    alt_phone: '০১৭০৭-৮৮০৫৬৯',
    address: 'হাজী ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া',
    delivery_fee: '৫০',
    free_delivery_threshold: '৫০০',
    min_order_amount: '১০০',
    open_hours: 'শনিবার – শুক্রবার: সকাল ৭:৩০ – রাত ১০:৩০',
    home_delivery_enabled: true,
    store_pickup_enabled: true,
    cod_enabled: true,
    bkash_enabled: true,
    low_stock_threshold: '৫',
    whatsapp_receipt_enabled: true,
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast.success('শপ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!')
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display">
            দোকান ও সিস্টেম সেটিংস (Store Settings)
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            তন্ময় ভ্যারাইটি স্টোরের ঠিকানা, ডেলিভারি চার্জ ও পেমেন্ট চ্যানেল কনফিগার করুন
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95 self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'সংরক্ষণ হচ্ছে…' : 'সেটিংস সংরক্ষণ করুন'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Store Profile Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-on-surface font-display">স্টোর প্রোফাইল ও যোগাযোগ</h2>
              <p className="text-[11px] text-on-surface-variant">দোকানের লাইসেন্সকৃত নাম ও যোগাযোগের মোবাইল নম্বর</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface mb-1">দোকানের নাম (বাংলা) *</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={e => setSettings(s => ({ ...s, store_name: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">Store Name (English) *</label>
              <input
                type="text"
                value={settings.store_name_en}
                onChange={e => setSettings(s => ({ ...s, store_name_en: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">স্বত্বাধিকারী / প্রোপ্রাইটার</label>
              <input
                type="text"
                value={settings.proprietor}
                onChange={e => setSettings(s => ({ ...s, proprietor: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-secondary" /> প্রধান হেল্পলাইন নম্বর
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-secondary" /> বিকাশ / নগদ হেল্পলাইন
              </label>
              <input
                type="text"
                value={settings.alt_phone}
                onChange={e => setSettings(s => ({ ...s, alt_phone: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-secondary" /> দোকান খোলা ও সেবা সময়
              </label>
              <input
                type="text"
                value={settings.open_hours}
                onChange={e => setSettings(s => ({ ...s, open_hours: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-on-surface mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-secondary" /> দোকানের পূর্ণাঙ্গ ঠিকানা
              </label>
              <textarea
                rows={2}
                value={settings.address}
                onChange={e => setSettings(s => ({ ...s, address: e.target.value }))}
                className="w-full p-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Delivery & Logistics Settings */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-on-surface font-display">ডেলিভারি চার্জ ও শর্তাবলী</h2>
              <p className="text-[11px] text-on-surface-variant">হোম ডেলিভারি খরচ ও ফ্রি ডেলিভারি অফার নির্ধারণ</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-on-surface mb-1">স্ট্যান্ডার্ড ডেলিভারি চার্জ (BDT ৳)</label>
              <input
                type="text"
                value={settings.delivery_fee}
                onChange={e => setSettings(s => ({ ...s, delivery_fee: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">ফ্রি ডেলিভারির ন্যূনতম সীমা (৳)</label>
              <input
                type="text"
                value={settings.free_delivery_threshold}
                onChange={e => setSettings(s => ({ ...s, free_delivery_threshold: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1">সর্বনিম্ন অর্ডারের পরিমাণ (৳)</label>
              <input
                type="text"
                value={settings.min_order_amount}
                onChange={e => setSettings(s => ({ ...s, min_order_amount: e.target.value }))}
                className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {[
              { key: 'home_delivery_enabled', label: 'হোম ডেলিভারি সেবা সক্রিয় রাখুন' },
              { key: 'store_pickup_enabled', label: 'দোকান থেকে সরাসরি পিকআপ সক্রিয় রাখুন' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                  className="accent-primary w-4 h-4 rounded"
                />
                <span className="text-xs font-semibold text-on-surface">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Methods & Notifications */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-on-surface font-display">পেমেন্ট গেটওয়ে ও অটোমেশন</h2>
              <p className="text-[11px] text-on-surface-variant">ক্যাশ অন ডেলিভারি এবং বিকাশ পেমেন্ট চ্যানেল কনফিগারেশন</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'cod_enabled', label: 'ক্যাশ অন ডেলিভারি (COD) পেমেন্ট চালু রাখুন' },
              { key: 'bkash_enabled', label: 'বিকাশ ও ডিজিটাল মোবাইল ব্যাংকিং চালু রাখুন' },
              { key: 'whatsapp_receipt_enabled', label: 'অর্ডার কনফার্মেশনের পর WhatsApp রশিদ পাঠানো' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={e => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                  className="accent-primary w-4 h-4 rounded"
                />
                <span className="text-xs font-semibold text-on-surface">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>সেটিংস সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>
    </div>
  )
}
