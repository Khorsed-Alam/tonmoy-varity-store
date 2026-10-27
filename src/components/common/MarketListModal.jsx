import { useState } from 'react'
import { X, Send, FileText, CheckCircle2 } from 'lucide-react'
import { useLang } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

export default function MarketListModal({ isOpen, onClose }) {
  const { t } = useLang()
  const [listText, setListText] = useState('')
  const [phone, setPhone] = useState('')

  if (!isOpen) return null

  const handleSendWhatsApp = (e) => {
    e.preventDefault()
    if (!listText.trim()) {
      toast.error(t('অনুগ্রহ করে আপনার বাজারের লিস্ট লিখুন', 'Please write your grocery list'))
      return
    }

    const message = `*বাজারের লিস্ট (মেসার্স তন্ময় ভ্যারাইটি স্টোর)*\n\n${listText.trim()}\n\n*গ্রাহকের ফোন:* ${phone || 'N/A'}`
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/8801717999460?text=${encoded}`, '_blank')
    toast.success(t('হোয়াটসঅ্যাপে পাঠানো হচ্ছে...', 'Opening WhatsApp...'))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl border border-outline-variant/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-base">
              {t('বাজারের লিস্ট পাঠান', 'Send Grocery List')}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {t('হাতে লেখা লিস্ট বা মেসেজ দিন, আমরা গুছিয়ে পাঠাবো', 'Write items or paste list, we will prepare it for you')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSendWhatsApp} className="space-y-3 mt-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              {t('বাজারের ফর্দ / আইটেমসমূহ:', 'Grocery Items List:')}
            </label>
            <textarea
              rows={4}
              value={listText}
              onChange={(e) => setListText(e.target.value)}
              placeholder={t(
                'যেমন:\n১. নাজিরশাইল চাল - ৫ কেজি\n২. রূপচাঁদা তেল - ২ লিটার\n৩. মসুর ডাল - ১ কেজি',
                'e.g.:\n1. Nazirshail Rice - 5kg\n2. Rupchanda Oil - 2L\n3. Red Lentils - 1kg'
              )}
              className="w-full text-xs p-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              {t('আপনার মোবাইল নম্বর:', 'Your Phone Number:')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full text-xs p-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{t('মিরপুর এলাকায় ৩০-৬০ মিনিটে হোম ডেলিভারি!', '30-60 min delivery in Mirpur area!')}</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-secondary text-on-secondary rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity"
          >
            <Send className="w-4 h-4" />
            <span>{t('হোয়াটসঅ্যাপে পাঠান (Send via WhatsApp)', 'Send via WhatsApp')}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
