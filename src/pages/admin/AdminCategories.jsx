import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, X, Loader2, Tag, Layers, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_ICONS = ['🥦', '🍅', '🍌', '🥩', '🥚', '🥛', '🍚', '🛒', '🧅', '🐟', '🌶️', '🍰', '🧴', '🧹', '🫙', '🥤', '🫒', '🌿', '☕', '🍞', '🧼']

const EMPTY = { name: '', name_bn: '', icon: '🛒', sort_order: 0, is_active: true, slug: '', description_bn: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order')
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error(err)
      toast.error('ক্যাটাগরি লোড ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const slugify = (str) =>
    str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      name: c.name || '',
      name_bn: c.name_bn || '',
      icon: c.icon || '🛒',
      sort_order: c.sort_order || 0,
      is_active: c.is_active ?? true,
      slug: c.slug || '',
      description_bn: c.description_bn || '',
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() && !form.name_bn.trim()) {
      toast.error('ক্যাটাগরির নাম লিখুন')
      return
    }
    setSaving(true)

    try {
      const payload = {
        name: form.name.trim() || form.name_bn.trim(),
        name_bn: form.name_bn.trim() || form.name.trim(),
        icon: form.icon,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        slug: form.slug || slugify(form.name || form.name_bn),
        description_bn: form.description_bn || null,
      }

      const { error } = editing
        ? await supabase.from('categories').update(payload).eq('id', editing)
        : await supabase.from('categories').insert(payload)

      if (error) throw error
      toast.success(editing ? 'ক্যাটাগরি আপডেট হয়েছে!' : 'নতুন ক্যাটাগরি তৈরি হয়েছে!')
      setShowForm(false)
      load()
    } catch (err) {
      toast.error('সংরক্ষণ ব্যর্থ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই ক্যাটাগরি মুছে দিতে চান? এর আওতাভুক্ত পণ্যগুলো অচিহ্নিত হতে পারে।')) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      toast.success('ক্যাটাগরি মুছে ফেলা হয়েছে')
      load()
    } catch (err) {
      toast.error('ডিলিট ব্যর্থ: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display">
            ক্যাটাগরি ব্যবস্থাপনা (Categories)
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            দোকানের সমস্ত পণ্যের বিভাগ, আইকন ও সাজানোর ক্রম নির্ধারণ করুন
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm transition-all transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ক্যাটাগরি</span>
        </button>
      </div>

      {/* Categories Cards / Table Grid */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">আইকন</th>
                <th className="px-4 py-3">ক্যাটাগরি নাম (বাংলা ও ইংরেজি)</th>
                <th className="px-4 py-3">Slug (URL)</th>
                <th className="px-4 py-3 text-center">ক্রম (Order)</th>
                <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right rounded-r-xl">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3.5">
                      <div className="h-7 bg-surface-container rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    কোনো ক্যাটাগরি নেই
                  </td>
                </tr>
              ) : (
                categories.map(c => (
                  <tr key={c.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-2xl shadow-xs">
                        {c.icon || '🛒'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface text-sm">
                          {c.name_bn || c.name}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-on-surface-variant">
                      /{c.slug}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-on-surface">
                      {c.sort_order}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        c.is_active
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {c.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
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
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="p-1.5 rounded-lg bg-error-container/40 hover:bg-error-container text-error transition-colors"
                          title="মুছে ফেলুন"
                        >
                          {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Category Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-outline-variant/30">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
              <h2 className="font-bold text-base text-on-surface font-display">
                {editing ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি যোগ'}
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
                    placeholder="যেমন: চাল ও ডাল"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Name (English)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                    placeholder="Rice & Grains"
                    className="w-full h-10 px-3.5 bg-surface-container rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block font-bold text-on-surface mb-2">ক্যাটাগরি আইকন নির্বাচন করুন</label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-surface-container-low rounded-xl">
                  {CATEGORY_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
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
                  <label className="block font-bold text-on-surface mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="rice-grains"
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

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="accent-primary w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-on-surface">ক্যাটাগরি দোকানে সক্রিয় রাখুন</span>
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
