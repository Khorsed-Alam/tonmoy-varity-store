import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabaseClient as supabase } from '../../lib/supabaseClient'
import { formatCurrency, getProductImageUrl } from '../../lib/utils'
import { notifyProductChange, useProductSync } from '../../lib/syncEvents'
import { DEFAULT_CATEGORIES, ALLOWED_MAIN_SLUGS, LEGACY_CATEGORY_MAP } from '../../data/categories'
import { uploadService } from '../../services/uploadService'
import {
  Plus, Pencil, Trash2, Search, X, Loader2, ImagePlus,
  Package, Check, AlertTriangle, Filter, ArrowUpDown, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_PRODUCT = {
  name: '', name_bn: '', description: '', description_bn: '',
  price: '', original_price: '', cost_price: '', stock_quantity: '50', unit: '১ কেজি',
  category_id: '', subcategory: '', child_subcategory: '', tag: '', is_active: true, is_featured: false, image_url: '',
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'low' | 'out'
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*, categories(name, name_bn, slug)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ])
      
      const dbProducts = prodRes.data || []
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      
      // Merge DB products and local custom products, DB takes precedence by ID
      const dbIds = new Set(dbProducts.map(p => p.id))
      const combined = [...dbProducts]
      for (const item of localCustom) {
        if (!dbIds.has(item.id)) {
          combined.unshift(item)
        }
      }

      setProducts(combined)
      setCategories(catRes.data && catRes.data.length > 0 ? catRes.data : DEFAULT_CATEGORIES)
    } catch (err) {
      console.error('Error loading admin products:', err)
      const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      setProducts(localCustom)
      setCategories(DEFAULT_CATEGORIES)
      toast.error('পণ্য তালিকা লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time synchronization across User End & Admin End
  useProductSync(load)

  // 3-Tier Category Resolution for Admin Product Management (Strictly follows 7-tier Directory)
  const mainCategories = useMemo(() => {
    return DEFAULT_CATEGORIES
  }, [])

  const selectedMainCategory = useMemo(() => {
    if (!form.category_id) return null
    // 1. Direct match by ID or slug
    const direct = mainCategories.find(c => c.id === form.category_id || c.slug === form.category_id)
    if (direct) return direct

    // 2. Legacy category map lookup (e.g. rice-dal -> cooking-essentials)
    const legacySlug = LEGACY_CATEGORY_MAP[form.category_id]?.mainSlug
    if (legacySlug) {
      return mainCategories.find(c => c.slug === legacySlug) || null
    }

    // 3. Database categories lookup fallback
    const dbCat = categories.find(c => c.id === form.category_id)
    if (dbCat) {
      const dbLegacy = LEGACY_CATEGORY_MAP[dbCat.slug]?.mainSlug || dbCat.slug
      const matched = mainCategories.find(c => c.slug === dbLegacy)
      if (matched) return matched
    }

    return null
  }, [form.category_id, mainCategories, categories])

  const availableSubcategories = useMemo(() => {
    if (!selectedMainCategory) return []
    return selectedMainCategory.subcategories || []
  }, [selectedMainCategory])

  const selectedSubcategoryObj = useMemo(() => {
    if (!form.subcategory || !availableSubcategories.length) return null
    return availableSubcategories.find(s => 
      (typeof s === 'object' && (
        s.name === form.subcategory ||
        s.name_bn === form.subcategory ||
        s.slug === form.subcategory ||
        s.items?.includes(form.subcategory) ||
        s.items_bn?.includes(form.subcategory)
      )) ||
      (typeof s === 'string' && s === form.subcategory)
    ) || null
  }, [form.subcategory, availableSubcategories])

  // Level 3 items available under the selected subcategory (subcategory under subcategory)
  const availableLevel3Items = useMemo(() => {
    if (!selectedSubcategoryObj) return []
    if (typeof selectedSubcategoryObj === 'object' && selectedSubcategoryObj.items && selectedSubcategoryObj.items.length > 0) {
      return selectedSubcategoryObj.items.map((it, idx) => ({
        name: it,
        name_bn: selectedSubcategoryObj.items_bn?.[idx] || it,
        slug: it.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }))
    }
    return []
  }, [selectedSubcategoryObj])

  // Automatically reset dependent subcategories when category changes
  const handleCategoryChange = (e) => {
    const newCatId = e.target.value
    setForm(f => ({
      ...f,
      category_id: newCatId,
      subcategory: '',
      child_subcategory: ''
    }))
  }

  const handleSubcategoryChange = (e) => {
    const newSub = e.target.value
    setForm(f => ({
      ...f,
      subcategory: newSub,
      child_subcategory: ''
    }))
  }

  const handleChildSubcategoryChange = (e) => {
    const newChild = e.target.value
    setForm(f => ({
      ...f,
      child_subcategory: newChild
    }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_PRODUCT)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditing(p.id)
    let matchedCatId = ''
    if (p.category_slug) {
      const found = DEFAULT_CATEGORIES.find(c => c.slug === p.category_slug)
      if (found) {
        matchedCatId = found.id
      } else {
        const legacySlug = LEGACY_CATEGORY_MAP[p.category_slug]?.mainSlug
        const mapped = DEFAULT_CATEGORIES.find(c => c.slug === legacySlug)
        if (mapped) matchedCatId = mapped.id
      }
    }
    if (!matchedCatId && p.category_id) {
      const direct = DEFAULT_CATEGORIES.find(c => c.id === p.category_id)
      if (direct) {
        matchedCatId = direct.id
      } else {
        const dbCat = categories.find(c => c.id === p.category_id)
        const mappedSlug = LEGACY_CATEGORY_MAP[dbCat?.slug || p.category_id]?.mainSlug
        const mapped = DEFAULT_CATEGORIES.find(c => c.slug === mappedSlug)
        if (mapped) matchedCatId = mapped.id
      }
    }
    setForm({
      name: p.name || '',
      name_bn: p.name_bn || '',
      description: p.description || '',
      description_bn: p.description_bn || '',
      price: p.price || '',
      original_price: p.original_price || '',
      cost_price: p.cost_price || '',
      stock_quantity: p.stock_quantity ?? '50',
      unit: p.unit || '১ কেজি',
      category_id: matchedCatId,
      subcategory: p.subcategory || '',
      child_subcategory: p.child_subcategory || p.tag || '',
      tag: p.tag || '',
      is_active: p.is_active ?? true,
      is_featured: p.is_featured ?? false,
      image_url: p.image_url || '',
    })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবির সাইজ ৫MB এর কম হতে হবে'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result
      setImagePreview(dataUrl)
      setForm(f => ({ ...f, image_url: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() && !form.name_bn.trim()) {
      toast.error('পণ্যের নাম লিখুন')
      return
    }
    if (!form.price) {
      toast.error('বিক্রয় মূল্য নির্ধারণ করুন')
      return
    }
    if (!form.category_id) {
      toast.error('অনুগ্রহ করে মূল ক্যাটাগরি নির্বাচন করুন')
      return
    }
    setSaving(true)

    try {
      let image_url = form.image_url || imagePreview
      if (imageFile) {
        try {
          const uploadRes = await uploadService.uploadImage(imageFile)
          if (uploadRes?.url) {
            image_url = uploadRes.url
            if (uploadRes.fromStorage) {
              toast.success('ছবি Supabase Storage-এ আপলোড হয়েছে! ☁️')
            }
          }
        } catch (uploadErr) {
          console.warn('Image upload error:', uploadErr)
          image_url = imagePreview || form.image_url
        }
      }

      const selectedCategory = DEFAULT_CATEGORIES.find(c => c.id === form.category_id || c.slug === form.category_id) || categories.find(c => c.id === form.category_id || c.slug === form.category_id)
      const validCategoryId = form.category_id && form.category_id.trim() !== '' ? form.category_id : (selectedCategory?.id || null)

      // Fallback only if absolutely no image was uploaded or entered
      if (!image_url) {
        image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
      }

      // Generate a valid UUID so that downstream order creation & inventory transactions always succeed
      const validUUID = editing || (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'd1000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0'))

      // Standard remote database payload matching Supabase products table columns
      const basePayload = {
        name: form.name.trim() || form.name_bn.trim(),
        name_bn: form.name_bn.trim() || form.name.trim(),
        description: form.description?.trim() || null,
        description_bn: form.description_bn?.trim() || null,
        price: Number(form.price) || 0,
        original_price: form.original_price ? Number(form.original_price) : (form.compare_at_price ? Number(form.compare_at_price) : null),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        stock_quantity: Number(form.stock_quantity) || 0,
        unit: form.unit?.trim() || '১ কেজি',
        category_id: validCategoryId,
        category_slug: selectedCategory?.slug || '',
        subcategory: form.subcategory?.trim() || 'সকল',
        tag: form.child_subcategory?.trim() || form.tag?.trim() || '',
        image_url,
        is_active: Boolean(form.is_active),
        is_featured: Boolean(form.is_featured),
      }

      // Payload with child_subcategory if the column has been added to Supabase
      const payloadWithChild = {
        ...basePayload,
        child_subcategory: form.child_subcategory?.trim() || null
      }

      let savedRecord = null

      if (editing) {
        // Try updating with child_subcategory; fallback to basePayload if column doesn't exist
        let { data, error } = await supabase
          .from('products')
          .update(payloadWithChild)
          .eq('id', editing)
          .select('*, categories(name, name_bn, slug)')

        if (error && error.code === '42703') {
          const retryRes = await supabase
            .from('products')
            .update(basePayload)
            .eq('id', editing)
            .select('*, categories(name, name_bn, slug)')
          data = retryRes.data
          error = retryRes.error
        }

        savedRecord = data?.[0] || {
          id: editing,
          ...payloadWithChild,
          categories: selectedCategory,
          updated_at: new Date().toISOString()
        }

        // Update local storage cache
        const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const updated = localList.map(p => p.id === editing ? { ...p, ...payloadWithChild, categories: selectedCategory } : p)
        localStorage.setItem('tvs_custom_products', JSON.stringify(updated))

        if (error) {
          console.warn('Supabase product update error notice:', error)
          toast('পণ্য আপডেট হয়েছে (লোকাল ক্যাশে সংরক্ষিত, ক্লাউড DB সিঙ্ক করতে SQL রান করুন)', { icon: 'ℹ️', duration: 4000 })
        } else {
          toast.success('পণ্য ক্লাউড ডাটাবেসে সফলভাবে আপডেট হয়েছে! 🎉')
        }
      } else {
        // Try inserting with child_subcategory; fallback to basePayload if column doesn't exist
        let { data, error } = await supabase
          .from('products')
          .insert([{ id: validUUID, ...payloadWithChild }])
          .select('*, categories(name, name_bn, slug)')

        if (error && error.code === '42703') {
          const retryRes = await supabase
            .from('products')
            .insert([{ id: validUUID, ...basePayload }])
            .select('*, categories(name, name_bn, slug)')
          data = retryRes.data
          error = retryRes.error
        }

        savedRecord = data?.[0] || {
          id: validUUID,
          ...payloadWithChild,
          categories: selectedCategory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Prepend to local storage custom products
        const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        localStorage.setItem('tvs_custom_products', JSON.stringify([savedRecord, ...localList.filter(p => p.id !== savedRecord.id)]))

        if (error) {
          console.error('Supabase product insert notice:', error)
          toast('নতুন পণ্য সেভ হয়েছে! ক্লাউড ডাটাবেসে সরাসরি সিঙ্ক করতে 003_fix_products_database_storage.sql রান করুন', { icon: 'ℹ️', duration: 6000 })
        } else {
          toast.success('নতুন পণ্য ক্লাউড ডাটাবেসে সফলভাবে যুক্ত হয়েছে! 🎉')
        }
      }

      // Broadcast change in real-time across User End & Admin End
      notifyProductChange({ action: editing ? 'update' : 'create', product: savedRecord })

      setShowForm(false)
      load()
    } catch (err) {
      console.error('Save product error:', err)
      toast.error('সংরক্ষণ ব্যর্থ: ' + (err.message || 'Error'))
    } finally {
      setSaving(false)
    }
  }

  const handleQuickRestock = async (productId, currentQty, addQty) => {
    try {
      const newQty = currentQty + addQty
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newQty })
        .eq('id', productId)

      if (error) console.warn('Quick restock DB notice:', error)

      // Sync local storage
      const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      const updated = localList.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p)
      localStorage.setItem('tvs_custom_products', JSON.stringify(updated))

      // Broadcast restock in real-time
      notifyProductChange({ action: 'restock', productId, stock_quantity: newQty })

      toast.success(`স্টক +${addQty} বৃদ্ধি করা হয়েছে (নতুন স্টক: ${newQty})`)
      load()
    } catch (err) {
      toast.error('স্টক আপডেট ব্যর্থ: ' + err.message)
    }
  }

  const toggleProductActive = async (p) => {
    try {
      const nextActive = !p.is_active
      const { error } = await supabase
        .from('products')
        .update({ is_active: nextActive })
        .eq('id', p.id)

      if (error) console.warn('Toggle status DB notice:', error)

      // Sync local storage
      const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      const updated = localList.map(item => item.id === p.id ? { ...item, is_active: nextActive } : item)
      localStorage.setItem('tvs_custom_products', JSON.stringify(updated))

      // Broadcast active status toggle in real-time
      notifyProductChange({ action: 'toggle_active', productId: p.id, is_active: nextActive })

      toast.success(nextActive ? 'পণ্য সক্রিয় করা হয়েছে' : 'পণ্য নিষ্ক্রিয় করা হয়েছে')
      load()
    } catch (err) {
      toast.error('আপডেট ব্যর্থ')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই পণ্যটি ডাটাবেস থেকে মুছে দিতে চান?')) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) console.warn('Delete product DB notice:', error)

      // Remove from local storage
      const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
      const filtered = localList.filter(p => p.id !== id)
      localStorage.setItem('tvs_custom_products', JSON.stringify(filtered))

      // Broadcast deletion in real-time
      notifyProductChange({ action: 'delete', productId: id })

      toast.success('পণ্য ডাটাবেস থেকে মুছে ফেলা হয়েছে')
      load()
    } catch (err) {
      toast.error('ডিলিট ব্যর্থ: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = products.filter(p => {
    if (categoryFilter !== 'all') {
      const matchCat = mainCategories.find(c => c.slug === categoryFilter || c.id === categoryFilter)
      const pSlug = p.category_slug || p.categories?.slug || ''
      const mappedSlug = LEGACY_CATEGORY_MAP[pSlug]?.mainSlug || pSlug
      if (p.category_id !== categoryFilter && pSlug !== categoryFilter && mappedSlug !== matchCat?.slug) {
        return false
      }
    }
    if (stockFilter === 'out' && p.stock_quantity > 0) return false
    if (stockFilter === 'low' && (p.stock_quantity === 0 || p.stock_quantity > 5)) return false
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.name_bn?.includes(term) ||
      p.categories?.name_bn?.includes(term) ||
      p.subcategory?.toLowerCase().includes(term) ||
      p.child_subcategory?.toLowerCase().includes(term) ||
      p.tag?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display">
            পণ্য ব্যবস্থাপনা (Products Inventory)
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            দোকানের সমস্ত গ্রোসারি পণ্যের মূল্য, মজুদ ও বিবরণ পরিচালনা করুন
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন পণ্য যোগ করুন</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="পণ্যের নাম দিয়ে খুঁজুন…"
              className="w-full h-9 pl-9 pr-3 text-xs bg-surface-container rounded-xl text-on-surface placeholder:text-on-surface-variant/70 border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Stock Filters */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                stockFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              সব ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                stockFilter === 'low'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              কম স্টক ({products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                stockFilter === 'out'
                  ? 'bg-error text-on-error shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              স্টক শেষ ({products.filter(p => p.stock_quantity === 0).length})
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-outline-variant/10 text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg shrink-0 font-bold transition-all ${
              categoryFilter === 'all'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            সকল ক্যাটাগরি
          </button>
          {mainCategories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.slug)}
              className={`px-3 py-1 rounded-lg shrink-0 font-semibold transition-all ${
                categoryFilter === c.slug || categoryFilter === c.id
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {c.icon ? `${c.icon} ` : ''}{c.name_bn || c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">পণ্য বিবরণ</th>
                <th className="px-4 py-3">ক্যাটাগরি</th>
                <th className="px-4 py-3 text-right">বিক্রয় মূল্য</th>
                <th className="px-4 py-3 text-center">মজুদ (স্টক)</th>
                <th className="px-4 py-3 text-center">দ্রুত রি-স্টক</th>
                <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right rounded-r-xl">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3.5">
                      <div className="h-7 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                          {getProductImageUrl(supabase, p.image_url) ? (
                            <img
                              src={getProductImageUrl(supabase, p.image_url)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <span>{p.categories?.name_bn?.charAt(0) || 'প'}</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-on-surface truncate">
                            {p.name_bn || p.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {p.name} • {p.unit || '১ কেজি'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-on-surface-variant">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-on-surface">
                          {DEFAULT_CATEGORIES.find(c => c.slug === p.category_slug || c.id === p.category_id)?.name_bn ||
                           DEFAULT_CATEGORIES.find(c => c.slug === LEGACY_CATEGORY_MAP[p.category_slug]?.mainSlug)?.name_bn ||
                           p.categories?.name_bn || p.categories?.name || '—'}
                        </span>
                        {(p.subcategory && p.subcategory !== 'সকল') && (
                          <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                            <span>↳ {p.subcategory}</span>
                          </span>
                        )}
                        {p.child_subcategory && (
                          <span className="text-[10px] text-secondary font-semibold flex items-center gap-0.5">
                            <span>↳ ↳ {p.child_subcategory}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-extrabold text-primary font-display text-sm">
                      {formatCurrency(p.price)}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.stock_quantity === 0
                          ? 'bg-error-container text-on-error-container'
                          : p.stock_quantity <= 5
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        {p.stock_quantity === 0 ? 'স্টক শেষ' : `${p.stock_quantity} ${p.unit || 'টি'}`}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(p.id, p.stock_quantity, 10)}
                          className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[10px] transition-colors"
                          title="১০ ইউনিট যোগ করুন"
                        >
                          +১০
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(p.id, p.stock_quantity, 25)}
                          className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[10px] transition-colors"
                          title="২৫ ইউনিট যোগ করুন"
                        >
                          +২৫
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleProductActive(p)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                          p.is_active
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors"
                          title="সম্পাদনা"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-lg bg-error-container/40 hover:bg-error-container text-error transition-colors"
                          title="মুছে ফেলুন"
                        >
                          {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-outline-variant/30">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <h2 className="font-bold text-base text-on-surface font-display">
                {editing ? 'পণ্য সম্পাদনা (Edit Product)' : 'নতুন পণ্য যোগ করুন (Add Product)'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-on-surface mb-1">নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={form.name_bn}
                    onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))}
                    placeholder="যেমন: তীর চিনি (১ কেজি)"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Product Name (English)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Teer Sugar (1kg)"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">বিক্রয় মূল্য (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="৳ ১২০"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">পূর্বের মূল্য / ডিসকাউন্ট (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                    placeholder="৳ ১৩৫ (ঐচ্ছিক)"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">মজুদ সংখ্যা (Stock) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    placeholder="৫০"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">একক (Unit)</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="১ কেজি, ৫ লিটার বোতল…"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Level 1: Main Category */}
                <div>
                  <label className="block font-bold text-on-surface mb-1 flex items-center justify-between">
                    <span>মূল ক্যাটাগরি (Level 1) <span className="text-red-500">*</span></span>
                    {selectedMainCategory && (
                      <span className="text-[10px] text-primary font-semibold">{selectedMainCategory.name}</span>
                    )}
                  </label>
                  <select
                    value={form.category_id}
                    onChange={handleCategoryChange}
                    className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                    required
                  >
                    <option value="">— মূল ক্যাটাগরি নির্বাচন করুন —</option>
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ''}{c.name_bn || c.name} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 2: Subcategory */}
                <div>
                  <label className="block font-bold text-on-surface mb-1 flex items-center justify-between">
                    <span>উপ-ক্যাটাগরি (Level 2)</span>
                    {selectedSubcategoryObj && (
                      <span className="text-[10px] text-primary font-semibold">{selectedSubcategoryObj.name}</span>
                    )}
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={handleSubcategoryChange}
                    disabled={!form.category_id || availableSubcategories.length === 0}
                    className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {form.category_id ? "— উপ-ক্যাটাগরি নির্বাচন করুন —" : "— প্রথমে মূল ক্যাটাগরি বাছুন —"}
                    </option>
                    {availableSubcategories.map(sub => {
                      const val = typeof sub === 'string' ? sub : (sub.name_bn || sub.name)
                      const label = typeof sub === 'string' ? sub : `${sub.name_bn || sub.name} (${sub.name})`
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Level 3: Child Subcategory / Product Type (Subcategory under Subcategory) */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-on-surface mb-1 flex items-center justify-between">
                    <span>সাব-ক্যাটাগরির নিচের পণ্য টাইপ (Level 3 - Subcategory under Subcategory)</span>
                    {form.child_subcategory && (
                      <span className="text-[10px] text-secondary font-semibold">নির্বাচিত: {form.child_subcategory}</span>
                    )}
                  </label>
                  <select
                    value={form.child_subcategory}
                    onChange={handleChildSubcategoryChange}
                    disabled={!form.subcategory || availableLevel3Items.length === 0}
                    className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {form.subcategory
                        ? (availableLevel3Items.length > 0 ? "— নির্দিষ্ট পণ্য টাইপ বাছুন (ঐচ্ছিক) —" : "— এই উপ-ক্যাটাগরির কোনো চাইল্ড টাইপ নেই —")
                        : "— প্রথমে উপ-ক্যাটাগরি বাছুন —"}
                    </option>
                    {availableLevel3Items.map(item => (
                      <option key={item.name} value={item.name_bn}>
                        • {item.name_bn} ({item.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hierarchy Breadcrumb Preview */}
                {(selectedMainCategory || form.subcategory || form.child_subcategory) && (
                  <div className="md:col-span-2 py-2 px-3.5 bg-surface-container-low rounded-xl flex items-center gap-1.5 text-xs text-on-surface-variant flex-wrap border border-outline-variant/20 shadow-xs">
                    <span className="font-bold text-primary">শ্রেণীবিন্যাস:</span>
                    <span className="font-semibold text-on-surface">{selectedMainCategory?.name_bn || selectedMainCategory?.name || 'মূল ক্যাটাগরি'}</span>
                    {form.subcategory && (
                      <>
                        <span className="text-outline">›</span>
                        <span className="font-semibold text-on-surface">{form.subcategory}</span>
                      </>
                    )}
                    {form.child_subcategory && (
                      <>
                        <span className="text-outline">›</span>
                        <span className="font-bold text-secondary">{form.child_subcategory}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">বিবরণ (বাংলা)</label>
                <textarea
                  rows={2}
                  value={form.description_bn}
                  onChange={e => setForm(f => ({ ...f, description_bn: e.target.value }))}
                  placeholder="পণ্যের গুণগত মান বা প্যাকেজিং তথ্য…"
                  className="w-full p-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none resize-none"
                />
              </div>

              {/* Image Preview & Upload / Direct URL */}
              <div>
                <label className="block font-bold text-on-surface mb-1">পণ্যের ছবি (ফাইল আপলোড অথবা ছবির URL)</label>
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden shrink-0 bg-surface-container">
                    {imagePreview || form.image_url ? (
                      <img
                        src={imagePreview || getProductImageUrl(supabase, form.image_url)}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-on-surface-variant" />
                        <span className="text-[10px] text-on-surface-variant mt-1 font-semibold">ফাইল আপলোড</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={e => {
                        setForm(f => ({ ...f, image_url: e.target.value }))
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      placeholder="বা অফিসিয়াল পণ্যের ছবির লিঙ্ক পেস্ট করুন (যেমন: https://i.chaldn.com/...)"
                      className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1 block">
                      📁 ফাইল আপলোড করতে বামের আইকনে চাপুন, অথবা ওয়েবসাইট থেকে ছবির লিঙ্ক পেস্ট করুন।
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-3 pt-2 border-t border-outline-variant/10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="accent-primary w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-on-surface">দোকানে সক্রিয় প্রদর্শন</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                      className="accent-primary w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-on-surface">হোমপেজে ফিচার্ড পণ্য</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
