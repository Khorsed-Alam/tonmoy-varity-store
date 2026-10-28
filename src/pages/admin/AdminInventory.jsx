import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import {
  Loader2, Save, Search, Warehouse, AlertTriangle,
  CheckCircle, Plus, Minus, RefreshCw, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'out' | 'low' | 'good'
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, name_bn, stock_quantity, unit, price, is_active, categories(name, name_bn)')
        .order('name')
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error(err)
      toast.error('ইনভেন্টরি লোড ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleQtyChange = (id, val) => {
    const num = Math.max(0, parseInt(val) || 0)
    setEdits(e => ({ ...e, [id]: num }))
  }

  const handleIncrement = (id, currentVal, amount) => {
    const activeVal = edits[id] !== undefined ? edits[id] : currentVal
    const newVal = Math.max(0, activeVal + amount)
    setEdits(e => ({ ...e, [id]: newVal }))
  }

  const handleSaveAll = async () => {
    const toSave = Object.entries(edits).filter(([id, val]) => {
      const orig = products.find(p => p.id === id)
      return orig && Number(val) !== orig.stock_quantity
    })
    if (toSave.length === 0) {
      toast.error('কোনো পরিবর্তন করা হয়নি')
      return
    }
    setSaving(true)

    try {
      for (const [id, qty] of toSave) {
        const { error } = await supabase.from('products').update({ stock_quantity: Number(qty) }).eq('id', id)
        if (error) throw error
      }
      toast.success(`${toSave.length}টি পণ্যের মজুদ সফলভাবে আপডেট হয়েছে!`)
      setEdits({})
      load()
    } catch (err) {
      toast.error('মজুদ সংরক্ষণ ব্যর্থ: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = products.filter(p => {
    if (filter === 'out' && p.stock_quantity > 0) return false
    if (filter === 'low' && (p.stock_quantity === 0 || p.stock_quantity > 5)) return false
    if (filter === 'good' && p.stock_quantity <= 5) return false
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.name_bn?.includes(term) ||
      p.categories?.name_bn?.includes(term)
    )
  })

  const hasChanges = Object.keys(edits).length > 0
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length
  const healthyCount = products.filter(p => p.stock_quantity > 5).length

  return (
    <div className="space-y-6 animate-fade-in font-sans text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-display">
            মজুদ ও ইনভেন্টরি কন্ট্রোল (Stock Control)
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            সরাসরি দোকানে পণ্য পৌঁছানোর সাথে সাথে ১-ক্লিকে স্টক বৃদ্ধি ও রি-অর্ডার পরিচালনা করুন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
            title="রিফ্রেশ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {hasChanges && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>পরিবর্তন সংরক্ষণ করুন ({Object.keys(edits).length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Health KPI Cards (3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center justify-between ${
            filter === 'all'
              ? 'bg-surface-container-lowest border-primary ring-2 ring-primary/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary/40'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-on-surface-variant block">মোট রেজিস্টার্ড পণ্য</span>
            <span className="text-2xl font-extrabold text-on-surface font-display mt-1 block">
              {products.length} টি
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <Warehouse className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('low')}
          className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center justify-between ${
            filter === 'low'
              ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-orange-400'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-orange-700 block">কম মজুদের সতর্কতা</span>
            <span className="text-2xl font-extrabold text-orange-700 font-display mt-1 block">
              {lowStockCount} টি
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('out')}
          className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center justify-between ${
            filter === 'out'
              ? 'bg-error-container/30 border-error ring-2 ring-error/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-error/40'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-error block">স্টক শেষ (আউট অব স্টক)</span>
            <span className="text-2xl font-extrabold text-error font-display mt-1 block">
              {outOfStockCount} টি
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-on-error-container">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30">
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

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            সব পণ্য
          </button>
          <button
            type="button"
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'low'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            কম স্টক
          </button>
          <button
            type="button"
            onClick={() => setFilter('out')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'out'
                ? 'bg-error text-on-error shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            স্টক শেষ
          </button>
          <button
            type="button"
            onClick={() => setFilter('good')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'good'
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            পর্যাপ্ত ({healthyCount})
          </button>
        </div>
      </div>

      {/* Stock Management Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">পণ্য বিবরণ</th>
                <th className="px-4 py-3">ক্যাটাগরি</th>
                <th className="px-4 py-3 text-right">বিক্রয় মূল্য</th>
                <th className="px-4 py-3 text-center">বর্তমান স্টক</th>
                <th className="px-4 py-3 text-center">নতুন স্টক ইনপুট</th>
                <th className="px-4 py-3 text-center">১-ক্লিক দ্রুত বৃদ্ধি</th>
                <th className="px-4 py-3 text-right rounded-r-xl">স্ট্যাটাস</th>
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
                filtered.map(p => {
                  const editedQty = edits[p.id]
                  const displayQty = editedQty !== undefined ? editedQty : p.stock_quantity
                  const isChanged = editedQty !== undefined && Number(editedQty) !== p.stock_quantity

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-container/30 transition-colors ${
                        isChanged ? 'bg-secondary-container/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">
                            {p.name_bn || p.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {p.name} • {p.unit || '১ কেজি'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-on-surface-variant">
                        {p.categories?.name_bn || p.categories?.name || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-extrabold text-primary font-display">
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
                          {p.stock_quantity} {p.unit || 'টি'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleIncrement(p.id, p.stock_quantity, -1)}
                            className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={displayQty}
                            onChange={e => handleQtyChange(p.id, e.target.value)}
                            className={`w-16 h-8 text-center text-xs font-bold rounded-lg border focus:outline-none transition-all ${
                              isChanged
                                ? 'bg-secondary-container/40 border-secondary text-primary font-extrabold ring-2 ring-secondary/30'
                                : 'bg-surface-container border-outline-variant/30 text-on-surface'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(p.id, p.stock_quantity, 1)}
                            className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 1-Click Fast Restock */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleIncrement(p.id, p.stock_quantity, 5)}
                            className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[10px] transition-colors"
                          >
                            +৫
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIncrement(p.id, p.stock_quantity, 20)}
                            className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[10px] transition-colors"
                          >
                            +২০
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIncrement(p.id, p.stock_quantity, 50)}
                            className="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[10px] transition-colors"
                          >
                            +৫০
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isChanged ? (
                          <span className="text-[11px] font-bold text-secondary animate-pulse">
                            পরিবর্তিত ({displayQty})
                          </span>
                        ) : p.stock_quantity === 0 ? (
                          <span className="text-[11px] font-bold text-error">আউট অব স্টক</span>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant font-medium">স্থির</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
