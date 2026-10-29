import { useState, useEffect, useCallback } from 'react'
import { orderService } from '../services/orderService'
import { useOrderSync } from '../lib/syncEvents'

export function useOrders({ userId, status, search, page = 1, pageSize = 20, isAdmin = false } = {}) {
  const [orders, setOrders] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (isAdmin) {
        const { orders: data, totalCount: count } = await orderService.getAllOrders({
          status,
          search,
          page,
          pageSize,
        })
        setOrders(data)
        setTotalCount(count)
      } else if (userId) {
        const data = await orderService.getUserOrders(userId)
        setOrders(data)
        setTotalCount(data.length)
      }
    } catch (err) {
      console.error('Error fetching orders hook:', err)
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [userId, status, search, page, pageSize, isAdmin])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useOrderSync(fetchOrders)

  return { orders, totalCount, loading, error, refresh: fetchOrders }
}

export default useOrders

