import { supabaseClient } from '../lib/supabaseClient'

export const productService = {
  /**
   * Fetch all active products or filter by category/search
   */
  async getProducts({ categorySlug, subcategory, search, limit = 50, featuredOnly = false } = {}) {
    let query = supabaseClient
      .from('products')
      .select('*, categories(id, name, name_bn, slug)')
      .or('is_active.eq.true,is_active.is.null')
      .order('created_at', { ascending: false })

    if (featuredOnly) {
      query = query.eq('is_featured', true)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error

    let result = data || []

    if (typeof window !== 'undefined') {
      try {
        const localCustom = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
          .filter(p => p.is_active !== false)
        const customIds = new Set(localCustom.map(p => p.id))
        const combined = [...localCustom]
        for (const item of result) {
          if (!customIds.has(item.id)) {
            combined.push(item)
            customIds.add(item.id)
          }
        }
        result = combined
      } catch (e) {
        console.warn('Local custom products parse error:', e)
      }
    }

    if (featuredOnly) {
      result = result.filter(p => p.is_featured)
    }

    if (categorySlug && categorySlug !== 'all') {
      result = result.filter(p => p.categories?.slug === categorySlug || p.category_slug === categorySlug)
    }

    if (subcategory && subcategory !== 'সকল') {
      result = result.filter(p => p.subcategory === subcategory)
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim()
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.name_bn && p.name_bn.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      )
    }

    return result
  },

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*, categories(id, name, name_bn, slug)')
        .eq('id', id)
        .maybeSingle()

      if (data) return data
    } catch (err) {
      console.warn('DB lookup failed, checking local cache:', err)
    }

    if (typeof window !== 'undefined') {
      try {
        const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const found = localList.find(p => p.id === id)
        if (found) return found
      } catch (e) {
        console.warn('Local storage product lookup error:', e)
      }
    }

    return null
  },

  /**
   * Create a new product (Admin)
   */
  async createProduct(productData) {
    let result = null
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .insert([productData])
        .select('*, categories(id, name, name_bn, slug)')
        .single()

      if (!error && data) {
        result = data
      }
    } catch (e) {
      console.warn('Remote product insert failed, keeping local fallback:', e)
    }

    if (!result) {
      result = {
        id: productData.id || `prod-${Date.now()}`,
        ...productData,
        created_at: new Date().toISOString()
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        localStorage.setItem('tvs_custom_products', JSON.stringify([result, ...localList.filter(p => p.id !== result.id)]))
      } catch (err) {
        console.warn('Local storage sync error:', err)
      }
    }

    return result
  },

  /**
   * Update an existing product (Admin)
   */
  async updateProduct(id, updates) {
    let result = null
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .update(updates)
        .eq('id', id)
        .select('*, categories(id, name, name_bn, slug)')
        .single()

      if (!error && data) {
        result = data
      }
    } catch (e) {
      console.warn('Remote product update failed, updating local cache:', e)
    }

    if (typeof window !== 'undefined') {
      try {
        const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const updated = localList.map(p => p.id === id ? { ...p, ...updates } : p)
        localStorage.setItem('tvs_custom_products', JSON.stringify(updated))
        if (!result) {
          result = updated.find(p => p.id === id) || { id, ...updates }
        }
      } catch (err) {
        console.warn('Local storage update error:', err)
      }
    }

    return result || { id, ...updates }
  },

  /**
   * Delete product (Admin)
   */
  async deleteProduct(id) {
    try {
      await supabaseClient
        .from('products')
        .delete()
        .eq('id', id)
    } catch (e) {
      console.warn('Remote product delete notice:', e)
    }

    if (typeof window !== 'undefined') {
      try {
        const localList = JSON.parse(localStorage.getItem('tvs_custom_products') || '[]')
        const filtered = localList.filter(p => p.id !== id)
        localStorage.setItem('tvs_custom_products', JSON.stringify(filtered))
      } catch (err) {
        console.warn('Local storage delete error:', err)
      }
    }

    return true
  },
}

export default productService

