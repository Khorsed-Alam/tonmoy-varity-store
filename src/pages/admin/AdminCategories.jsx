import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_CATEGORIES, generateFlatCategoryList } from '../../data/categories'
import { categoryService } from '../../services/categoryService'
import {
  Plus, Pencil, Trash2, X, Loader2, Tag, Layers, Check, Sparkles,
  Search, ShieldAlert, FolderTree, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_ICONS = ['🌾', '🥛', '🍿', '👶', '🧴', '🧹', '✏️', '🥦', '🍅', '🍌', '🥩', '🥚', '🍚', '🛒', '🧅', '🐟', '🌶️', '🍰', '🫙', '🥤', '🫒', '☕', '🍞', '🧼']

const EMPTY = {
  name: '',
  name_bn: '',
  icon: '🛒',
  sort_order: 1,
  is_active: true,
  slug: '',
  description_bn: '',
  level: 1,
  parent_category_id: ''
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all') // 'all' | '1' | '2' | '3'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch categories from Supabase
      const { data, error } = await supabase.from('categories').select('*').order('sort_order')
      const fullHierarchy = generateFlatCategoryList()
      const dbMap = new Map((data || []).map(d => [d.slug || d.id, d]))
      const hasMultiLevel = data && data.some(c => c.level === 2 || c.level === 3)

      let catList = hasMultiLevel
        ? data.map(cat => {
            const def = DEFAULT_CATEGORIES.find(d => d.slug === cat.slug)
            return {
              ...def,
              ...cat,
              level: cat.level || 1,
              subcategories: (cat.subcategories && cat.subcategories.length > 0 && typeof cat.subcategories[0] === 'object')
                ? cat.subcategories
                : (def?.subcategories || cat.subcategories || [])
            }
          })
        : fullHierarchy.map(c => ({
            ...c,
            ...(dbMap.get(c.slug) || {})
          }))

      setCategories(catList)

      // 2. Fetch product counts per category
      const counts = {}
      try {
        const { data: prodData } = await supabase.from('products').select('id, category_id, category_slug, subcategory, child_subcategory')
        const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const allProds = [...(prodData || []), ...localCustom]

        allProds.forEach(p => {
          if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1
          if (p.category_slug) counts[p.category_slug] = (counts[p.category_slug] || 0) + 1
          if (p.subcategory) counts[p.subcategory] = (counts[p.subcategory] || 0) + 1
          if (p.child_subcategory) counts[p.child_subcategory] = (counts[p.child_subcategory] || 0) + 1
        })
      } catch (err) {
        console.warn('Product count warning:', err)
      }
      setProductCounts(counts)
    } catch (err) {
      console.error(err)
      setCategories(generateFlatCategoryList())
      toast.error('ক্যাটাগরি লোড ব্যর্থ, ডিফল্ট ক্যাটাগরি প্রদর্শিত হচ্ছে')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // 1-Click Seed All Categories & Subcategories & Child Categories
  const handleSeedDefaults = async () => {
    setSaving(true)
    try {
      await categoryService.seedCategories()
      toast.success('অফিসিয়াল ৭টি প্রধান ক্যাটাগরি ও ৩-স্তরের শ্রেণীবিন্যাস সফলভাবে সিঙ্ক হয়েছে! 🎉')
      load()
    } catch (err) {
      toast.error('ক্যাটাগরি সিঙ্ক ব্যর্থ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const slugify = (str) =>
    str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const openCreate = (parentCat = null, forcedLevel = null) => {
    setEditing(null)
    const targetLevel = forcedLevel || (parentCat ? (parentCat.level === 2 ? 3 : 2) : 1)
    setForm({
      ...EMPTY,
      level: targetLevel,
      parent_id: parentCat ? parentCat.id : '',
      parent_category_id: parentCat ? (parentCat.parent_category_id || parentCat.id) : '',
      sort_order: categories.length + 1
    })
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      name: c.name || '',
      name_bn: c.name_bn || '',
      icon: c.icon || '🛒',
      sort_order: c.sort_order || 1,
      is_active: c.is_active ?? true,
      slug: c.slug || '',
      description_bn: c.description_bn || '',
      level: c.level || 1,
      parent_id: c.parent_id || c.parent_category_id || '',
      parent_category_id: c.parent_category_id || ''
    })
    setShowForm(true)
  }

  const handleToggleActive = async (c) => {
    try {
      const nextActive = !c.is_active
      const { error } = await supabase
        .from('categories')
        .update({ is_active: nextActive })
        .eq('id', c.id)

      if (error) console.warn('Supabase toggle error:', error)

      setCategories(prev => prev.map(item => item.id === c.id ? { ...item, is_active: nextActive } : item))
      toast.success(`"${c.name_bn || c.name}" ক্যাটাগরি ${nextActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`)
    } catch (err) {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ: ' + err.message)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() && !form.name_bn.trim()) {
      toast.error('ক্যাটাগরির নাম লিখুন')
      return
    }

    const generatedSlug = form.slug?.trim() || slugify(form.name || form.name_bn) || `cat-${Date.now()}`

    // Duplicate Validation
    const isDuplicate = categories.some(c => 
      c.id !== editing && 
      (c.slug === generatedSlug || c.name.toLowerCase() === form.name.toLowerCase() || c.name_bn === form.name_bn)
    )
    if (isDuplicate) {
      toast.error('এই নামের বা Slug-এর ক্যাটাগরি ইতিমধ্যেই বিদ্যমান!')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim() || form.name_bn.trim(),
        name_bn: form.name_bn.trim() || form.name.trim(),
        icon: form.icon || '🛒',
        sort_order: Number(form.sort_order) || 1,
        is_active: Boolean(form.is_active),
        slug: generatedSlug,
        description: form.description_bn || null,
        description_bn: form.description_bn || null,
        level: Number(form.level) || 1,
        parent_category_id: form.parent_category_id || null
      }

      const { error } = editing
        ? await supabase.from('categories').update(payload).eq('id', editing)
        : await supabase.from('categories').insert([payload])

      if (error) {
        console.warn('Supabase category save notice:', error)
      }

      toast.success(editing ? 'ক্যাটাগরি আপডেট হয়েছে!' : 'নতুন ক্যাটাগরি তৈরি হয়েছে!')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error('সংরক্ষণ ব্যর্থ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Safe Deletion with product reference check
  const handleDelete = async (cat) => {
    const assignedCount = (productCounts[cat.id] || 0) + (productCounts[cat.slug] || 0)
    if (assignedCount > 0) {
      toast.error(
        `সতর্কতা: "${cat.name_bn || cat.name}" ক্যাটাগরিতে ${assignedCount}টি পণ্য যুক্ত রয়েছে! ভুলবশত পণ্য বিচ্ছিন্ন হওয়া রোধ করতে আগে পণ্যগুলো অন্য ক্যাটাগরিতে স্থানান্তর করুন।`,
        { duration: 6000, icon: '⚠️' }
      )
      return
    }

    if (!window.confirm(`আপনি কি "${cat.name_bn || cat.name}" ক্যাটাগরি মুছে ফেলতে চান?`)) return
    setDeleting(cat.id)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id)
      if (error) throw error
      toast.success('ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে')
      load()
    } catch (err) {
      toast.error('ডিলিট ব্যর্থ: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (levelFilter === '1' && c.level && c.level !== 1) return false
      if (levelFilter === '2' && c.level !== 2) return false
      if (levelFilter === '3' && c.level !== 3) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (c.name || '').toLowerCase().includes(q) || (c.name_bn || '').includes(q) || (c.slug || '').includes(q)
        const matchSub = c.subcategories?.some(s => 
          typeof s === 'string' 
            ? s.toLowerCase().includes(q) 
            : (s.name?.toLowerCase().includes(q) || s.name_bn?.includes(q) || s.items?.some(it => it.toLowerCase().includes(q)))
        )
        return matchName || matchSub
      }
      return true
    })
  }, [categories, levelFilter, searchQuery])

  // Main categories list for parent selection dropdown
  const parentCategoriesList = useMemo(() => {
    return categories.filter(c => !c.level || c.level === 1)
  }, [categories])

  // Level 2 Subcategories list for Level 3 parent selection
  const subcategoriesList = useMemo(() => {
    return categories.filter(c => c.level === 2)
  }, [categories])

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-primary" />
            <span>ক্যাটাগরি ও উপ-ক্যাটাগরি ব্যবস্থাপনা (Category System)</span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            মূল ক্যাটাগরি ও উপ-ক্যাটাগরি (Category & Subcategory System) সম্পূর্ণ নিয়ন্ত্রণ
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={saving}
            onClick={handleSeedDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-white rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95"
            title="৭টি অফিসিয়াল ক্যাটাগরি ও উপ-ক্যাটাগরি ডাটাবেসে সিঙ্ক করুন"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{saving ? 'সিঙ্ক হচ্ছে...' : 'অফিসিয়াল ৭টি ক্যাটাগরি সিঙ্ক'}</span>
          </button>
          <button
            type="button"
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ক্যাটাগরি</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-3 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ক্যাটাগরি বা উপ-ক্যাটাগরি খুঁজুন..."
              className="w-full h-9 pl-9 pr-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-on-surface-variant hover:text-primary"
            >
              মুছুন
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              levelFilter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            সকল ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter('1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              levelFilter === '1'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            মূল ক্যাটাগরি (Level 1)
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter('2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              levelFilter === '2'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            উপ-ক্যাটাগরি (Level 2)
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter('3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              levelFilter === '3'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            সাব-আইটেম (Level 3)
          </button>
        </div>
      </div>

      {/* Categories Cards & Hierarchy Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">স্তর ও আইকন</th>
                <th className="px-4 py-3">ক্যাটাগরি নাম (বাংলা ও ইংরেজি)</th>
                <th className="px-4 py-3">উপ-ক্যাটাগরি ও আইটেমসমূহ</th>
                <th className="px-4 py-3 text-center">যুক্ত পণ্য</th>
                <th className="px-4 py-3 text-center">ক্রম</th>
                <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right rounded-r-xl">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3.5">
                      <div className="h-8 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <p className="mb-3 text-sm">কোনো ক্যাটাগরি পাওয়া যায়নি</p>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSeedDefaults}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:bg-primary-container"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{saving ? 'যোগ হচ্ছে...' : 'অফিসিয়াল ৭টি ক্যাটাগরি যুক্ত করুন'}</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCategories.map(c => {
                  const assignedCount = (productCounts[c.id] || 0) + (productCounts[c.slug] || 0)
                  const subCount = c.subcategories?.length || 0

                  return (
                    <tr key={c.id || c.slug} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.level === 2 ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary/10 text-primary'
                          }`}>
                            L{c.level || 1}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-xl shadow-xs">
                            {c.icon || '🛒'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface text-sm">
                            {c.name_bn || c.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            <span>{c.name}</span>
                            <span className="font-mono text-outline text-[10px]">/{c.slug}</span>
                          </span>
                          {c.level === 2 && (c.parent_category_id || c.parent_id) && (
                            <span className="text-[10px] text-secondary font-semibold mt-0.5">
                              ↳ প্যারেন্ট (L1): {categories.find(p => p.id === c.parent_category_id || p.id === c.parent_id)?.name_bn || 'মূল ক্যাটাগরি'}
                            </span>
                          )}
                          {c.level === 3 && (
                            <span className="text-[10px] text-primary font-semibold mt-0.5">
                              ↳ প্যারেন্ট (L2): {categories.find(p => p.id === c.parent_id || p.id === c.parent_category_id)?.name_bn || 'উপ-ক্যাটাগরি'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs md:max-w-md">
                        {subCount > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.subcategories.slice(0, 4).map((sub, idx) => {
                              const title = typeof sub === 'string' ? sub : (sub.name_bn || sub.name)
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-surface-container rounded-md text-[10px] text-on-surface-variant font-medium inline-flex items-center gap-1"
                                >
                                  <span>{title}</span>
                                </span>
                              )
                            })}
                            {subCount > 4 && (
                              <span className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] text-outline font-bold">
                                +{subCount - 4}টি
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-outline italic">উপ-ক্যাটাগরি নেই</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          assignedCount > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-outline'
                        }`}>
                          {assignedCount}টি পণ্য
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-on-surface">
                        {c.sort_order}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            c.is_active
                              ? 'bg-secondary-container text-on-secondary-container hover:opacity-80'
                              : 'bg-surface-container text-on-surface-variant hover:opacity-80'
                          }`}
                          title="ক্লিক করে সক্রিয় / নিষ্ক্রিয় করুন"
                        >
                          {c.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {(!c.level || c.level === 1) && (
                            <button
                              type="button"
                              onClick={() => openCreate(c, 2)}
                              className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                              title={`"${c.name_bn || c.name}"-এর অধীনে নতুন উপ-ক্যাটাগরি যোগ করুন`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>উপ-ক্যাটাগরি</span>
                            </button>
                          )}
                          {c.level === 2 && (
                            <button
                              type="button"
                              onClick={() => openCreate(c, 3)}
                              className="px-2 py-1 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                              title={`"${c.name_bn || c.name}"-এর অধীনে নতুন লেভেল ৩ আইটেম যোগ করুন`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>আইটেম</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors"
                            title="সম্পাদনা"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            disabled={deleting === c.id}
                            className="p-1.5 rounded-lg bg-error-container/40 hover:bg-error-container text-error transition-colors"
                            title="মুছে ফেলুন (পণ্য থাকলে সুরক্ষিত থাকবে)"
                          >
                            {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal (Create / Edit) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-outline-variant/30">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <h2 className="font-bold text-base text-on-surface font-display">
                {editing ? 'ক্যাটাগরি সম্পাদনা (Edit Category)' : 'নতুন ক্যাটাগরি তৈরি (Create Category)'}
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
              {/* Level Selector */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-surface-container-low rounded-xl">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-on-surface text-[11px]">
                  <input
                    type="radio"
                    name="level"
                    value="1"
                    checked={Number(form.level) === 1}
                    onChange={() => setForm(f => ({ ...f, level: 1, parent_category_id: '', parent_id: '' }))}
                    className="accent-primary"
                  />
                  <span>মূল (L1)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-on-surface text-[11px]">
                  <input
                    type="radio"
                    name="level"
                    value="2"
                    checked={Number(form.level) === 2}
                    onChange={() => setForm(f => ({ ...f, level: 2 }))}
                    className="accent-primary"
                  />
                  <span>উপ-ক্যাটাগরি (L2)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-on-surface text-[11px]">
                  <input
                    type="radio"
                    name="level"
                    value="3"
                    checked={Number(form.level) === 3}
                    onChange={() => setForm(f => ({ ...f, level: 3 }))}
                    className="accent-primary"
                  />
                  <span>সাব-আইটেম (L3)</span>
                </label>
              </div>

              {/* Parent Category for Level 2 */}
              {Number(form.level) === 2 && (
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    প্যারেন্ট মূল ক্যাটাগরি নির্বাচন করুন (Level 1) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.parent_category_id || form.parent_id}
                    onChange={e => setForm(f => ({ ...f, parent_category_id: e.target.value, parent_id: e.target.value }))}
                    required={Number(form.level) === 2}
                    className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
                  >
                    <option value="">— মূল ক্যাটাগরি বাছুন —</option>
                    {parentCategoriesList.map(p => (
                      <option key={p.id} value={p.id}>{p.name_bn || p.name} ({p.name})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Parent Subcategory for Level 3 */}
              {Number(form.level) === 3 && (
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    প্যারেন্ট উপ-ক্যাটাগরি নির্বাচন করুন (Level 2) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.parent_id}
                    onChange={e => {
                      const selSub = subcategoriesList.find(s => s.id === e.target.value)
                      setForm(f => ({
                        ...f,
                        parent_id: e.target.value,
                        parent_category_id: selSub?.parent_category_id || selSub?.parent_id || ''
                      }))
                    }}
                    required={Number(form.level) === 3}
                    className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
                  >
                    <option value="">— উপ-ক্যাটাগরি বাছুন —</option>
                    {subcategoriesList.map(s => {
                      const parentMain = parentCategoriesList.find(p => p.id === s.parent_category_id || p.id === s.parent_id)
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name_bn || s.name} {parentMain ? `(${parentMain.name_bn || parentMain.name})` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-on-surface mb-1">নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={form.name_bn}
                    onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))}
                    placeholder="যেমন: চাল ও ডাল"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Name (English)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: f.slug ? f.slug : slugify(e.target.value) }))}
                    placeholder="Rice & Dal"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block font-bold text-on-surface mb-1.5">ক্যাটাগরি ইমোজি / আইকন</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-surface-container-low rounded-xl">
                  {CATEGORY_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                        form.icon === icon
                          ? 'bg-secondary-container ring-2 ring-secondary scale-110'
                          : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Slug (ইউনিক URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="cooking-essentials"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs font-mono text-on-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">ক্রম নম্বর (Sort Order)</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={form.description_bn}
                  onChange={e => setForm(f => ({ ...f, description_bn: e.target.value }))}
                  placeholder="যেমন: খাঁটি চাল, ডাল ও তেল সামগ্রী..."
                  className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="accent-primary w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-on-surface">দোকানে সক্রিয় প্রদর্শন রাখুন</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editing ? 'আপডেট করুন' : 'তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
