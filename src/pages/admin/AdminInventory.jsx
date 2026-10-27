import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Loader2, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, name_bn, stock_quantity, unit, price, is_active, categories(name)')
      .order('name')
    setProducts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleQtyChange = (id, val) => {
    setEdits(e => ({ ...e, [id]: val }))
  }

  const handleSaveAll = async () => {
    const toSave = Object.entries(edits).filter(([id, val]) => {
      const orig = products.find(p => p.id === id)
      return orig && Number(val) !== orig.stock_quantity
    })
    if (toSave.length === 0) { toast.error('কোনো পরিবর্তন নেই'); return }
    setSaving(true)

    for (const [id, qty] of toSave) {
      await supabase.from('products').update({ stock_quantity: Number(qty) }).eq('id', id)
    }

    setSaving(false)
    toast.success(`${toSave.length}টি পণ্যের স্টক আপডেট হয়েছে!`)
    setEdits({})
    load()
  }

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_bn?.includes(search)
  )

  const hasChanges = Object.keys(edits).length > 0

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">ইনভেন্টরি</h1>
        {hasChanges && (
          <button onClick={handleSaveAll} disabled={saving} className="btn-primary flex items-center gap-2 py-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'সংরক্ষণ হচ্ছে…' : 'সব পরিবর্তন সংরক্ষণ করুন'}
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-10 py-2 text-sm" placeholder="পণ্য খুঁজুন…" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card text-center">
          <div className="text-2xl font-bold text-gray-800">{products.length}</div>
          <div className="text-sm text-gray-500">মোট পণ্য</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 shadow-card text-center">
          <div className="text-2xl font-bold text-red-600">{products.filter(p => p.stock_quantity === 0).length}</div>
          <div className="text-sm text-gray-500">স্টক শেষ</div>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4 shadow-card text-center">
          <div className="text-2xl font-bold text-orange-600">{products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length}</div>
          <div className="text-sm text-gray-500">কম স্টক</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">পণ্য</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">ক্যাটাগরি</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">দাম</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">বর্তমান স্টক</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">নতুন স্টক</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="skeleton h-8 rounded" /></td></tr>
                ))
              ) : filtered.map(p => {
                const editedQty = edits[p.id]
                const displayQty = editedQty !== undefined ? editedQty : p.stock_quantity
                const isChanged = editedQty !== undefined && Number(editedQty) !== p.stock_quantity
                const stockStatus = p.stock_quantity === 0 ? 'out'
                  : p.stock_quantity <= 5 ? 'low' : 'ok'

                return (
                  <tr key={p.id} className={`hover:bg-gray-50 ${isChanged ? 'bg-yellow-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-800">{p.name_bn || p.name}</div>
                      {p.name_bn && <div className="text-xs text-gray-400">{p.name}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.categories?.name || '—'}</td>
                    <td className="px-5 py-3 text-right">{formatCurrency(p.price)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`badge ${stockStatus === 'out' ? 'bg-red-100 text-red-700' : stockStatus === 'low' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_quantity} {p.unit || 'পিস'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={displayQty}
                        onChange={e => handleQtyChange(p.id, e.target.value)}
                        className={`w-24 text-center border rounded-lg px-2 py-1.5 text-sm transition-colors
                          ${isChanged ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'} focus:border-brand-fresh focus:outline-none`}
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
