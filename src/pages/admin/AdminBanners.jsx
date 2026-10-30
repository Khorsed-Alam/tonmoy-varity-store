import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Image as ImageIcon, Plus, Trash2, Edit2, CheckCircle2,
  AlertCircle, Eye, ArrowUp, ArrowDown, ExternalLink,
  Sparkles, Upload, Link as LinkIcon, RefreshCw, X, ChevronLeft, ChevronRight, Sliders
} from 'lucide-react'
import { bannerService, DEFAULT_BANNERS } from '../../services/bannerService'
import { uploadService } from '../../services/uploadService'
import { useBannerSync } from '../../lib/syncEvents'
import { useLang } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

// Curated festive & grocery promo templates for instant 1-click creation
const PRESET_TEMPLATES = [
  {
    name: 'শুক্রবার স্পেশাল অফার',
    badge_text_bn: 'শুক্রবার স্পেশাল',
    badge_text: 'Friday Offer',
    title_bn: 'শুক্রবার স্পেশাল ধামাকা অফার',
    title: 'Friday Special Offer',
    subtitle_bn: 'খাঁটি সরিষার তেল, সয়াবিন তেল, মসলা ও ডালের ওপর বিশেষ ছাড়!',
    subtitle: 'Special discounts on cooking oil, spices, and groceries every Friday!',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    link_url: '/shop/category/cooking-essentials',
    button_text_bn: 'অফার দেখুন',
    button_text: 'View Offers',
  },
  {
    name: 'ঈদ স্পেশাল মেগা অফার',
    badge_text_bn: 'ঈদ মোবারক',
    badge_text: 'Eid Mubarak',
    title_bn: 'ঈদ স্পেশাল ধামাকা অফার',
    title: 'Eid Special Offer',
    subtitle_bn: 'পোলাও চাল, লাচ্ছা সেমাই, গুঁড়ো দুধ ও খাঁটি ঘিয়ে আকর্ষণীয় মূল্যছাড়!',
    subtitle: 'Mega discount on Polao Rice, Lachha Semai, Milk Powder, and Pure Ghee!',
    image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=1200&q=80',
    link_url: '/shop/category/snacks-beverages',
    button_text_bn: 'ঈদ অফার নিন',
    button_text: 'Get Eid Offer',
  },
  {
    name: 'রমজান মাস মাহে রমজান অফার',
    badge_text_bn: 'রমজানুল মোবারক',
    badge_text: 'Ramadan Special',
    title_bn: 'পবিত্র মাহে রমজান ইফতার ও সেহরি বাজার',
    title: 'Holy Ramadan Iftar & Sehri Bazaar',
    subtitle_bn: 'খেজুর, ছোলা, বেসন, ট্যাং, চিঁড়া ও সকল ইফতার সামগ্রী পাইকারি মূল্যে!',
    subtitle: 'Dates, chickpeas, gram flour, and all Iftar items at best wholesale prices!',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80',
    link_url: '/shop/category/cooking-essentials',
    button_text_bn: 'ইফতার সামগ্রী কিনুন',
    button_text: 'Shop Iftar Items',
  },
  {
    name: 'সকালের তাজা ডিম-দুধ ও নাস্তা',
    badge_text_bn: 'সকালের তাজা বাজার',
    badge_text: 'Daily Fresh',
    title_bn: 'সকালের তাজা ডিম, দুধ ও নাস্তার সামগ্রী',
    title: 'Fresh Milk, Eggs & Morning Breakfast',
    subtitle_bn: 'প্রতিদিন সকাল সকাল খাঁটি দুধ ও তাজা ডিম ৩০ মিনিটে সরাসরি ঘরে!',
    subtitle: 'Fresh farm eggs and pure milk delivered to your door in 30 minutes!',
    image_url: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=1200&q=80',
    link_url: '/shop/category/dairy-eggs',
    button_text_bn: 'ডিম ও দুধ কিনুন',
    button_text: 'Shop Dairy & Eggs',
  },
  {
    name: 'মেসার্স তন্ময় ভ্যারাইটি স্টোর অফিসিয়াল',
    badge_text_bn: 'অফিসিয়াল স্টোর',
    badge_text: 'Official Store',
    title_bn: 'মেসার্স তন্ময় ভ্যারাইটি স্টোর',
    title: 'Tonmoy Variety Store',
    subtitle_bn: 'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন এক জায়গায়!',
    subtitle: 'All your daily essentials now in one place!',
    image_url: '/images/tonmoy-variety-store-hero-banner.jpg',
    link_url: '/shop',
    button_text_bn: 'বাজার করুন',
    button_text: 'Shop Now',
  },
]

