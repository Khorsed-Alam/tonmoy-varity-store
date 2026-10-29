import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

export default function Footer() {
  const { t } = useLang()

  return (
    <footer className="gradient-brand text-white mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">
                ত
              </div>
              <div>
                <div className="text-xs text-white/70">{t('মেসার্স তন্ময়', 'M/S Tonmoy')}</div>
                <div className="font-bold">{t('ভ্যারাইটি স্টোর', 'Varity Store')}</div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {t(
                'এখানে চাল-ডাল তেল আটা চিনি সহ সকল প্রকার নিত্য প্রয়োজনীয় দ্রব্য সুলভ মূল্যে পাওয়া যায়।',
                'All kinds of daily essentials including rice, dal, oil, flour, sugar available at fair wholesale prices.'
              )}
            </p>
            <div className="mt-3 text-xs text-white/80 bg-white/10 p-2 rounded-lg inline-block">
              <strong>{t('প্রোপাইটার:', 'Proprietor:')}</strong> {t('মোঃ তৌহিদুল ইসলাম বিন্দু', 'Md. Touhidul Islam Bindu')}
            </div>
            <div className="flex gap-3 mt-4">
              <a href="https://wa.me/8801717999460" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                <Phone className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('দ্রুত লিংক', 'Quick Links')}</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white transition-colors">{t('হোম', 'Home')}</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">{t('দোকান', 'Shop')}</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">{t('কার্ট', 'Cart')}</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">{t('আমার অর্ডার', 'My Orders')}</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">{t('প্রোফাইল', 'Profile')}</Link></li>
            </ul>
          </div>

          {/* Delivery Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('ডেলিভারি তথ্য', 'Delivery Info')}</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>{t('হোম ডেলিভারি: ৩০-৬০ মিনিট', 'Home Delivery: 30-60 min')}</li>
              <li>{t('৳৫০০+ অর্ডারে ফ্রি ডেলিভারি', 'Free delivery over ৳500')}</li>
              <li>{t('দোকান থেকে সহজ পিকআপ', 'Store Pickup available')}</li>
              <li>{t('ক্যাশ অন ডেলিভারি', 'Cash on Delivery')}</li>
              <li>{t('দোকানে এসে নগদ পেমেন্ট', 'Pay at Store Counter')}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('দোকানের ঠিকানা', 'Store Address')}</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-secondary-fixed" />
                <span>{t('হাজি ইউসুফ আলী মার্কেট, নারুয়ামালা হাট, গাবতলী, বগুড়া।', 'Haji Yusuf Ali Market, Naruamala Haat, Gabtoli, Bogura.')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-secondary-fixed" />
                <a href="tel:01717999460" className="hover:underline">01717-999460 (WhatsApp)</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-secondary-fixed" />
                <span>info@tonmoystore.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <p>© 2026 {t('মেসার্স তন্ময় ভ্যারাইটি স্টোর', 'M/S Tonmoy Varity Store')}. {t('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}</p>
          <p>{t('গাবতলী, বগুড়া, বাংলাদেশ ❤️', 'Gabtoli, Bogura, Bangladesh ❤️')}</p>
        </div>
      </div>
    </footer>
  )
}
