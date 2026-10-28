import { useEffect } from 'react'
import { supabase } from './supabase'

// 1. Cross-tab BroadcastChannel
let broadcastChannel = null
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('tvs_realtime_sync')
  }
} catch (e) {
  console.warn('BroadcastChannel not initialized:', e)
}

/**
 * Dispatch event across current tab, other open tabs (Admin & User), and local storage
 */
export const notifyProductChange = (data = {}) => {
  const syncEvent = {
    type: 'PRODUCTS_UPDATED',
    timestamp: Date.now(),
    data,
  }

  // A. BroadcastChannel for instant cross-tab sync (Admin tab <-> User tab)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(syncEvent)
    } catch (err) {
      console.warn('Broadcast postMessage error:', err)
    }
  }

  // B. Trigger cross-tab storage event
  try {
    localStorage.setItem('tvs_products_sync_timestamp', Date.now().toString())
  } catch {}

  // C. Same-tab DOM event for instant component reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tvs_products_updated', { detail: syncEvent }))
  }
}

/**
 * React hook to listen to real-time product updates (from Supabase Realtime, BroadcastChannel, and LocalStorage)
 */
export const useProductSync = (callback) => {
  useEffect(() => {
    if (!callback) return

    // 1. BroadcastChannel message listener
    const handleBroadcast = (event) => {
      if (event.data?.type === 'PRODUCTS_UPDATED') {
        callback(event.data)
      }
    }
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast)
    }

    // 2. Cross-tab storage event listener
    const handleStorage = (e) => {
      if (e.key === 'tvs_products_sync_timestamp' || e.key === 'tvs_custom_products') {
        callback()
      }
    }
    window.addEventListener('storage', handleStorage)

    // 3. Same-tab custom DOM event listener
    const handleCustom = (e) => {
      callback(e.detail)
    }
    window.addEventListener('tvs_products_updated', handleCustom)

    // 4. Supabase Postgres Realtime subscription
    let channel = null
    try {
      channel = supabase
        .channel('realtime:public:products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            callback(payload)
          }
        )
        .subscribe()
    } catch (err) {
      console.warn('Supabase product channel subscription notice:', err)
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast)
      }
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('tvs_products_updated', handleCustom)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [callback])
}

/**
 * Dispatch event when an order is created or updated
 */
export const notifyOrderChange = (data = {}) => {
  const syncEvent = {
    type: 'ORDERS_UPDATED',
    timestamp: Date.now(),
    data,
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(syncEvent)
    } catch {}
  }

  try {
    localStorage.setItem('tvs_orders_sync_timestamp', Date.now().toString())
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tvs_orders_updated', { detail: syncEvent }))
  }
}

/**
 * React hook to listen to real-time order updates
 */
export const useOrderSync = (callback) => {
  useEffect(() => {
    if (!callback) return

    const handleBroadcast = (event) => {
      if (event.data?.type === 'ORDERS_UPDATED') {
        callback(event.data)
      }
    }
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast)
    }

    const handleStorage = (e) => {
      if (e.key === 'tvs_orders_sync_timestamp') {
        callback()
      }
    }
    window.addEventListener('storage', handleStorage)

    const handleCustom = (e) => {
      callback(e.detail)
    }
    window.addEventListener('tvs_orders_updated', handleCustom)

    let channel = null
    try {
      channel = supabase
        .channel('realtime:public:orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            callback(payload)
          }
        )
        .subscribe()
    } catch (err) {
      console.warn('Supabase orders channel subscription notice:', err)
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast)
      }
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('tvs_orders_updated', handleCustom)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [callback])
}