export default function AdminBanners() {
  const { t } = useLang()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewSlide, setPreviewSlide] = useState(0)

  // Form State
  const [form, setForm] = useState({
    title_bn: '',
    title: '',
    subtitle_bn: '',
    subtitle: '',
    badge_text_bn: 'বিশেষ অফার',
    badge_text: 'Special Offer',
    image_url: '',
    link_url: '/shop',
    button_text_bn: 'বাজার করুন',
    button_text: 'Shop Now',
    sort_order: 1,
    is_active: true,
  })

  const fileInputRef = useRef(null)

  // Load Banners
  const loadBanners = useCallback(async () => {
    try {
      setLoading(true)
      const data = await bannerService.getBanners({ activeOnly: false })
      setBanners(data)
    } catch (err) {
      console.error('Error loading banners:', err)
      toast.error('ব্যানার লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  // Real-time synchronization hook
  useBannerSync(loadBanners)

  // Auto-play for the Live Preview Carousel (every 4 seconds)
  useEffect(() => {
    const activeBanners = banners.filter(b => b.is_active)
    if (activeBanners.length <= 1) return
    const timer = setInterval(() => {
      setPreviewSlide(prev => (prev + 1) % activeBanners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [banners])

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingBanner(null)
    setForm({
      title_bn: '',
      title: '',
      subtitle_bn: '',
      subtitle: '',
      badge_text_bn: 'বিশেষ অফার',
      badge_text: 'Special Offer',
      image_url: '',
      link_url: '/shop',
      button_text_bn: 'বাজার করুন',
      button_text: 'Shop Now',
      sort_order: (banners.length || 0) + 1,
      is_active: true,
    })
    setIsModalOpen(true)
  }

  // Open Modal for Edit
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner)
    setForm({
      title_bn: banner.title_bn || '',
      title: banner.title || '',
      subtitle_bn: banner.subtitle_bn || '',
      subtitle: banner.subtitle || '',
      badge_text_bn: banner.badge_text_bn || 'বিশেষ অফার',
      badge_text: banner.badge_text || 'Special Offer',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '/shop',
      button_text_bn: banner.button_text_bn || 'বাজার করুন',
      button_text: banner.button_text || 'Shop Now',
      sort_order: banner.sort_order || 1,
      is_active: banner.is_active !== false,
    })
    setIsModalOpen(true)
  }

  // Apply a Preset Template
  const handleApplyTemplate = (tpl) => {
    setForm(prev => ({
      ...prev,
      title_bn: tpl.title_bn,
      title: tpl.title,
      subtitle_bn: tpl.subtitle_bn,
      subtitle: tpl.subtitle,
      badge_text_bn: tpl.badge_text_bn,
      badge_text: tpl.badge_text,
      image_url: tpl.image_url,
      link_url: tpl.link_url,
      button_text_bn: tpl.button_text_bn,
      button_text: tpl.button_text,
    }))
    toast.success(`"${tpl.name}" টেমপ্লেট নির্বাচন করা হয়েছে`)
  }

  // Handle Image File Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const res = await uploadService.uploadBannerImage(file)
      if (res?.url) {
        setForm(prev => ({ ...prev, image_url: res.url }))
        toast.success(res.fromStorage ? 'ছবি Supabase Storage-এ আপলোড সম্পন্ন!' : 'ছবি নির্বাচন সম্পন্ন!')
      }
    } catch (err) {
      console.error('Image upload failed:', err)
      toast.error('ছবি আপলোডে সমস্যা হয়েছে। সরাসরি ইমেজ লিঙ্কও ব্যবহার করতে পারেন।')
    } finally {
      setUploadingImage(false)
    }
  }

  // Save Banner (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title_bn.trim()) {
      toast.error('ব্যানারের বাংলা শিরোনাম লিখুন')
      return
    }
    if (!form.image_url.trim()) {
      toast.error('ব্যানারের ছবি আপলোড করুন অথবা ছবির লিঙ্ক দিন')
      return
    }

    try {
      setSaving(true)
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, form)
        toast.success('ব্যানার সফলভাবে আপডেট করা হয়েছে!')
      } else {
        await bannerService.createBanner(form)
        toast.success('নতুন ব্যানার সফলভাবে প্রকাশ করা হয়েছে!')
      }
      setIsModalOpen(false)
      loadBanners()
    } catch (err) {
      console.error('Error saving banner:', err)
      toast.error('ব্যানার সংরক্ষণ করতে সমস্যা হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  // Delete Banner
  const handleDelete = async (id) => {
    try {
      await bannerService.deleteBanner(id)
      toast.success('ব্যানার মুছে ফেলা হয়েছে')
      setDeleteConfirmId(null)
      loadBanners()
    } catch (err) {
      console.error('Error deleting banner:', err)
      toast.error('ব্যানার মুছতে সমস্যা হয়েছে')
    }
  }

  // Toggle Active State
  const handleToggleActive = async (banner) => {
    try {
      await bannerService.toggleActive(banner.id, banner.is_active)
      toast.success(banner.is_active ? 'ব্যানার নিষ্ক্রিয় করা হয়েছে' : 'ব্যানার সক্রিয় করা হয়েছে')
      loadBanners()
    } catch (err) {
      console.error('Toggle active error:', err)
      toast.error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে')
    }
  }

  // Move banner order Up/Down
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= banners.length) return

    const newBanners = [...banners]
    const temp = newBanners[index]
    newBanners[index] = newBanners[targetIndex]
    newBanners[targetIndex] = temp

    // Update sort_order values
    const updated = newBanners.map((b, idx) => ({ ...b, sort_order: idx + 1 }))
    setBanners(updated)

    try {
      await Promise.all([
        bannerService.updateBanner(updated[index].id, { sort_order: index + 1 }),
        bannerService.updateBanner(updated[targetIndex].id, { sort_order: targetIndex + 1 })
      ])
      toast.success('ক্রম পরিবর্তিত হয়েছে')
    } catch (err) {
      console.error('Order change error:', err)
    }
  }

  const activeBanners = banners.filter(b => b.is_active)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-card border border-outline-variant/40">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              ব্যানার ও অফার ব্যবস্থাপনা
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            হোমপেজের হিরো ব্যানার সেকশনে শুক্রবার স্পেশাল অফার, ঈদ স্পেশাল মেগা অফার বা যেকোনো উৎসবের অফার ব্যানার যোগ করুন, ডিলিট করুন এবং একাধিক ব্যানার একটার পর একটা স্বয়ংক্রিয়ভাবে প্রদর্শন করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadBanners}
            className="p-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface-container text-on-surface transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-card hover:shadow-card-hover transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্যানার আপলোড করুন</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            {banners.length}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">মোট ব্যানার</p>
            <p className="text-sm font-bold text-on-surface">{banners.length} টি ব্যানার</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
            {activeBanners.length}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">হোমপেজে সক্রিয়</p>
            <p className="text-sm font-bold text-emerald-700">{activeBanners.length} টি প্রদর্শন হচ্ছে</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            {banners.length - activeBanners.length}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">নিষ্ক্রিয় / ড্রাফট</p>
            <p className="text-sm font-bold text-on-surface">{banners.length - activeBanners.length} টি লুকানো</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">স্লাইডার গতি</p>
            <p className="text-sm font-bold text-sky-800">প্রতি ৫ সেকেন্ডে স্লাইড</p>
          </div>
        </div>
      </div>

      {/* 3. Live Customer Storefront Preview */}
      {activeBanners.length > 0 && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface">
                হোমপেজ লাইভ প্রিভিউ (কাস্টমার যেভাবে দেখবেন)
              </h2>
            </div>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
              {activeBanners.length} টি ব্যানার ক্রমান্বয়ে ঘুরছে
            </span>
          </div>

          {/* Simulated Banner Container */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/50 bg-gradient-to-r from-[#e1f3f7] via-[#ebf7fa] to-[#e1f3f7] group">
            {activeBanners[previewSlide] && (
              <div className="relative">
                <img
                  src={activeBanners[previewSlide].image_url}
                  alt={activeBanners[previewSlide].title_bn}
                  className="w-full max-h-[280px] sm:max-h-[320px] object-contain mx-auto transition-all duration-700"
                />

                {/* Offer Floating Badge */}
                {activeBanners[previewSlide].badge_text_bn && (
                  <div className="absolute top-3 left-3 bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{activeBanners[previewSlide].badge_text_bn}</span>
                  </div>
                )}
              </div>
            )}

            {/* Slider Navigation Arrows */}
            {activeBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPreviewSlide(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1))}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSlide(prev => (prev + 1) % activeBanners.length)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slider Dots Indicator */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {activeBanners.map((b, idx) => (
                    <button
                      key={b.id || idx}
                      type="button"
                      onClick={() => setPreviewSlide(idx)}
                      className={`transition-all rounded-full ${
                        previewSlide === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Banner List & Management Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-primary" />
            <h2 className="text-base font-bold text-on-surface">সকল ব্যানার তালিকা</h2>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            ড্র্যাগ বা বাটন দিয়ে ক্রম পরিবর্তন করুন
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">ব্যানার লোড হচ্ছে...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant space-y-3">
            <ImageIcon className="w-12 h-12 mx-auto text-outline-variant" />
            <p className="text-base font-semibold text-on-surface">কোনো ব্যানার পাওয়া যায়নি</p>
            <p className="text-xs max-w-sm mx-auto">
              হোমপেজে আকর্ষণীয় অফার প্রদর্শন করতে "নতুন ব্যানার আপলোড করুন" বাটনে ক্লিক করুন।
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>প্রথম ব্যানার তৈরি করুন</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  banner.is_active ? 'hover:bg-surface-container-low/40' : 'bg-surface-container-low/60 opacity-75'
                }`}
              >
                {/* Banner Thumbnail & Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Order Badge & Reorder controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1 rounded hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent text-on-surface-variant transition-colors"
                      title="উপরে নিন"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1 rounded hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent text-on-surface-variant transition-colors"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="w-24 sm:w-32 h-16 sm:h-20 rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container shrink-0 flex items-center justify-center relative">
                    <img
                      src={banner.image_url}
                      alt={banner.title_bn}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/tonmoy-variety-store-hero-banner.jpg'
                      }}
                    />
                    {!banner.is_active && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                          নিষ্ক্রিয়
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-on-surface truncate">
                        {banner.title_bn}
                      </h3>
                      {banner.badge_text_bn && (
                        <span className="text-[10px] sm:text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {banner.badge_text_bn}
                        </span>
                      )}
                    </div>
                    {banner.subtitle_bn && (
                      <p className="text-xs text-on-surface-variant line-clamp-1">
                        {banner.subtitle_bn}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-primary" />
                        <span className="font-mono">{banner.link_url || '/shop'}</span>
                      </span>
                      <span>•</span>
                      <span>বাটন: <b>{banner.button_text_bn || 'বাজার করুন'}</b></span>
                    </div>
                  </div>
                </div>

                {/* Controls & Actions */}
                <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/30">
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      banner.is_active
                        ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                    <span>{banner.is_active ? 'সক্রিয় (Visible)' : 'লুকানো (Hidden)'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 border border-outline-variant/40 transition-colors"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(banner.id)}
                    className="p-2 rounded-xl text-error hover:bg-error-container/40 border border-outline-variant/40 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant/50 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base sm:text-lg font-bold text-on-surface">
                  {editingBanner ? 'ব্যানার সম্পাদনা করুন' : 'নতুন অফার ব্যানার যোগ করুন'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Preset Templates Selector */}
              {!editingBanner && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>এক-ক্লিকে অফার টেমপ্লেট নির্বাচন করুন (যেমন: শুক্রবার স্পেশাল, ঈদ অফার)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="text-[11px] font-semibold bg-surface-container-lowest hover:bg-primary hover:text-white text-on-surface px-2.5 py-1 rounded-lg border border-outline-variant/50 transition-colors shadow-xs"
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Banner Image Upload & Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface block">
                  ব্যানার ছবি (Banner Image) <span className="text-error">*</span>
                </label>

                {/* Image Preview Box */}
                <div className="relative w-full h-36 sm:h-44 rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low overflow-hidden flex items-center justify-center group">
                  {form.image_url ? (
                    <>
                      <img
                        src={form.image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/tonmoy-variety-store-hero-banner.jpg'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-white/90"
                        >
                          ছবি পরিবর্তন করুন
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-on-surface-variant mx-auto mb-1.5" />
                      <p className="text-xs font-medium text-on-surface">কম্পিউটার/মোবাইল থেকে ছবি আপলোড করুন</p>
                      <p className="text-[10px] text-on-surface-variant">সুপারিশকৃত সাইজ: ১২০০x৪০০ অথবা ১৯২০x৬০০ পিক্সেল</p>
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ছবি প্রসেস হচ্ছে...</span>
                    </div>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-surface-container text-on-surface hover:bg-surface-container-high px-3.5 py-2 rounded-xl text-xs font-bold border border-outline-variant/40 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>ডিভাইস থেকে ফাইল আপলোড করুন</span>
                  </button>

                  <div className="w-full flex-1 relative">
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="অথবা ছবির সরাসরি URL পেস্ট করুন (https://...)"
                      className="w-full text-xs py-2 px-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden bg-surface-container-lowest"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    ব্যানার শিরোনাম (বাংলা) <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title_bn}
                    onChange={(e) => setForm(prev => ({ ...prev, title_bn: e.target.value }))}
                    placeholder="যেমন: শুক্রবার স্পেশাল ধামাকা অফার"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-outline-variant/50 focus:border-primary outline-hidden bg-surface-container-lowest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    অফার ব্যাজ ট্যাগ (যেমন: শুক্রবার স্পেশাল, ঈদ মোবারক)
                  </label>
                  <input
                    type="text"
                    value={form.badge_text_bn}
                    onChange={(e) => setForm(prev => ({ ...prev, badge_text_bn: e.target.value }))}
                    placeholder="যেমন: শুক্রবার স্পেশাল"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-outline-variant/50 focus:border-primary outline-hidden bg-surface-container-lowest"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface">
                  সাবটাইটেল / অফার বিবরণ (বাংলা)
                </label>
                <input
                  type="text"
                  value={form.subtitle_bn}
                  onChange={(e) => setForm(prev => ({ ...prev, subtitle_bn: e.target.value }))}
                  placeholder="যেমন: খাঁটি তেল, ডাল, চিনি ও মসলায় ২০% পর্যন্ত বিশেষ ছাড়!"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-outline-variant/50 focus:border-primary outline-hidden bg-surface-container-lowest"
                />
              </div>

              {/* Link & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    ক্লিক গন্তব্য লিংক (Click Link URL)
                  </label>
                  <select
                    value={form.link_url}
                    onChange={(e) => setForm(prev => ({ ...prev, link_url: e.target.value }))}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-outline-variant/50 focus:border-primary outline-hidden bg-surface-container-lowest mb-1.5"
                  >
                    <option value="/shop">সকল পণ্য (/shop)</option>
                    <option value="/shop/category/cooking-essentials">রান্নার সামগ্রী (/shop/category/cooking-essentials)</option>
                    <option value="/shop/category/dairy-eggs">দুধ ও ডিম (/shop/category/dairy-eggs)</option>
                    <option value="/shop/category/snacks-beverages">নাস্তা ও পানীয় (/shop/category/snacks-beverages)</option>
                    <option value="/shop/category/baby-care">শিশুর যত্ন (/shop/category/baby-care)</option>
                    <option value="/shop/category/beauty-personal-care">সৌন্দর্য ও ব্যক্তিগত যত্ন</option>
                    <option value="/shop/category/cleaning-household">ক্লিনিং ও গৃহস্থালি</option>
                    <option value="custom">কাস্টম লিংক লিখুন...</option>
                  </select>
                  {form.link_url === 'custom' && (
                    <input
                      type="text"
                      placeholder="/shop?tag=discount"
                      onChange={(e) => setForm(prev => ({ ...prev, link_url: e.target.value }))}
                      className="w-full text-xs py-1.5 px-3 rounded-xl border border-outline-variant/50"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">
                    বাটন টেক্সট (Button Label)
                  </label>
                  <input
                    type="text"
                    value={form.button_text_bn}
                    onChange={(e) => setForm(prev => ({ ...prev, button_text_bn: e.target.value }))}
                    placeholder="যেমন: বাজার করুন, অফার দেখুন"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-outline-variant/50 focus:border-primary outline-hidden bg-surface-container-lowest"
                  />
                </div>
              </div>

              {/* Active Toggle & Order */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="banner_is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
                  />
                  <label htmlFor="banner_is_active" className="text-xs font-bold text-on-surface cursor-pointer">
                    হোমপেজের স্লাইডারে সক্রিয় রাখুন (Active)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">ক্রম (Sort):</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.sort_order}
                    onChange={(e) => setForm(prev => ({ ...prev, sort_order: Number(e.target.value) || 1 }))}
                    className="w-16 text-xs text-center py-1 px-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest font-bold"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-5 py-2 rounded-xl text-xs font-bold shadow-card transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingBanner ? 'আপডেট করুন' : 'ব্যানার প্রকাশ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant/50 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-on-surface">ব্যানারটি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-on-surface-variant">
                এই ব্যানারটি মুছে ফেললে তা হোমপেজের হিরো স্লাইডার থেকে চিরতরে সরিয়ে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-error hover:bg-error/90 text-on-error px-4 py-2 rounded-xl text-xs font-bold shadow-card transition-all active:scale-95"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
