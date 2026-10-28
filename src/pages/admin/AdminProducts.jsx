import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import {
  Plus, Pencil, Trash2, Search, X, Loader2, ImagePlus,
  Package, Check, AlertTriangle, Filter, ArrowUpDown, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_PRODUCT = {
  name: '', name_bn: '', description: '', description_bn: '',
  price: '', stock_quantity: '50', unit: '১ কেজি',
  category_id: '', is_active: true, is_featured: false, image_url: '',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
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
        supabase.from('products').select('*, categories(name, name_bn)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ])
      setProducts(prodRes.data || [])
      setCategories(catRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('পণ্য তালিকা লোড করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_PRODUCT)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditing(p.id)
    setForm({
      name: p.name || '', name_bn: p.name_bn || '',
      description: p.description || '', description_bn: p.description_bn || '',
      price: p.price || '', stock_quantity: p.stock_quantity || '',
      unit: p.unit || '১ কেজি', category_id: p.category_id || '',
      is_active: p.is_active, is_featured: p.is_featured, image_url: p.image_url || '',
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
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() && !form.name_bn.trim()) {
      toast.error('পণ্যের নাম লিখুন')
      return
    }
    if (!form.price) {
      toast.error('দাম নির্ধারণ করুন')
      return
    }
    setSaving(true)

    try {
      let image_url = form.image_url
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `products/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true })
        if (!uploadError) {
          image_url = path
        }
      }

      const payload = {
        name: form.name.trim() || form.name_bn.trim(),
        name_bn: form.name_bn.trim() || form.name.trim(),
        description: form.description.trim() || null,
        description_bn: form.description_bn.trim() || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity) || 0,
        unit: form.unit || '১ কেজি',
        category_id: form.category_id || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        image_url,
      }

      const { error } = editing
        ? await supabase.from('products').update(payload).eq('id', editing)
        : await supabase.from('products').insert(payload)

      if (error) throw error
      toast.success(editing ? 'পণ্য আপডেট হয়েছে!' : 'পণ্য সফলভাবে যুক্ত হয়েছে!')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error('সংরক্ষণ ব্যর্থ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickRestock = async (productId, currentQty, addQty) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: currentQty + addQty })
        .eq('id', productId)
      if (error) throw error
      toast.success(`স্টক +${addQty} বৃদ্ধি করা হয়েছে`)
      load()
    } catch (err) {
      toast.error('স্টক আপডেট ব্যর্থ: ' + err.message)
    }
  }

  const toggleProductActive = async (p) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !p.is_active })
        .eq('id', p.id)
      if (error) throw error
      toast.success(p.is_active ? 'পণ্য নিষ্ক্রিয় করা হয়েছে' : 'পণ্য সক্রিয় করা হয়েছে')
      load()
    } catch (err) {
      toast.error('আপডেট ব্যর্থ')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই পণ্য মুছে দিতে চান?')) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      toast.success('পণ্য মুছে দেওয়া হয়েছে')
      load()
    } catch (err) {
      toast.error('ডিলিট ব্যর্থ: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = products.filter(p => {
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false
    if (stockFilter === 'out' && p.stock_quantity > 0) return false
    if (stockFilter === 'low' && (p.stock_quantity === 0 || p.stock_quantity > 5)) return false
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.name_bn?.includes(term) ||
      p.categories?.name_bn?.includes(term)
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
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1 rounded-lg shrink-0 font-semibold transition-all ${
                categoryFilter === c.id
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {c.name_bn || c.name}
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
                          {p.image_url ? (
                            <img
                              src={p.image_url.startsWith('http') ? p.image_url : supabase.storage.from('product-images').getPublicUrl(p.image_url).data.publicUrl}
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
                      {p.categories?.name_bn || p.categories?.name || '—'}
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
                  <label className="block font-bold text-on-surface mb-1">দাম (BDT ৳) *</label>
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

                <div>
                  <label className="block font-bold text-on-surface mb-1">ক্যাটাগরি</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none"
                  >
                    <option value="">— ক্যাটাগরি নির্বাচন করুন —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name_bn || c.name}</option>
                    ))}
                  </select>
                </div>
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

              {/* Image Preview & Upload */}
              <div>
                <label className="block font-bold text-on-surface mb-1">পণ্যের ছবি</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden">
                    {imagePreview || form.image_url ? (
                      <img
                        src={imagePreview || (form.image_url.startsWith('http') ? form.image_url : supabase.storage.from('product-images').getPublicUrl(form.image_url).data.publicUrl)}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-on-surface-variant" />
                        <span className="text-[10px] text-on-surface-variant mt-1">ছবি যোগ</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>

                  <div className="flex flex-col gap-2">
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
