import { supabaseClient } from '../lib/supabaseClient'
import { notifyBannerChange } from '../lib/syncEvents'

// Default fallback banners matching Tonmoy Variety Store authentic branding
export const DEFAULT_BANNERS = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    title: 'Tonmoy Variety Store',
    title_bn: 'মেসার্স তন্ময় ভ্যারাইটি স্টোর',
    subtitle: 'All your daily essentials now in one place!',
    subtitle_bn: 'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন এক জায়গায়!',
    badge_text: 'Official Store',
    badge_text_bn: 'অফিসিয়াল স্টোর',
    image_url: '/images/tonmoy-variety-store-hero-banner.jpg',
    link_url: '/shop',
    button_text: 'Shop Now',
    button_text_bn: 'বাজার করুন',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    title: '5% OFF For Ramadan',
    title_bn: 'রমজান উপলক্ষে বিশেষ ছাড়!',
    subtitle: 'All your daily essentials at more affordable prices!',
    subtitle_bn: 'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন আরও সাশ্রয়ী মূল্যে!',
    badge_text: '5% OFF',
    badge_text_bn: 'রমজান ৫% ছাড়',
    image_url: '/images/banners/banner-ramadan-special-5off.jpg',
    link_url: '/shop',
    button_text: 'Shop Now',
    button_text_bn: 'বাজার করুন',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    title: '2% OFF For Friday',
    title_bn: 'শুক্রবারে বিশেষ ছাড়!',
    subtitle: 'All your daily essentials at more affordable prices!',
    subtitle_bn: 'আপনার দৈনন্দিন প্রয়োজনীয় সব পণ্য এখন আরও সাশ্রয়ী মূল্যে!',
    badge_text: '2% OFF',
    badge_text_bn: 'শুক্রবার ২% ছাড়',
    image_url: '/images/banners/banner-friday-special-2off.jpg',
    link_url: '/shop',
    button_text: 'Shop Now',
    button_text_bn: 'বাজার করুন',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    title: '5% Discount Qurbani Eid Special',
    title_bn: 'কোরবানী ঈদ উপলক্ষে বিশেষ ছাড়',
    subtitle: 'For favorite food, for loved ones — make Eid joy even more special!',
    subtitle_bn: 'প্রিয় খাবার, প্রিয় মানুষের জন্য — কোরবানীর আনন্দ হোক আরও বিশেষ!',
    badge_text: 'Eid Mubarak',
    badge_text_bn: 'কোরবানী ঈদ ৫% ছাড়',
    image_url: '/images/banners/banner-qurbani-eid-5discount.jpg',
    link_url: '/shop',
    button_text: 'Shop Now',
    button_text_bn: 'বাজার করুন',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    title: '2% Discount Happy New Year',
    title_bn: 'নতুন বছরের বিশেষ অফার',
    subtitle: 'For favorite food, for loved ones — more savings in the new year!',
    subtitle_bn: 'প্রিয় খাবার, প্রিয় মানুষের জন্য — নতুন বছরে আরও বেশি সাশ্রয়!',
    badge_text: 'Happy New Year',
    badge_text_bn: 'নতুন বছর ২% ছাড়',
    image_url: '/images/banners/banner-new-year-2discount.jpg',
    link_url: '/shop',
    button_text: 'Shop Now',
    button_text_bn: 'বাজার করুন',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000006',
    title: '2% Discount Pohela Boishakh',
    title_bn: 'বাংলা নববর্ষ উপলক্ষে বিশেষ ছাড়',
    subtitle: 'New shopping in the new year, stay healthy, stay well!',
    subtitle_bn: 'নতুন বছরে নতুন কেনাকাটা, সুস্থ থাকুন, ভালো থাকুন!',
    badge_text: 'Pohela Boishakh',
    badge_text_bn: 'বৈশাখী ২% ছাড়',
    image_url: '/images/banners/banner-boishakh-2discount.jpg',
    link_url: '/shop',
    button_text: 'Shop Now',
    button_text_bn: 'বাজার করুন',
    sort_order: 6,
    is_active: true,
  },
]

const STORAGE_KEY = 'tvs_custom_banners'

/**
 * Read local storage custom banners safely, automatically filtering out legacy unsplash mock images
 */
function getLocalBanners() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Filter out previously added mock unsplash banners
    const cleaned = parsed.filter(b => !b.image_url?.includes('images.unsplash.com'))
    if (cleaned.length !== parsed.length) {
      setLocalBanners(cleaned)
    }
    return cleaned
  } catch (err) {
    console.warn('Could not parse local banners:', err)
    return []
  }
}

/**
 * Save to local storage safely
 */
function setLocalBanners(banners) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners))
  } catch (err) {
    console.warn('Could not save local banners:', err)
  }
}

