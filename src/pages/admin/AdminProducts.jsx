import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Plus, Pencil, Trash2, Search, X, Loader2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_PRODUCT = {
  name: '', name_bn: '', description: '', description_bn: '',
  price: '', stock_quantity: '', unit: 'কেজি',
  category_id: '', is_active: true, is_featured: false, image_url: '',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*, categories(name, name_bn)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setProducts(prodRes.data || [])
    setCategories(catRes.data || [])
    setLoading(false)
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
      unit: p.unit || 'কেজি', category_id: p.category_id || '',
      is_active: p.is_active, is_featured: p.is_featured, image_url: p.image_url || '',
    })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.stock_quantity) {
      toast.error('নাম, দাম ও স্টক প্রয়োজন')
      return
    }
    setSaving(true)

    let image_url = form.image_url
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `products/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true })
      if (uploadError) { toast.error('Image upload failed'); setSaving(false); return }
      image_url = path
    }

    const payload = {
      name: form.name.trim(),
      name_bn: form.name_bn.trim() || null,
      description: form.description.trim() || null,
      description_bn: form.description_bn.trim() || null,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      unit: form.unit,
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      image_url,
    }

    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing)
      : await supabase.from('products').insert(payload)

    setSaving(false)
    if (error) { toast.error('Save failed: ' + error.message); return }
    toast.success(editing ? 'পণ্য আপডেট হয়েছে!' : 'পণ্য যোগ হয়েছে!')
    setShowForm(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই পণ্য মুছে দিতে চান?')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    setDeleting(null)
    toast.success('পণ্য মুছে দেওয়া হয়েছে')
    load()
  }

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_bn?.includes(search)
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">পণ্য ব্যবস্থাপনা</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2">
          <Plus className="w-4 h-4" /> নতুন পণ্য
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 py-2 text-sm" placeholder="পণ্য খুঁজুন…" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">পণ্য</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">ক্যাটাগরি</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">দাম</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">স্টক</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">স্ট্যাটাস</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="skeleton h-8 rounded" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">কোনো পণ্য নেই</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800">{p.name_bn || p.name}</div>
                    {p.name_bn && <div className="text-xs text-gray-400">{p.name}</div>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p.categories?.name_bn || p.categories?.name || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`badge ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : p.stock_quantity <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                        {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-brand-dark">{editing ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য যোগ'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">নাম (English) *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">নাম (বাংলা)</label>
                  <input value={form.name_bn} onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">দাম (৳) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">স্টক পরিমাণ *</label>
                  <input type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">একক (unit)</label>
                  <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="input-field" placeholder="কেজি, লিটার, পিস…" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">ক্যাটাগরি</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input-field">
                    <option value="">— ক্যাটাগরি নির্বাচন করুন —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_bn || c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">বিবরণ (English)</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">বিবরণ (বাংলা)</label>
                <textarea rows={2} value={form.description_bn} onChange={e => setForm(f => ({ ...f, description_bn: e.target.value }))} className="input-field resize-none" />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">পণ্যের ছবি</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-fresh transition-colors">
                    {imagePreview || form.image_url ? (
                      <img
                        src={imagePreview || (form.image_url.startsWith('http') ? form.image_url : supabase.storage.from('product-images').getPublicUrl(form.image_url).data.publicUrl)}
                        alt="" className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1">আপলোড</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-brand-fresh" />
                      <span className="text-sm">সক্রিয়</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-brand-fresh" />
                      <span className="text-sm">ফিচার্ড</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2">বাতিল</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
