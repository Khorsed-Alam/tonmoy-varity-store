export const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || '৳'
export const DEFAULT_DELIVERY_FEE = Number(import.meta.env.VITE_DELIVERY_FEE) || 50
export const DEFAULT_FREE_DELIVERY_THRESHOLD = Number(import.meta.env.VITE_FREE_DELIVERY_THRESHOLD) || 500

/**
 * Format a number as Bangladeshi Taka currency (e.g. ৳১,৫০০ or ৳1,500)
 * @param {number|string} amount
 * @param {'bn'|'en'} locale
 * @returns {string}
 */
export function formatCurrency(amount, locale = 'bn') {
  const num = Number(amount) || 0
  if (locale === 'bn') {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    const parts = num.toLocaleString('en-IN').split('')
    const bnNum = parts.map(char => (char >= '0' && char <= '9' ? bnDigits[Number(char)] : char)).join('')
    return `${CURRENCY_SYMBOL}${bnNum}`
  }
  return `${CURRENCY_SYMBOL}${num.toLocaleString('en-IN')}`
}

/**
 * Calculate delivery fee based on cart subtotal and delivery method
 * @param {number} subtotal
 * @param {'home_delivery'|'store_pickup'} method
 * @returns {number}
 */
export function calculateDeliveryFee(subtotal, method = 'home_delivery') {
  if (method === 'store_pickup') return 0
  if (subtotal >= DEFAULT_FREE_DELIVERY_THRESHOLD) return 0
  return DEFAULT_DELIVERY_FEE
}

