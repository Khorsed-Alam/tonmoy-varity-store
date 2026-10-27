import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_ICONS = ['🥦', '🍅', '🍌', '🥩', '🥚', '🥛', '🍚', '🛒', '🧅', '🐟', '🌶️', '🍰', '🧴', '🧹', '🫙', '🥤', '🫒', '🌿']

const EMPTY = { name: '', name_bn: '', icon: '🛒', sort_order: 0, is_active: true, slug: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const slugify = (str) => str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({ name: c.name, name_bn: c.name_bn || '', icon: c.icon || '🛒', sort_order: c.sort_order, is_active: c.is_active, slug: c.slug })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('নাম প্রয়োজন'); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      name_bn: form.name_bn.trim() || null,
      icon: form.icon,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
      slug: form.slug || slugify(form.name),
    }

    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing)
      : await supabase.from('categories').insert(payload)

    setSaving(false)
    if (error) { toast.error('Save failed: ' + error.message); return }
    toast.success(editing ? 'ক্যাটাগরি আপডেট হয়েছে!' : 'ক্যাটাগরি যোগ হয়েছে!')
    setShowForm(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই ক্যাটাগরি মুছে দিতে চান?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error('Delete failed: ' + error.message); return }
    toast.success('ক্যাটাগরি মুছে দেওয়া হয়েছে')
    load()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ক্যাটাগরি ব্যবস্থাপনা</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2">
          <Plus className="w-4 h-4" /> নতুন ক্যাটাগরি
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">আইকন</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">নাম</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Slug</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">ক্রম</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-600">স্ট্যাটাস</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-600">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="skeleton h-8 rounded" /></td></tr>
              ))
            ) : categories.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">কোনো ক্যাটাগরি নেই</td></tr>
            ) : categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-2xl">{c.icon}</td>
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-800">{c.name_bn || c.name}</div>
                  {c.name_bn && <div className="text-xs text-gray-400">{c.name}</div>}
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3 text-center text-gray-500">{c.sort_order}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`badge ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg">{editing ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">নাম (English) *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">নাম (বাংলা)</label>
                  <input value={form.name_bn} onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">আইকন</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all
                        ${form.icon === icon ? 'bg-brand-mint border-2 border-brand-fresh scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="input-field font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ক্রম</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="input-field" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-brand-fresh" />
                <span className="text-sm">সক্রিয়</span>
              </label>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2">বাতিল</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