export const bannerService = {
  /**
   * Fetch all banners (with local storage resilience and merge)
   */
  async getBanners({ activeOnly = false } = {}) {
    let dbBanners = []
    let hasDbError = false

    try {
      let query = supabaseClient
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query
      if (error) {
        hasDbError = true
        console.warn('Supabase banners query notice (using local storage fallback):', error.message)
      } else if (data && data.length > 0) {
        // Filter out legacy unsplash mock banners
        dbBanners = data.filter(b => !b.image_url?.includes('images.unsplash.com'))
      }
    } catch (err) {
      hasDbError = true
      console.warn('Error fetching banners from Supabase:', err)
    }

    // Merge logic: Combine DB banners with any locally created custom banners
    const localBanners = getLocalBanners()
    let combined = []

    if (dbBanners.length > 0) {
      const dbIds = new Set(dbBanners.map(b => b.id))
      // Add local banners that might not yet be synced to DB
      const extraLocal = localBanners.filter(b => !dbIds.has(b.id))
      combined = [...dbBanners, ...extraLocal]
    } else if (localBanners.length > 0) {
      combined = [...localBanners]
    } else {
      // First-time fallback with the 5 authentic banners + official store banner
      combined = [...DEFAULT_BANNERS]
      setLocalBanners(combined)
    }

    // Filter out any legacy unsplash URLs
    combined = combined.filter(b => !b.image_url?.includes('images.unsplash.com'))

    // Filter active only if requested
    if (activeOnly) {
      combined = combined.filter(b => b.is_active !== false)
    }

    // Sort by sort_order
    combined.sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1))

    return combined
  },

  /**
   * Create a new banner
   */
  async createBanner(bannerData) {
    const id = bannerData.id || `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const newBanner = {
      ...bannerData,
      id,
      title: bannerData.title || bannerData.title_bn,
      title_bn: bannerData.title_bn,
      subtitle: bannerData.subtitle || bannerData.subtitle_bn || '',
      subtitle_bn: bannerData.subtitle_bn || '',
      badge_text: bannerData.badge_text || bannerData.badge_text_bn || 'Special Offer',
      badge_text_bn: bannerData.badge_text_bn || 'বিশেষ অফার',
      image_url: bannerData.image_url,
      link_url: bannerData.link_url || '/shop',
      button_text: bannerData.button_text || 'Shop Now',
      button_text_bn: bannerData.button_text_bn || 'বাজার করুন',
      sort_order: Number(bannerData.sort_order) || 1,
      is_active: bannerData.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 1. Try Supabase insert
    try {
      const { data, error } = await supabaseClient
        .from('banners')
        .insert([newBanner])
        .select()
        .single()

      if (!error && data) {
        Object.assign(newBanner, data)
      }
    } catch (err) {
      console.warn('Could not insert banner to Supabase directly, keeping in local cache:', err)
    }

    // 2. Always persist in localStorage
    const local = getLocalBanners()
    const updated = [newBanner, ...local.filter(b => b.id !== id)]
    setLocalBanners(updated)

    // 3. Notify app components across tabs
    notifyBannerChange(newBanner)

    return newBanner
  },

  /**
   * Update an existing banner
   */
  async updateBanner(id, updates) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // 1. Try Supabase update
    try {
      await supabaseClient
        .from('banners')
        .update(payload)
        .eq('id', id)
    } catch (err) {
      console.warn('Supabase banner update warning:', err)
    }

    // 2. Update local storage
    const local = getLocalBanners()
    let found = false
    const updated = local.map(b => {
      if (b.id === id) {
        found = true
        return { ...b, ...payload }
      }
      return b
    })

    if (!found) {
      // If was from DEFAULT_BANNERS, add to local
      const def = DEFAULT_BANNERS.find(b => b.id === id)
      if (def) {
        updated.push({ ...def, ...payload })
      }
    }

    setLocalBanners(updated)

    // 3. Notify real-time
    notifyBannerChange({ id, ...payload })

    return { id, ...payload }
  },

  /**
   * Delete a banner
   */
  async deleteBanner(id) {
    // 1. Try Supabase delete
    try {
      await supabaseClient
        .from('banners')
        .delete()
        .eq('id', id)
    } catch (err) {
      console.warn('Supabase banner delete error:', err)
    }

    // 2. Remove from local storage
    const local = getLocalBanners()
    const updated = local.filter(b => b.id !== id)
    setLocalBanners(updated)

    // 3. Notify real-time
    notifyBannerChange({ id, deleted: true })

    return true
  },

  /**
   * Toggle active state
   */
  async toggleActive(id, currentStatus) {
    return this.updateBanner(id, { is_active: !currentStatus })
  },
}
