import { supabaseClient } from '../lib/supabaseClient'

export const inventoryService = {
  /**
   * Get all products with stock details
   */
  async getInventory() {
    const { data, error } = await supabaseClient
      .from('products')
      .select('id, name, name_bn, stock_quantity, unit, price, cost_price, is_active, category_id, categories(name, name_bn, slug)')
      .order('stock_quantity', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Update stock count for a single product
   */
  async updateStock(productId, newQuantity, note = 'Manual stock adjustment') {
    const qty = Math.max(0, parseInt(newQuantity) || 0)
    const { data, error } = await supabaseClient
      .from('products')
      .update({ stock_quantity: qty, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Quick restock addition
   */
  async quickRestock(productId, currentQuantity, incrementAmount = 20, note = 'Quick restock') {
    const newQty = (Number(currentQuantity) || 0) + Number(incrementAmount)
    return this.updateStock(productId, newQty, note)
  },

  /**
   * Batch update stock counts from edits map: { [id]: newQty }
   */
  async batchUpdateStock(editsMap) {
    const results = []
    for (const [id, qty] of Object.entries(editsMap)) {
      const res = await this.updateStock(id, qty)
      results.push(res)
    }
    return results
  },

  /**
   * Get stock audit trail / inventory transactions
   * Relationship: products -> inventory_transactions
   */
  async getTransactions({ productId = null, limit = 50 } = {}) {
    let query = supabaseClient
      .from('inventory_transactions')
      .select(`
        id,
        product_id,
        changed_by,
        transaction_type,
        quantity_change,
        stock_before,
        stock_after,
        order_id,
        note,
        created_at,
        products (id, name, name_bn, unit)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Inventory transactions query notice:', error)
      return []
    }
    return data || []
  },

  /**
   * Explicitly record an inventory transaction audit entry
   */
  async recordTransaction({ productId, type = 'adjustment', quantityChange, stockBefore, stockAfter, orderId = null, note = '' }) {
    const { data, error } = await supabaseClient
      .from('inventory_transactions')
      .insert([{
        product_id: productId,
        transaction_type: type,
        quantity_change: quantityChange,
        stock_before: stockBefore,
        stock_after: stockAfter,
        order_id: orderId,
        note: note
      }])
      .select()
      .single()

    if (error) {
      console.warn('Record inventory transaction notice:', error)
      return null
    }
    return data
  }
}

export default inventoryService
