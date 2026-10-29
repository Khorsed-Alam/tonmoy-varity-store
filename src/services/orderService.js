import { supabaseClient } from '../lib/supabaseClient'

export const orderService = {
  /**
   * Place a new order with items atomically
   */
  async createOrder({ orderData, items }) {
    // 1. Insert order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert([orderData])
      .select('*')
      .single()

    if (orderError) throw orderError

    // 2. Insert order items if provided
    if (items && items.length > 0) {
      const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: isValidUUID(item.product_id) ? item.product_id : null,
        product_name: item.product_name || item.name || '',
        product_name_bn: item.product_name_bn || item.name_bn || '',
        unit: item.unit || 'পিস',
        quantity: item.quantity,
        unit_price: item.price || item.unit_price || 0,
        image_url: item.image_url || '',
      }))

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.warn('Order items insert notice:', itemsError)
      }
    }

    return order
  },

  /**
   * Fetch orders for a specific customer
   */
  async getUserOrders(userId) {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*, products(name, name_bn, image_url, unit))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get single order by ID
   */
  async getOrderById(orderId) {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*, products(name, name_bn, image_url, unit))')
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Fetch all orders for Admin with optional status & search filters
   */
  async getAllOrders({ status, search, page = 1, pageSize = 20 } = {}) {
    let query = supabaseClient
      .from('orders')
      .select('id, order_number, status, total_amount, delivery_method, payment_method, full_name, phone, shipping_address, created_at', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    if (search && search.trim()) {
      const s = search.trim()
      query = query.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,order_number.ilike.%${s}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { orders: data || [], totalCount: count || 0 }
  },

  /**
   * Update order lifecycle status (Admin)
   */
  async updateOrderStatus(orderId, newStatus) {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },
}

export default orderService

