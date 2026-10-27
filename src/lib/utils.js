// Currency formatting for BDT
export const formatCurrency = (amount) => {
  return `৳${Number(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// Date formatting with Bengali locale
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateEN = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Order status display
export const ORDER_STATUS = {
  pending: { label: 'অপেক্ষমান', labelEN: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'নিশ্চিত', labelEN: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'প্রক্রিয়াধীন', labelEN: 'Processing', color: 'bg-purple-100 text-purple-800' },
  ready: { label: 'প্রস্তুত', labelEN: 'Ready', color: 'bg-teal-100 text-teal-800' },
  out_for_delivery: { label: 'ডেলিভারিতে', labelEN: 'Out for Delivery', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'পৌঁছে গেছে', labelEN: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'বাতিল', labelEN: 'Cancelled', color: 'bg-red-100 text-red-800' },
}

export const DELIVERY_METHODS = {
  home_delivery: { label: 'হোম ডেলিভারি', labelEN: 'Home Delivery' },
  store_pickup: { label: 'স্টোর পিকআপ', labelEN: 'Store Pickup' },
}

export const PAYMENT_METHODS = {
  cash_on_delivery: { label: 'ক্যাশ অন ডেলিভারি', labelEN: 'Cash on Delivery' },
  pay_at_store: { label: 'স্টোরে পেমেন্ট', labelEN: 'Pay at Store' },
}

// Delivery fee calculation
export const DELIVERY_FEE = Number(import.meta.env.VITE_DELIVERY_FEE) || 50
export const FREE_DELIVERY_THRESHOLD = Number(import.meta.env.VITE_FREE_DELIVERY_THRESHOLD) || 500

export const calculateDeliveryFee = (subtotal, deliveryMethod) => {
  if (deliveryMethod === 'store_pickup') return 0
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
  return DELIVERY_FEE
}

// Truncate text
export const truncate = (str, maxLength = 60) => {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str
}

// Slugify for URLs
export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Get image URL from Supabase Storage
export const getProductImageUrl = (supabaseClient, path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = supabaseClient.storage.from('product-images').getPublicUrl(path)
  return data?.publicUrl || null
}
