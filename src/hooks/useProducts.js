import { useState, useEffect, useCallback } from 'react'
import { productService } from '../services/productService'
import { useProductSync } from '../lib/syncEvents'

export function useProducts({ categorySlug, subcategory, search, limit, featuredOnly } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getProducts({
        categorySlug,
        subcategory,
        search,
        limit,
        featuredOnly,
      })
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products hook:', err)
      setError(err.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [categorySlug, subcategory, search, limit, featuredOnly])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Sync across tabs and realtime changes
  useProductSync(fetchProducts)

  return { products, loading, error, refresh: fetchProducts }
}

export default useProducts

