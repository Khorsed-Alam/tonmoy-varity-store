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
    title: 'Friday Special Offer',
    title_bn: 'শুক্রবার স্পেশাল ধামাকা অফার',
    subtitle: 'Special discounts on pure cooking oil, spices, and groceries every Friday!',
    subtitle_bn: 'খাঁটি সরিষার তেল, সয়াবিন তেল, মসলা ও ডালের ওপর বিশেষ ছাড়!',
    badge_text: 'Friday Offer',
    badge_text_bn: 'শুক্রবার স্পেশাল',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    link_url: '/shop/category/cooking-essentials',
    button_text: 'View Offers',
    button_text_bn: 'অফার দেখুন',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    title: 'Eid Special Mega Offer',
    title_bn: 'ঈদ স্পেশাল মেগা অফার',
    subtitle: 'Mega discount on Polao Rice, Lachha Semai, Powder Milk, and Pure Ghee!',
    subtitle_bn: 'পোলাও চাল, লাচ্ছা সেমাই, গুঁড়ো দুধ ও খাঁটি ঘিয়ে আকর্ষণীয় মূল্যছাড়!',
    badge_text: 'Eid Mubarak',
    badge_text_bn: 'ঈদ মোবারক',
    image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=1200&q=80',
    link_url: '/shop/category/snacks-beverages',
    button_text: 'Get Eid Offer',
    button_text_bn: 'ঈদ অফার নিন',
    sort_order: 3,
    is_active: true,
  },
]

const STORAGE_KEY = 'tvs_custom_banners'

/**
 * Read local storage custom banners safely
 */
function getLocalBanners() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
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
        dbBanners = data
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
      // First-time fallback
      combined = [...DEFAULT_BANNERS]
      setLocalBanners(combined)
    }

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
